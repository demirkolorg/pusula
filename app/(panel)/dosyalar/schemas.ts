// ADR-0028 / F4 — Dosya yönetimi Zod şemaları (server action contract'ları).
// Tüm girdiler bu şemalardan geçer (Kural 49 — server tarafı validasyon).

import { z } from "zod";
import { DosyaGizlilik, DosyaKaynakTipi } from "@prisma/client";

const uuid = z.string().uuid();
const trimliMetin = (max: number) =>
  z.string().trim().min(1).max(max);

// v1 UI yalnız KART/PROJE/LISTE bağlantısı oluşturur (ADR-0028).
const v1KaynakTipi = z.enum(["KART", "PROJE", "LISTE"]);

// ============================================================
// Listeleme + filtreler (Plan Bölüm 13)
// ============================================================

export const dosyaListeFiltreSemasi = z
  .object({
    arama: z.string().trim().max(200).optional(),
    kategori: z
      .enum(["GORSEL", "PDF", "OFIS_BELGESI", "TABLO", "SUNUM", "METIN", "ARSIV", "DIGER"])
      .optional(),
    proje_id: uuid.optional(),
    liste_id: uuid.optional(),
    kart_id: uuid.optional(),
    yukleyen_id: uuid.optional(),
    durum: z.enum(["YUKLENIYOR", "HAZIR", "KARANTINA", "HATALI"]).optional(),
    gizlilik: z.enum(["NORMAL", "HASSAS", "GIZLI"]).optional(),
    silinmis: z.boolean().optional(),
    baglantisiz: z.boolean().optional(),
    boyut_min: z.number().int().min(0).optional(),
    boyut_max: z.number().int().min(0).optional(),
    tarih_baslangic: z.coerce.date().optional(),
    tarih_bitis: z.coerce.date().optional(),
    siralama: z
      .enum([
        "yeni-eklenen",
        "eski-eklenen",
        "ad-asc",
        "ad-desc",
        "boyut-asc",
        "boyut-desc",
        "son-indirme",
      ])
      .default("yeni-eklenen"),
    cursor: uuid.optional(),
    limit: z.number().int().min(1).max(50).default(50),
  })
  .refine(
    (v) =>
      v.boyut_min === undefined ||
      v.boyut_max === undefined ||
      v.boyut_min <= v.boyut_max,
    { path: ["boyut_max"], message: "Maks boyut, min boyutdan küçük olamaz." },
  );

export type DosyaListeFiltre = z.infer<typeof dosyaListeFiltreSemasi>;

export const dosyaDetaySemasi = z.object({ id: uuid });
export type DosyaDetayGirdi = z.infer<typeof dosyaDetaySemasi>;

// ============================================================
// Upload akışı
// ============================================================

export const dosyaYuklemeBaslatSemasi = z.object({
  kaynak_tip: v1KaynakTipi,
  kaynak_id: uuid,
  ad: trimliMetin(255),
  mime: trimliMetin(255),
  boyut: z.number().int().min(1),
});
export type DosyaYuklemeBaslatGirdi = z.infer<typeof dosyaYuklemeBaslatSemasi>;

export const dosyaYuklemeOnaylaSemasi = z.object({
  oturum_id: uuid,
  hash_sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
});
export type DosyaYuklemeOnaylaGirdi = z.infer<typeof dosyaYuklemeOnaylaSemasi>;

// Aynı dosya için yeni sürüm — mevcut Dosya kaydına bağlı upload başlatır.
export const dosyaSurumYuklemeBaslatSemasi = z.object({
  dosya_id: uuid,
  ad: trimliMetin(255),
  mime: trimliMetin(255),
  boyut: z.number().int().min(1),
  aciklama: z.string().trim().max(2000).optional(),
});
export type DosyaSurumYuklemeBaslatGirdi = z.infer<
  typeof dosyaSurumYuklemeBaslatSemasi
>;

