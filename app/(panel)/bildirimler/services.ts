import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import { tercihAliciFiltresi } from "@/lib/bildirim-tercih";
import { mailGonder, mailHtmlRender } from "@/lib/mail";
import { BildirimMail } from "@/lib/mail-templates/bildirim";
import { logger } from "@/lib/logger";
import type {
  BildirimleriListele,
  BildirimOkuduIsaretle,
  BildirimTipi,
} from "./schemas";

export type BildirimOzeti = {
  id: string; // BigInt → string
  tip: BildirimTipi;
  baslik: string;
  ozet: string | null;
  ureten: { id: string; ad: string; soyad: string } | null;
  kart_id: string | null;
  proje_id: string | null;
  kaynak_tip: string | null;
  kaynak_id: string | null;
  meta: Record<string, unknown> | null;
  okundu_mu: boolean;
  olusturma_zamani: Date;
};

// =====================================================================
// Listele + sayım
// =====================================================================

export async function bildirimleriListele(
  aliciId: string,
  girdi: BildirimleriListele,
): Promise<BildirimOzeti[]> {
  const cursorWhere = girdi.cursor
    ? { id: { lt: BigInt(girdi.cursor) } }
    : {};
  const okudFiltre =
    girdi.filtre === "okunmamis"
      ? { okundu_mu: false }
      : girdi.filtre === "okunmus"
        ? { okundu_mu: true }
        : {};

  const ham = await db.bildirim.findMany({
    where: { alici_id: aliciId, ...cursorWhere, ...okudFiltre },
    orderBy: { id: "desc" },
    take: girdi.limit,
    select: {
      id: true,
      tip: true,
      baslik: true,
      ozet: true,
      kart_id: true,
      proje_id: true,
      kaynak_tip: true,
      kaynak_id: true,
      meta: true,
      okundu_mu: true,
      olusturma_zamani: true,
      ureten: { select: { id: true, ad: true, soyad: true } },
    },
  });

  return ham.map((b) => ({
    id: b.id.toString(),
    tip: b.tip,
    baslik: b.baslik,
    ozet: b.ozet,
    ureten: b.ureten,
    kart_id: b.kart_id,
    proje_id: b.proje_id,
    kaynak_tip: b.kaynak_tip,
    kaynak_id: b.kaynak_id,
    meta: b.meta as Record<string, unknown> | null,
    okundu_mu: b.okundu_mu,
    olusturma_zamani: b.olusturma_zamani,
  }));
}

export async function okunmamisSayisi(aliciId: string): Promise<number> {
  return db.bildirim.count({
    where: { alici_id: aliciId, okundu_mu: false },
  });
}

// =====================================================================
// Okudu işaretle
// =====================================================================

export async function bildirimOkuduIsaretle(
  aliciId: string,
  girdi: BildirimOkuduIsaretle,
): Promise<void> {
  // Sadece kendi bildirimlerini işaretleyebilir — ID'yi alıcıya kilitle.
  const ids = girdi.ids.map((s) => {
    try {
      return BigInt(s);
    } catch {
      throw new EylemHatasi("Geçersiz bildirim id.", HATA_KODU.GECERSIZ_GIRDI);
    }
  });
  await db.bildirim.updateMany({
    where: {
      id: { in: ids },
      alici_id: aliciId,
      okundu_mu: false,
    },
    data: { okundu_mu: true, okuma_zamani: new Date() },
  });
}

export async function tumunuOkuduIsaretle(aliciId: string): Promise<void> {
  await db.bildirim.updateMany({
    where: { alici_id: aliciId, okundu_mu: false },
    data: { okundu_mu: true, okuma_zamani: new Date() },
  });
}

/**
 * Faz 5.1 — Karta tıklandığında (modal açılışı) o karta ait tüm okunmamış
 * bildirimleri otomatik okundu işaretle. Slack/Linear UX'i: kart açılınca
 * kullanıcı zaten içeriği gördü kabul edilir, dropdown'daki sayaç
 * temizlensin.
 */
export async function bildirimleriKartaGoreOkuduIsaretle(
  aliciId: string,
  kartId: string,
): Promise<{ guncellenen: number }> {
  const sonuc = await db.bildirim.updateMany({
    where: {
      alici_id: aliciId,
      kart_id: kartId,
      okundu_mu: false,
    },
    data: { okundu_mu: true, okuma_zamani: new Date() },
  });
  return { guncellenen: sonuc.count };
}

// =====================================================================
// Yardımcı: birden fazla alıcıya tek bildirim üret (broadcast pattern)
// =====================================================================

