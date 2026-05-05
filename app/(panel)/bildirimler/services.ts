import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import { tercihAliciFiltresi } from "@/lib/bildirim-tercih";
import { susturmaSuzgeci } from "@/lib/bildirim-susturma";
import { metrikArttir } from "@/lib/bildirim-metrikler";
import { logger } from "@/lib/logger";
import {
  mentionIdleriniCikar,
  mentionlariGorunenMetneCevir,
  type MentionKisiMap,
} from "@/lib/mention-format";
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

type BildirimMetinleri = {
  baslik: string;
  ozet: string | null;
};

function bildirimMentionIdleri(
  metinler: ReadonlyArray<string | null | undefined>,
): string[] {
  const idler = new Set<string>();
  for (const metin of metinler) {
    for (const id of mentionIdleriniCikar(metin)) idler.add(id);
  }
  return Array.from(idler);
}

async function bildirimMentionKisiMap(
  idler: ReadonlyArray<string>,
): Promise<MentionKisiMap> {
  if (idler.length === 0) return new Map();
  const kisiler = await db.kullanici.findMany({
    where: { id: { in: Array.from(idler) } },
    select: { id: true, ad: true, soyad: true },
  });
  return new Map(
    kisiler.map((k) => [k.id.toLowerCase(), { ad: k.ad, soyad: k.soyad }]),
  );
}

function bildirimMetniniGorunurYap(
  metin: string | null,
  kisiMap: MentionKisiMap,
): string | null {
  if (metin === null) return null;
  return mentionlariGorunenMetneCevir(metin, kisiMap);
}

async function bildirimMetinleriniGorunurYap(
  metinler: BildirimMetinleri,
): Promise<BildirimMetinleri> {
  const kisiMap = await bildirimMentionKisiMap(
    bildirimMentionIdleri([metinler.baslik, metinler.ozet]),
  );
  return {
    baslik: bildirimMetniniGorunurYap(metinler.baslik, kisiMap) ?? metinler.baslik,
    ozet: bildirimMetniniGorunurYap(metinler.ozet, kisiMap),
  };
}

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

  const mentionKisiMap = await bildirimMentionKisiMap(
    bildirimMentionIdleri(ham.flatMap((b) => [b.baslik, b.ozet])),
  );

  return ham.map((b) => ({
    id: b.id.toString(),
    tip: b.tip,
    baslik: bildirimMetniniGorunurYap(b.baslik, mentionKisiMap) ?? b.baslik,
    ozet: bildirimMetniniGorunurYap(b.ozet, mentionKisiMap),
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
  metrikArttir("bildirim.uretildi.toplam");
  metrikArttir("bildirim.tipi", 1, { tip: girdi.tip });
  // Tekilleştir + üreteni dışla (kendine bildirim atma)
  const benzersiz = Array.from(new Set(girdi.alici_idler)).filter(
    (id) => id !== girdi.ureten_id,
  );
  if (benzersiz.length === 0) return [];

  // Faz 5.3 + Adım 2 — Susturma süzgeçleri (kart-bazlı + proje-bazlı):
  // her iki katman da bağımsız çalışır, AND mantığı. Her ikisinden de
  // geçen alıcılar in-app ve email kanallarına gider.
  const susturmadanGecen = await susturmaSuzgeci(
    benzersiz,
    girdi.kart_id,
    girdi.proje_id,
  );
  if (susturmadanGecen.length < benzersiz.length) {
    metrikArttir(
      "bildirim.uretildi.susturma_dustu",
      benzersiz.length - susturmadanGecen.length,
    );
  }
  if (susturmadanGecen.length === 0) return [];

  // Faz 3.1 — Kullanıcı tercihi: in-app kapalıysa hem DB kaydı hem realtime
  // broadcast atlanır. Email kanalı Faz 4'te ayrıca kontrol edilir.
  const inAppAlicilari = await tercihAliciFiltresi(
    susturmadanGecen,
    girdi.tip,
    "in_app",
  );
  if (inAppAlicilari.length < susturmadanGecen.length) {
    metrikArttir(
      "bildirim.uretildi.in_app_dustu",
      susturmadanGecen.length - inAppAlicilari.length,
    );
  }
  if (inAppAlicilari.length === 0) return [];

  const metinler = await bildirimMetinleriniGorunurYap({
    baslik: girdi.baslik,
    ozet: girdi.ozet ?? null,
  });

  const data = inAppAlicilari.map((aliciId) => ({
    alici_id: aliciId,
    ureten_id: girdi.ureten_id,
    tip: girdi.tip,
    baslik: metinler.baslik,
    ozet: metinler.ozet,
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
      baslik: metinler.baslik,
      ozet: metinler.ozet,
      kart_id: girdi.kart_id ?? null,
      proje_id: girdi.proje_id ?? null,
    }).catch(() => {});
  }

  // Faz 4 — E-mail kanalı (anlık). Bildirim DB kaydı + realtime'dan ayrı:
  // tercih `email_acik=true` olan alıcılar için fire-and-forget mailGonder.
  // Email aktif alıcı listesi in-app'tan farklı olabilir (ikisi bağımsız).
  // Hata yutulur (logger üzerinden gözlemlenebilir) — ana akış bozulmaz.
  void emailKanaliYayinla({ ...girdi, ...metinler }).catch((err: unknown) => {
    logger.error(
      { tip: girdi.tip, hata: String(err) },
      "[bildirim-email] gönderim hatası (yutuldu)",
    );
  });

  return map;
}

// E-mail kanal süzgeci + KUYRUK YAZIMI (Adım 4 / Faz 5.5).
// Önceki: doğrudan mailGonder; şimdiki: BildirimMailKuyrugu BEKLIYOR.
// Cron her 5dk alıcı bazında grupla + tek mail (digest) gönderir.
async function emailKanaliYayinla(girdi: BildirimUretGirdi): Promise<void> {
  const benzersiz = Array.from(new Set(girdi.alici_idler)).filter(
    (id) => id !== girdi.ureten_id,
  );
  if (benzersiz.length === 0) return;
  const susturmadanGecen = await susturmaSuzgeci(
    benzersiz,
    girdi.kart_id,
    girdi.proje_id,
  );
  if (susturmadanGecen.length === 0) return;
  const emailAlicilari = await tercihAliciFiltresi(
    susturmadanGecen,
    girdi.tip,
    "email",
  );
  if (emailAlicilari.length === 0) return;
  if (emailAlicilari.length < benzersiz.length) {
    metrikArttir(
      "bildirim.uretildi.email_dustu",
      benzersiz.length - emailAlicilari.length,
    );
  }

  // Kuyruğa yaz — cron tarafından 5dk pencerede gruplanıp gönderilecek.
  await db.bildirimMailKuyrugu.createMany({
    data: emailAlicilari.map((aliciId) => ({
      alici_id: aliciId,
      tip: girdi.tip,
      baslik: girdi.baslik,
      ozet: girdi.ozet ?? null,
      kart_id: girdi.kart_id ?? null,
      proje_id: girdi.proje_id ?? null,
    })),
  });
}
