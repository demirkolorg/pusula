import { z } from 'zod'

export const girisSchema = z.object({
  eposta: z.string().email('Geçerli bir e-posta adresi girin'),
  parola: z.string().min(12, 'Parola en az 12 karakter olmalıdır'),
})

export type GirisFormu = z.infer<typeof girisSchema>