export const dosyaSurumYuklemeOnaylaSemasi = z.object({
  oturum_id: uuid,
  aciklama: z.string().trim().max(2000).optional(),
});
export type DosyaSurumYuklemeOnaylaGirdi = z.infer<
  typeof dosyaSurumYuklemeOnaylaSemasi
>;

// ============================================================
// Download / Önizleme
// ============================================================

export const dosyaIndirSemasi = z.object({
  id: uuid,
  surum_id: uuid.optional(),
});
export type DosyaIndirGirdi = z.infer<typeof dosyaIndirSemasi>;

export const dosyaOnizlemeSemasi = z.object({ id: uuid });
export type DosyaOnizlemeGirdi = z.infer<typeof dosyaOnizlemeSemasi>;

export const dosyaMetinIcerikSemasi = z.object({ id: uuid });
export type DosyaMetinIcerikGirdi = z.infer<typeof dosyaMetinIcerikSemasi>;

// ============================================================
// Metadata güncelleme
// ============================================================

export const dosyaAdGuncelleSemasi = z.object({
  id: uuid,
  ad: trimliMetin(255),
});
export type DosyaAdGuncelleGirdi = z.infer<typeof dosyaAdGuncelleSemasi>;

export const dosyaAciklamaGuncelleSemasi = z.object({
  id: uuid,
  aciklama: z.string().trim().max(2000).nullable(),
});
export type DosyaAciklamaGuncelleGirdi = z.infer<
  typeof dosyaAciklamaGuncelleSemasi
>;

export const dosyaGizlilikGuncelleSemasi = z.object({
  id: uuid,
  gizlilik: z.enum([
    DosyaGizlilik.NORMAL,
    DosyaGizlilik.HASSAS,
    DosyaGizlilik.GIZLI,
  ]),
});
export type DosyaGizlilikGuncelleGirdi = z.infer<
  typeof dosyaGizlilikGuncelleSemasi
>;

// ============================================================
// Etiket
// ============================================================

export const dosyaEtiketleriGuncelleSemasi = z.object({
  dosya_id: uuid,
  etiket_idleri: z.array(uuid).max(50),
});
export type DosyaEtiketleriGuncelleGirdi = z.infer<
  typeof dosyaEtiketleriGuncelleSemasi
>;

export const dosyaEtiketiOlusturSemasi = z.object({
  proje_id: uuid.optional(),
  ad: trimliMetin(60),
  renk: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});
export type DosyaEtiketiOlusturGirdi = z.infer<
  typeof dosyaEtiketiOlusturSemasi
>;

export const dosyaEtiketiSilSemasi = z.object({ id: uuid });
export type DosyaEtiketiSilGirdi = z.infer<typeof dosyaEtiketiSilSemasi>;

// ============================================================
// Bağlantı
// ============================================================

export const dosyaBaglantiEkleSemasi = z.object({
  dosya_id: uuid,
  kaynak_tip: v1KaynakTipi,
  kaynak_id: uuid,
});
export type DosyaBaglantiEkleGirdi = z.infer<typeof dosyaBaglantiEkleSemasi>;

export const dosyaBaglantiKaldirSemasi = z.object({
  baglanti_id: uuid,
});
export type DosyaBaglantiKaldirGirdi = z.infer<
  typeof dosyaBaglantiKaldirSemasi
>;

// ============================================================
// Silme / Geri yükleme / Kalıcı silme
// ============================================================

export const dosyaSilSemasi = z.object({ id: uuid });
export type DosyaSilGirdi = z.infer<typeof dosyaSilSemasi>;

export const dosyaGeriYukleSemasi = z.object({ id: uuid });
export type DosyaGeriYukleGirdi = z.infer<typeof dosyaGeriYukleSemasi>;

export const dosyaKaliciSilSemasi = z.object({ id: uuid });
export type DosyaKaliciSilGirdi = z.infer<typeof dosyaKaliciSilSemasi>;

// Type re-export (DosyaKaynakTipi enum'una server tarafında gerek var).
export { DosyaKaynakTipi };
