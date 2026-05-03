import { z } from 'zod'

export const projeOlusturSchema = z.object({
  ad: z.string().min(2, 'En az 2 karakter').max(150),
  aciklama: z.string().max(1000).optional().nullable(),
  birimId: z.string().cuid('Geçerli bir birim seçin'),
  baslangicTarihi: z.coerce.date().optional().nullable(),
  bitisTarihi: z.coerce.date().optional().nullable(),
})

export const projeGuncelleSchema = projeOlusturSchema.partial()

export type ProjeOlusturIstek = z.infer<typeof projeOlusturSchema>
export type ProjeGuncelleIstek = z.infer<typeof projeGuncelleSchema>
