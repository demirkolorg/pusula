import { z } from 'zod'

export const kullaniciOlusturSchema = z.object({
  name: z.string().min(2, 'En az 2 karakter').max(100),
  email: z.string().email('Geçersiz e-posta'),
  password: z.string().min(12, 'En az 12 karakter'),
  rol: z.enum(['YONETICI', 'BIRIM_MUDURU', 'PERSONEL']).default('PERSONEL'),
  birimId: z.string().cuid().optional(),
})

export const kullaniciGuncelleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  rol: z.enum(['YONETICI', 'BIRIM_MUDURU', 'PERSONEL']).optional(),
  birimId: z.string().cuid().nullable().optional(),
})

export type KullaniciOlusturIstek = z.infer<typeof kullaniciOlusturSchema>
export type KullaniciGuncelleIstek = z.infer<typeof kullaniciGuncelleSchema>
