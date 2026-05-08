// Sprint 3 / S3-1 — Aktivite servisi parça dosyası: ortak tip + helper.
// ADR-0032 mega dosya bölmesi (1756 satır → 5 parça + barrel).

import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";

// =====================================================================
// Tipler
// =====================================================================

export type AlanDegisikligi = {
  // TR alan etiketi — örn "Başlık", "Bitiş tarihi", "Liste"
  alan: string;
  // Format'lanmış eski/yeni değer (Date → "04.05.2026 14:30", null → "—",
  // boolean → "Evet"/"Hayır", id → join'lenmiş ad). Uzun metin kısaltılmış.
  eski: string | null;
  yeni: string | null;
};

export type AktiviteOzeti = {
  id: string; // BigInt → string (JSON safe)
  zaman: Date;
  kullanici: { id: string; ad: string; soyad: string } | null;
  kategori:
    | "proje"
    | "liste"
    | "kart"
    | "etiket"
    | "yetkili"
    | "kontrol-listesi"
    | "kontrol-maddesi"
    | "yorum"
    | "eklenti"
    | "hedef-birim"
    | "diger";
  islem: "CREATE" | "UPDATE" | "DELETE";
  // TR-formatlı ana mesaj — örn "kart başlığını değiştirdi"
  mesaj: string;
  // Opsiyonel ikincil bilgi (ad, eski/yeni değer kısa özeti)
  detay: string | null;
  // Kaynak modelin id'si — composite PK olan tablolarda null
  // (KartEtiket, KartYetkilisi, KartBirimi). Tümü sekmesinde inline yorum/ek
  // eşleştirmesi için kullanılır.
  kaynak_id: string | null;
  // UPDATE event'lerinde alan-bazlı diff (eski → yeni). UI 2. satırda gösterir.
  // Anlamsız alanlar (sira, guncelleme_zamani, silindi_mi, arsiv_mi vb.)
  // ana mesajda ifade edildiği için listede yer almaz.
  degisiklikler: AlanDegisikligi[] | null;
  // Bağlam — "hangi proje, hangi liste, hangi kart" — proje aktivite modalı
  // ve detay diyaloğu için. Kart modal'ında kart bilgisi zaten bilindiği için
  // orada null kalır. Liste/kart silinmişse ad null olabilir; id varsa silinmiş
  // kayıt göstergesi UI tarafında "(silinmiş kart)" gibi bir fallback üretir.
  baglam: {
    proje: { id: string; ad: string | null } | null;
    liste: { id: string; ad: string | null } | null;
    kart: { id: string; baslik: string | null } | null;
  } | null;
};

// Public — ana sayfa servisi `aktiviteLogu.findMany` sonucunu doğrudan
// `zenginlestirVeOzetle` fonksiyonuna geçirebilsin diye export edilir.
export type HamAktivite = {
  id: bigint;
  zaman: Date;
  kullanici_id: string | null;
  islem: string;
  kaynak_tip: string;
  kaynak_id: string | null;
  yeni_veri: unknown;
  eski_veri: unknown;
  diff: unknown;
};

export type IdMaplar = {
  liste: Map<string, string>;
  kullanici: Map<string, string>;
  eklenti: Map<string, string>;
  birim: Map<string, string>;
};

// Bağlam map'leri — her aktivitenin "hangi proje, hangi liste, hangi kart"
// bağlamını üretmek için. Aktivite kaydının kendisinden veya ilişki
// tablosundan kart_id / liste_id / proje_id çıkarılır, bu map'lerden ad
// bilgisi alınır.
export type BaglamMaplari = {
  kart: Map<string, { id: string; baslik: string | null; liste_id: string }>;
  // Liste detayı: ad + proje_id (kart→liste→proje zinciri için)
  liste: Map<string, { id: string; ad: string | null; proje_id: string }>;
  proje: Map<string, { id: string; ad: string | null }>;
  // KontrolListesi.id → kart_id eşleşmesi (KontrolMaddesi → kart bağlamı için)
  kontrolListesi: Map<string, string>;
};

// =====================================================================
// Karta dolaylı bağlı kayıtların kaynak_tip'leri
// =====================================================================
// JSON içinde "kart_id" alanı bulunan modeller — audit middleware
// yeni_veri/eski_veri'yı select sonucundan alır, bu modellerin tümü
// services.ts'lerde kart_id include ediyor (bkz. yorum/eklenti/etiket
// services).

export const KART_ID_ICEREN_TIPLER = [
  "Yorum",
  "Eklenti",
  "KontrolListesi",
  "KartBirimi",
  "KartYetkilisi",
  "KartEtiket",
] as const;

// =====================================================================
// JSON path helper'ı — audit log yeni_veri/eski_veri okuma
// =====================================================================

export function jsonAlan<T = unknown>(
  j: unknown,
  alan: string,
): T | undefined {
  if (j && typeof j === "object" && alan in j) {
    return (j as Record<string, T>)[alan];
  }
  return undefined;
}

// =====================================================================
// Metin kısaltma — yorum içeriği vb. detay alanı için
// =====================================================================

export function kisalt(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// =====================================================================
// Birim görüntü adı — kisa_ad → ad → tip fallback
// =====================================================================

export function birimGoruntu(k: {
  ad: string | null;
  kisa_ad: string | null;
  tip: string;
}): string {
  return k.kisa_ad ?? k.ad ?? k.tip;
}

// =====================================================================
// Erişim doğrulama — kart varlığı + proje_id
// =====================================================================

export async function kartiBulVeProjeAl(
  _birimId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: { select: { proje_id: true } },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id };
}
