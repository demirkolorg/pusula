import { z } from 'zod'

export const DERKENAR_TIPLERI = ['KARAR', 'UYARI', 'ENGEL', 'BILGI', 'NOT'] as const

export const derkenarOlusturSchema = z.object({
  tip: z.enum(DERKENAR_TIPLERI),
  baslik: z.string().max(200).optional().nullable(),
  icerik: z.string().min(1, 'İçerik boş olamaz').max(10000),
  sabitlendi: z.boolean().default(false),
})

export const derkenarGuncelleSchema = derkenarOlusturSchema.partial().extend({
  cozuldu: z.boolean().optional(),
})

export type DerkenarOlusturIstek = z.infer<typeof derkenarOlusturSchema>
export type DerkenarGuncelleIstek = z.infer<typeof derkenarGuncelleSchema>
