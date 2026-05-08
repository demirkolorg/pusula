// Sprint 3 / S3-4 — Bildirim tetikleyicileri için ortak yardımcılar.
// Tüm tetikleyiciler bu helper'ları paylaşır.

import { db } from "@/lib/db";
import { mentionIdleriniCikar } from "@/lib/mention-format";

// =====================================================================
// Kart bağlamı (ad + proje_id) — derin link için
// =====================================================================

export async function kartBaglami(kartId: string): Promise<{
  baslik: string;
  proje_id: string;
} | null> {
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: { baslik: true, liste: { select: { proje_id: true } } },
  });
  if (!k) return null;
  return { baslik: k.baslik, proje_id: k.liste.proje_id };
}

export async function adSoyad(kullaniciId: string): Promise<string> {
  const u = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { ad: true, soyad: true },
  });
  return u ? `${u.ad} ${u.soyad}`.trim() : "Bir kullanıcı";
}

export async function projeAdiniGetir(
  projeId: string,
): Promise<string | null> {
  const p = await db.proje.findUnique({
    where: { id: projeId },
    select: { ad: true },
  });
  return p?.ad ?? null;
}

// =====================================================================
// Kart yetki bağlamı + alıcı listesi yardımcıları
// =====================================================================

export type KartYetkiBaglami = {
  id: string;
  baslik: string;
  bitis?: Date | null;
  liste: {
    proje_id: string;
    yetkililer: { kullanici_id: string }[];
    birimler: { birim_id: string }[];
    proje: {
      yetkililer: { kullanici_id: string }[];
      birimler: { birim_id: string }[];
    };
  };
  yetkililer: { kullanici_id: string }[];
  birimler: { birim_id: string }[];
};

export function kartKisiIdleri(kart: KartYetkiBaglami): Set<string> {
  const idler = new Set<string>();
  for (const yetkili of kart.liste.proje.yetkililer) {
    idler.add(yetkili.kullanici_id);
  }
  for (const yetkili of kart.liste.yetkililer) {
    idler.add(yetkili.kullanici_id);
  }
  for (const yetkili of kart.yetkililer) {
    idler.add(yetkili.kullanici_id);
  }
  return idler;
}

export function kartBirimIdleri(kart: KartYetkiBaglami): Set<string> {
  const idler = new Set<string>();
  for (const birim of kart.liste.proje.birimler) idler.add(birim.birim_id);
  for (const birim of kart.liste.birimler) idler.add(birim.birim_id);
  for (const birim of kart.birimler) idler.add(birim.birim_id);
  return idler;
}

export async function kartYetkiliAliciMap(
  kartlar: KartYetkiBaglami[],
  haricIdler: readonly string[] = [],
): Promise<Map<string, string[]>> {
  const tumBirimIdleri = new Set<string>();
  for (const kart of kartlar) {
    for (const birimId of kartBirimIdleri(kart)) tumBirimIdleri.add(birimId);
  }

  const birimKullanicilari =
    tumBirimIdleri.size === 0
      ? []
      : await db.kullanici.findMany({
          where: {
            birim_id: { in: Array.from(tumBirimIdleri) },
            aktif: true,
            silindi_mi: false,
            onay_durumu: "ONAYLANDI",
          },
          select: { id: true, birim_id: true },
        });

  const birimMap = new Map<string, string[]>();
  for (const kullanici of birimKullanicilari) {
    if (!kullanici.birim_id) continue;
    const liste = birimMap.get(kullanici.birim_id) ?? [];
    liste.push(kullanici.id);
    birimMap.set(kullanici.birim_id, liste);
  }

  const haric = new Set(haricIdler);
  const sonuc = new Map<string, string[]>();
  for (const kart of kartlar) {
    const idler = kartKisiIdleri(kart);
    for (const birimId of kartBirimIdleri(kart)) {
      for (const kullaniciId of birimMap.get(birimId) ?? []) {
        idler.add(kullaniciId);
      }
    }
    for (const id of haric) idler.delete(id);
    sonuc.set(kart.id, Array.from(idler));
  }
  return sonuc;
}

export async function kartYetkiBaglami(
  kartId: string,
): Promise<KartYetkiBaglami | null> {
  return db.kart.findUnique({
    where: { id: kartId },
    select: {
      id: true,
      baslik: true,
      liste: {
        select: {
          proje_id: true,
          yetkililer: { select: { kullanici_id: true } },
          birimler: { select: { birim_id: true } },
          proje: {
            select: {
              yetkililer: { select: { kullanici_id: true } },
              birimler: { select: { birim_id: true } },
            },
          },
        },
      },
      yetkililer: { select: { kullanici_id: true } },
      birimler: { select: { birim_id: true } },
    },
  });
}

