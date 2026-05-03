import { z } from "zod";

export const girisSemasi = z.object({
  email: z
    .string()
    .min(1, "E-posta zorunlu")
    .email("Geçerli bir e-posta adresi girin"),
  parola: z
    .string()
    .min(8, "Parola en az 8 karakter olmalı")
    .max(128, "Parola en fazla 128 karakter olabilir"),
});

export type GirisVerisi = z.infer<typeof girisSemasi>;