export type BildirimUretGirdi = {
  alici_idler: string[];
  ureten_id: string | null;
  tip: BildirimTipi;
  baslik: string;
  ozet?: string | null;
  kart_id?: string | null;
  proje_id?: string | null;
  kaynak_tip?: string | null;
  kaynak_id?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function bildirimUret(
  girdi: BildirimUretGirdi,
): Promise<{ id: string; alici_id: string }[]> {
  if (girdi.alici_idler.length === 0) return [];
  // Tekilleştir + üreteni dışla (kendine bildirim atma)
  const benzersiz = Array.from(new Set(girdi.alici_idler)).filter(
    (id) => id !== girdi.ureten_id,
  );
  if (benzersiz.length === 0) return [];

  // Faz 3.1 — Kullanıcı tercihi: in-app kapalıysa hem DB kaydı hem realtime
  // broadcast atlanır. Email kanalı Faz 4'te ayrıca kontrol edilir.
  const inAppAlicilari = await tercihAliciFiltresi(
    benzersiz,
    girdi.tip,
    "in_app",
  );
  if (inAppAlicilari.length === 0) return [];

  const data = inAppAlicilari.map((aliciId) => ({
    alici_id: aliciId,
    ureten_id: girdi.ureten_id,
    tip: girdi.tip,
    baslik: girdi.baslik,
    ozet: girdi.ozet ?? null,
    kart_id: girdi.kart_id ?? null,
    proje_id: girdi.proje_id ?? null,
    kaynak_tip: girdi.kaynak_tip ?? null,
    kaynak_id: girdi.kaynak_id ?? null,
    meta: (girdi.meta as object) ?? undefined,
  }));

  // createManyAndReturn yerine $transaction içinde tek tek (id'leri lazım)
  const sonuclar = await db.$transaction(
    data.map((d) =>
      db.bildirim.create({ data: d, select: { id: true, alici_id: true } }),
    ),
  );
  const map = sonuclar.map((s) => ({
    id: s.id.toString(),
    alici_id: s.alici_id,
  }));

  // Realtime broadcast — her alıcının kendi room'una bildirim:yeni yayınla.
  // Echo filtresi: bildirim üreten kullanıcı kendine bildirim almadığı için
  // (üreten dışlanır), echo problemi yok. Yine de zarf ureten_id taşır.
  for (const r of map) {
    yayinla(SOCKET.BILDIRIM_YENI, room.kullanici(r.alici_id), {
      id: r.id,
      tip: girdi.tip,
      baslik: girdi.baslik,
      ozet: girdi.ozet ?? null,
      kart_id: girdi.kart_id ?? null,
      proje_id: girdi.proje_id ?? null,
    }).catch(() => {});
  }

  // Faz 4 — E-mail kanalı (anlık). Bildirim DB kaydı + realtime'dan ayrı:
  // tercih `email_acik=true` olan alıcılar için fire-and-forget mailGonder.
  // Email aktif alıcı listesi in-app'tan farklı olabilir (ikisi bağımsız).
  // Hata yutulur (logger üzerinden gözlemlenebilir) — ana akış bozulmaz.
  void emailKanaliYayinla(girdi).catch((err: unknown) => {
    logger.error(
      { tip: girdi.tip, hata: String(err) },
      "[bildirim-email] gönderim hatası (yutuldu)",
    );
  });

  return map;
}

// E-mail kanal süzgeci + gönderim. bildirimUret sonrası asenkron çalışır.
async function emailKanaliYayinla(girdi: BildirimUretGirdi): Promise<void> {
  const benzersiz = Array.from(new Set(girdi.alici_idler)).filter(
    (id) => id !== girdi.ureten_id,
  );
  if (benzersiz.length === 0) return;
  const emailAlicilari = await tercihAliciFiltresi(
    benzersiz,
    girdi.tip,
    "email",
  );
  if (emailAlicilari.length === 0) return;

  const kullanicilar = await db.kullanici.findMany({
    where: { id: { in: emailAlicilari }, aktif: true, silindi_mi: false },
    select: { id: true, email: true },
  });
  if (kullanicilar.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:2500";
  const url = bildirimDeepLink(appUrl, girdi);
  const tercihUrl = `${appUrl}/ayarlar/bildirimler`;

  const html = await mailHtmlRender(
    BildirimMail({
      baslik: girdi.baslik,
      ozet: girdi.ozet ?? null,
      url,
      tercihUrl,
    }) as React.ReactElement,
  );
  const govde =
    `${girdi.baslik}\n\n${girdi.ozet ?? ""}\n\nAç: ${url}\n\n` +
    `Bu bildirimi almak istemiyorsanız: ${tercihUrl}`;

  // Tek tek gönderim — paralel ama hatalar izole. Promise.all bekler ama
  // dış katman zaten void ile fire-and-forget.
  await Promise.all(
    kullanicilar.map((u) =>
      mailGonder({
        alici: u.email,
        konu: girdi.baslik,
        govde,
        html,
      }).catch((err: unknown) => {
        logger.warn(
          { alici: u.email, tip: girdi.tip, hata: String(err) },
          "[bildirim-email] tek alıcıda hata",
        );
      }),
    ),
  );
}

function bildirimDeepLink(
  appUrl: string,
  girdi: BildirimUretGirdi,
): string {
  if (girdi.kart_id && girdi.proje_id) {
    return `${appUrl}/projeler/${girdi.proje_id}?kart=${girdi.kart_id}`;
  }
  if (girdi.proje_id) {
    return `${appUrl}/projeler/${girdi.proje_id}`;
  }
  return `${appUrl}/bildirimler`;
}
