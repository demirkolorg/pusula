import { z } from 'zod'

export const yorumOlusturSchema = z.object({
  icerik: z.string().min(1, 'Yorum boş olamaz').max(5000),
})

export const yorumGuncelleSchema = yorumOlusturSchema

export type YorumOlusturIstek = z.infer<typeof yorumOlusturSchema>
export type YorumGuncelleIstek = z.infer<typeof yorumGuncelleSchema>
