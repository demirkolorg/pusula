import { z } from 'zod'

export const birimOlusturSchema = z.object({
  ad: z.string().min(2, 'En az 2 karakter').max(100),
  aciklama: z.string().max(500).optional(),
  ustBirimId: z.string().cuid().optional(),
})

export const birimGuncelleSchema = birimOlusturSchema.partial()

export type BirimOlusturIstek = z.infer<typeof birimOlusturSchema>
export type BirimGuncelleIstek = z.infer<typeof birimGuncelleSchema>
