import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { mailGonder, mailHtmlRender } from "@/lib/mail";
import { BildirimMail } from "@/lib/mail-templates/bildirim";
import {
  BildirimDigestMail,
  type BildirimDigestSatir,
} from "@/lib/mail-templates/bildirim-digest";
import { bearerTokenEslesiyorMu } from "@/lib/bearer-auth";
import { metrikArttir } from "@/lib/bildirim-metrikler";
import { logger } from "@/lib/logger";

// Adım 4 / Faz 5.5 — E-mail digest cron endpoint'i.
//
// 5 dakikada bir tetiklenir (vercel.json):
// 1. BEKLIYOR durumundaki tüm bildirimleri çek (limit 5000)
// 2. Alıcı bazında grupla
// 3. Tek olay → BildirimMail (mevcut tek-mail template'i)
//    Çok olay → BildirimDigestMail (özet template)
// 4. Mail başarılıysa GONDERILDI, hatalıysa BASARISIZ
//
// Güvenlik: CRON_SECRET Bearer token (Kural V.3/147)

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type KuyrukSatiri = {
  id: bigint;
  alici_id: string;
  baslik: string;
  ozet: string | null;
  kart_id: string | null;
  proje_id: string | null;
  tip: string;
};

function deepLink(
  appUrl: string,
  satir: { kart_id: string | null; proje_id: string | null },
): string {
  if (satir.kart_id && satir.proje_id) {
    return `${appUrl}/projeler/${satir.proje_id}?kart=${satir.kart_id}`;
  }
  if (satir.proje_id) return `${appUrl}/projeler/${satir.proje_id}`;
  return `${appUrl}/bildirimler`;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("[cron-digest] CRON_SECRET tanımlı değil");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!bearerTokenEslesiyorMu(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    // 1. BEKLIYOR satırları al
    const bekleyenler = (await db.bildirimMailKuyrugu.findMany({
      where: { durum: "BEKLIYOR" },
      orderBy: { olusturma_zamani: "asc" },
      take: 5000,
      select: {
        id: true,
        alici_id: true,
        baslik: true,
        ozet: true,
        kart_id: true,
        proje_id: true,
        tip: true,
      },
    })) as KuyrukSatiri[];

    if (bekleyenler.length === 0) {
      return NextResponse.json({ ok: true, gonderilen: 0, alici: 0 });
    }

    // 2. Alıcı bazında grupla
    const grup = new Map<string, KuyrukSatiri[]>();
    for (const b of bekleyenler) {
      const arr = grup.get(b.alici_id) ?? [];
      arr.push(b);
      grup.set(b.alici_id, arr);
    }

    // 3. Alıcı kullanıcılarını al (email için)
    const aliciIdler = Array.from(grup.keys());
    const kullanicilar = await db.kullanici.findMany({
      where: {
        id: { in: aliciIdler },
        aktif: true,
        silindi_mi: false,
      },
      select: { id: true, email: true },
    });
    const emailMap = new Map(kullanicilar.map((k) => [k.id, k.email]));

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:2500";
    const tercihUrl = `${appUrl}/ayarlar/bildirimler`;

    let gonderilen = 0;
    let basarisiz = 0;
    const tamamlananIds: bigint[] = [];
    const basarisizIds: { id: bigint; hata: string }[] = [];

    // 4. Her alıcı için tek mail at
    for (const [aliciId, satirlar] of grup) {
      const email = emailMap.get(aliciId);
      if (!email) {
        // Kullanıcı silinmiş/inaktif → kuyruktaki satırları BASARISIZ olarak işaretle
        for (const s of satirlar) {
          basarisizIds.push({ id: s.id, hata: "Alıcı bulunamadı" });
        }
        continue;
      }

      try {
        let html: string;
        let konu: string;
        let govde: string;

        if (satirlar.length === 1 && satirlar[0]) {
          // Tek olay: standart BildirimMail template
          const tek = satirlar[0];
          const url = deepLink(appUrl, tek);
          html = await mailHtmlRender(
            BildirimMail({
              baslik: tek.baslik,
              ozet: tek.ozet,
              url,
              tercihUrl,
            }) as React.ReactElement,
          );
          konu = tek.baslik;
          govde = `${tek.baslik}\n\n${tek.ozet ?? ""}\n\nAç: ${url}`;
        } else {
          // Birden fazla: digest template
          const digestSatirlar: BildirimDigestSatir[] = satirlar.map((s) => ({
            baslik: s.baslik,
            ozet: s.ozet,
            url: deepLink(appUrl, s),
          }));
          html = await mailHtmlRender(
            BildirimDigestMail({
              toplamOlay: satirlar.length,
              satirlar: digestSatirlar,
              tercihUrl,
            }) as React.ReactElement,
          );
          konu = `Pusula — ${satirlar.length} yeni olay`;
          govde = digestSatirlar
            .map((s) => `• ${s.baslik}${s.ozet ? `: ${s.ozet}` : ""} → ${s.url}`)
            .join("\n");
        }

        await mailGonder({ alici: email, konu, govde, html });
        gonderilen++;
        metrikArttir("bildirim.email.gonderildi", satirlar.length);
        for (const s of satirlar) tamamlananIds.push(s.id);
      } catch (err) {
        basarisiz++;
        metrikArttir("bildirim.email.basarisiz", satirlar.length);
        const hata = err instanceof Error ? err.message : String(err);
        for (const s of satirlar) basarisizIds.push({ id: s.id, hata });
        logger.warn(
          { alici: email, hata },
          "[cron-digest] alıcıya gönderim başarısız",
        );
      }
    }

    // 5. Durum güncellemeleri (batch)
    const simdi = new Date();
    if (tamamlananIds.length > 0) {
      await db.bildirimMailKuyrugu.updateMany({
        where: { id: { in: tamamlananIds } },
        data: { durum: "GONDERILDI", gonderim_zamani: simdi },
      });
    }
    // Başarısızlar — tek tek hata mesajı tutmak için (updateMany hata
    // kolonunu satır bazında ayarlayamaz)
    for (const { id, hata } of basarisizIds) {
      await db.bildirimMailKuyrugu.update({
        where: { id },
        data: {
          durum: "BASARISIZ",
          gonderim_zamani: simdi,
          hata: hata.slice(0, 500),
        },
      });
    }

    metrikArttir("bildirim.cron.tetiklendi");
    logger.info(
      {
        bekleyen: bekleyenler.length,
        alici: aliciIdler.length,
        gonderilen,
        basarisiz,
      },
      "[cron-digest] bitti",
    );

    return NextResponse.json({
      ok: true,
      bekleyen: bekleyenler.length,
      alici: aliciIdler.length,
      gonderilen,
      basarisiz,
    });
  } catch (err) {
    metrikArttir("bildirim.cron.basarisiz");
    logger.error({ hata: String(err) }, "[cron-digest] iç hata");
    return NextResponse.json(
      { ok: false, hata: "İç hata" },
      { status: 500 },
    );
  }
}

export const GET = POST;
