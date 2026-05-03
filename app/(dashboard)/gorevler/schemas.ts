import { z } from 'zod'

export const GOREV_DURUMLARI = [
  'YAPILACAK',
  'SURUYOR',
  'ONAY_BEKLIYOR',
  'ONAYLANDI',
  'DUZELTME',
  'IPTAL',
] as const

export const ONCELIK_DUZEYLERI = ['DUSUK', 'ORTA', 'YUKSEK', 'KRITIK'] as const

export const gorevOlusturSchema = z.object({
  baslik: z.string().min(2, 'En az 2 karakter').max(200),
  aciklama: z.string().max(5000).optional().nullable(),
  projeId: z.string().cuid('Geçerli bir proje seçin'),
  atananId: z.string().cuid().optional().nullable(),
  ustGorevId: z.string().cuid().optional().nullable(),
  oncelik: z.enum(ONCELIK_DUZEYLERI).default('ORTA'),
  baslangicTarihi: z.coerce.date().optional().nullable(),
  bitisTarihi: z.coerce.date().optional().nullable(),
})

export const gorevGuncelleSchema = gorevOlusturSchema.partial().extend({
  durum: z.enum(GOREV_DURUMLARI).optional(),
})

export type GorevOlusturIstek = z.infer<typeof gorevOlusturSchema>
export type GorevGuncelleIstek = z.infer<typeof gorevGuncelleSchema>
