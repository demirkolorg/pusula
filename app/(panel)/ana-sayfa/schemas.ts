import { z } from "zod";

// Ana sayfa metrik kartları için sayısal özet.
// Zod ile çıkarılan tip; service fonksiyonları bu şekli garanti eder.
export const anaSayfaMetrikSemasi = z.object({
  acikGorev: z.number().int().min(0),
  geciken: z.number().int().min(0),
  buHaftaBitenlerim: z.number().int().min(0),
  buHaftaTamamladiklarim: z.number().int().min(0),
  buHaftaTakim: z.number().int().min(0),
  bekleyenDavetGelen: z.number().int().min(0),
  bekleyenDavetGiden: z.number().int().min(0),
});

export type AnaSayfaMetrik = z.infer<typeof anaSayfaMetrikSemasi>;

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