// Düşük seviye yardımcı: kart üyelerini topla (yetkililer + birim üyeleri).
// Mevcut kartYetkiliBaglami / kartYetkiliAliciMap iç ayrıntılarını yeniden
// kullanmak yerine, bu fazda doğrudan kart yetki bağlamından alıcı listesi
// üretmek daha doğru — düşük öncelikli "değişti" bildirimleri için aynı
// yetki ağacı geçerli.
export async function kartUyeleriniToplaHaricli(
  kartId: string,
  haricId: string | null,
): Promise<{ aliciIdler: string[]; projeId: string; baslik: string } | null> {
  const kart = await kartYetkiBaglami(kartId);
  if (!kart) return null;
  const yetkiliMap = await kartYetkiliAliciMap(
    [kart],
    haricId ? [haricId] : [],
  );
  return {
    aliciIdler: yetkiliMap.get(kart.id) ?? [],
    projeId: kart.liste.proje_id,
    baslik: kart.baslik,
  };
}

// =====================================================================
// Tamamlama yetkilileri (KART_TAMAMLA izinli + karta erişen)
// =====================================================================

// KART_TAMAMLA izinli kullanıcıları bul. Öneri tetiklendiğinde KARAR
// vereceklere (yetkililere) bildirim gider; standart kart üyesi seti yerine
// "kart kapatabilen" set kullanılır. SUPER_ADMIN + KAYMAKAM her zaman
// bu sete dahildir (tüm projelere makam katmanı erişimi var). Kart düzeyi
// üyelik PR-1'de yetersiz çünkü kart üyesi olmak otomatik tamamla yetkisi
// vermiyordu — sadece KART_TAMAMLA izinli + kart erişimli olanlar.
export async function kartTamamlamaYetkilileriniBul(
  kartId: string,
  haricIdler: readonly string[] = [],
): Promise<string[]> {
  // Adım 1: KART_TAMAMLA iznine sahip rolleri olan tüm aktif kullanıcılar.
  const izinliler = await db.kullanici.findMany({
    where: {
      aktif: true,
      silindi_mi: false,
      onay_durumu: "ONAYLANDI",
      roller: {
        some: {
          rol: {
            izinler: {
              some: { izin: { kod: { in: ["kart:tamamla", "*"] } } },
            },
          },
        },
      },
    },
    select: { id: true },
  });
  const izinliIdler = new Set(izinliler.map((k) => k.id));

  // Adım 2: Bu kullanıcıların hangileri bu karta erişebiliyor?
  const kart = await kartYetkiBaglami(kartId);
  if (!kart) return [];

  const erisenIdler = kartKisiIdleri(kart);
  const birimIdleri = kartBirimIdleri(kart);
  if (birimIdleri.size > 0) {
    const birimUyeleri = await db.kullanici.findMany({
      where: {
        birim_id: { in: Array.from(birimIdleri) },
        aktif: true,
        silindi_mi: false,
        onay_durumu: "ONAYLANDI",
      },
      select: { id: true },
    });
    for (const k of birimUyeleri) erisenIdler.add(k.id);
  }

  // Makam (KAYMAKAM/SUPER_ADMIN) zaten KART_TAMAMLA izinli + tüm projelere
  // erişimli; izinliIdler içinde olduğu için kesişim onları yakalar.
  // Sıkı kesişim: izinliler ∩ erişenler. Makam'lar erisenIdler'da olmasa
  // bile izinliIdler'da; * iznine sahipler için ekstra dahil ediyoruz:
  const makamlar = await db.kullanici.findMany({
    where: {
      aktif: true,
      silindi_mi: false,
      onay_durumu: "ONAYLANDI",
      roller: {
        some: { rol: { izinler: { some: { izin: { kod: "*" } } } } },
      },
    },
    select: { id: true },
  });
  for (const m of makamlar) erisenIdler.add(m.id);

  const haric = new Set(haricIdler);
  const sonuc: string[] = [];
  for (const id of izinliIdler) {
    if (erisenIdler.has(id) && !haric.has(id)) sonuc.push(id);
  }
  return sonuc;
}

// =====================================================================
// Madde bağlamı — parent kart bilgisiyle birlikte
// =====================================================================

// Madde için aynı 3 — parent kartın `kartId` ve metin'ini de döner ki
// bildirim ozet'i "kart > madde" formatında olsun.
export async function maddeBaglami(maddeId: string): Promise<{
  kart_id: string;
  metin: string;
  kart_baslik: string;
  proje_id: string;
} | null> {
  const m = await db.kontrolMaddesi.findUnique({
    where: { id: maddeId },
    select: {
      metin: true,
      kontrol_listesi: {
        select: {
          kart_id: true,
          kart: {
            select: {
              baslik: true,
              liste: { select: { proje_id: true } },
            },
          },
        },
      },
    },
  });
  if (!m) return null;
  return {
    kart_id: m.kontrol_listesi.kart_id,
    metin: m.metin,
    kart_baslik: m.kontrol_listesi.kart.baslik,
    proje_id: m.kontrol_listesi.kart.liste.proje_id,
  };
}

// =====================================================================
// Mention parse — yorum içeriğindeki UUID'leri çıkar
// =====================================================================

// Yorum içinde "@uuid" formatında geçen kullanıcıları bulur.
export function mentionParse(icerik: string): string[] {
  return mentionIdleriniCikar(icerik);
}

// =====================================================================
// Tarih biçimi (kart bitiş tarihi vb.)
// =====================================================================

export const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});
