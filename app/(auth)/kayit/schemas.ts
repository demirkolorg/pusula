import { z } from "zod";

export const kayitSemasi = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter").max(100),
  soyad: z.string().min(2, "Soyad en az 2 karakter").max(100),
  email: z.string().min(1, "E-posta zorunlu").email("Geçerli bir e-posta girin"),
  telefon: z.string().max(50).optional(),
  unvan: z.string().max(200).optional(),
  parola: z
    .string()
    .min(8, "Parola en az 8 karakter")
    .max(128, "Parola en fazla 128 karakter"),
  parolaTekrar: z.string(),
  kurum_id: z.string().uuid({ message: "Kurum seçimi zorunlu" }),
}).refine((d) => d.parola === d.parolaTekrar, {
  message: "Parolalar eşleşmiyor",
  path: ["parolaTekrar"],
});

export type Kayit = z.infer<typeof kayitSemasi>;
