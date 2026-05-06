import { z } from "zod";

// Ana sayfa metrik kartları için sayısal özet.
// Zod ile çıkarılan tip; service fonksiyonları bu şekli garanti eder.
//
// ADR-0026 — kapsam alanı kullanıcının yetki ölçeğini taşır:
//   "kisisel" → PERSONEL + BIRIM_AMIRI: kart yetkilisi olduğu işler
//   "sistem"  → KAYMAKAM + SUPER_ADMIN: makam, sistemin tamamı
// UI başlık/altyazıyı bu bayrağa göre seçer; servis ise count where
// kümesini bu ayrıma göre kurar.
export const anaSayfaMetrikSemasi = z.object({
  kapsam: z.enum(["kisisel", "sistem"]),
  acikGorev: z.number().int().min(0),
  geciken: z.number().int().min(0),
  buHaftaBitenlerim: z.number().int().min(0),
  buHaftaTamamladiklarim: z.number().int().min(0),
  buHaftaTakim: z.number().int().min(0),
  // Kişisel: bana gelen / ben gönderdim ayrımı taşınır.
  // Sistem: aktif davet sayısı tek alan olarak (tum) gösterilir; gelen/giden
  // alanları o modda 0 döner.
  bekleyenDavetGelen: z.number().int().min(0),
  bekleyenDavetGiden: z.number().int().min(0),
  bekleyenDavetTum: z.number().int().min(0),
});

export type AnaSayfaMetrik = z.infer<typeof anaSayfaMetrikSemasi>;

// ADR-0026 — Makam KPI şeridi. Sadece SUPER_ADMIN/KAYMAKAM görür; service
// non-makam için null döner, page.tsx mount kararını buna göre verir.
export const makamKpiSemasi = z.object({
  aktifProje: z.number().int().min(0),
  aktifKullaniciSon7Gun: z.number().int().min(0),
  onayBekleyenKullanici: z.number().int().min(0),
  kritikHataSon24Sa: z.number().int().min(0),
});

export type MakamKpi = z.infer<typeof makamKpiSemasi>;

// Bana atanan kart satırı — kart modal'ı açabilmek için projeId/listeId taşır.
export const benimKartSatirimSemasi = z.object({
  id: z.string().uuid(),
  baslik: z.string(),
  bitis: z.date().nullable(),
  tamamlandi_mi: z.boolean(),
  liste: z.object({
    id: z.string().uuid(),
    ad: z.string(),
    proje: z.object({
      id: z.string().uuid(),
      ad: z.string(),
      kapak_renk: z.string().nullable(),
      kapak_ikon: z.string().nullable(),
    }),
  }),
});

export type BenimKartSatirim = z.infer<typeof benimKartSatirimSemasi>;

// Ana sayfa "Son Aktiviteler" widget'ı, proje aktivite modülünün olgun
// `AktiviteOzeti` tipini paylaşır (mesaj + diff + bağlam = aynı yapı).
// Tek kaynaktan render ile UI tutarlılığı sağlanır (denetim/proje/ana sayfa).
export type { AktiviteOzeti as SonAktiviteSatiri } from "@/app/(panel)/projeler/[projeId]/aktivite/services";

// Son ziyaret edilen proje satırı — ProjeZiyareti üzerinden çekilir.
export const sonZiyaretProjeSatiriSemasi = z.object({
  proje_id: z.string().uuid(),
  son_ziyaret: z.date(),
  ad: z.string(),
  kapak_renk: z.string().nullable(),
  kapak_ikon: z.string().nullable(),
  yildizli_mi: z.boolean(),
});

export type SonZiyaretProjeSatiri = z.infer<typeof sonZiyaretProjeSatiriSemasi>;
