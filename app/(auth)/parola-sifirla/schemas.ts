import { z } from "zod";

export const sifirlamaIstekSemasi = z.object({
  email: z
    .string()
    .min(1, "E-posta zorunlu")
    .email("Geçerli bir e-posta adresi girin"),
});

export const yeniParolaSemasi = z
  .object({
    token: z.string().min(20, "Geçersiz bağlantı"),
    parola: z
      .string()
      .min(8, "Parola en az 8 karakter olmalı")
      .max(128, "Parola en fazla 128 karakter olabilir"),
    parolaTekrar: z.string(),
  })
  .refine((d) => d.parola === d.parolaTekrar, {
    message: "Parolalar eşleşmiyor",
    path: ["parolaTekrar"],
  });

export type SifirlamaIstegi = z.infer<typeof sifirlamaIstekSemasi>;
export type YeniParolaIstegi = z.infer<typeof yeniParolaSemasi>;
