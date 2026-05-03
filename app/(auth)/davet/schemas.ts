import { z } from "zod";

export const davetiKabulSemasi = z
  .object({
    token: z.string().min(20, "Geçersiz davet bağlantısı"),
    ad: z.string().min(2, "Ad en az 2 karakter").max(100),
    soyad: z.string().min(2, "Soyad en az 2 karakter").max(100),
    parola: z.string().min(8, "Parola en az 8 karakter").max(128),
    parolaTekrar: z.string(),
  })
  .refine((d) => d.parola === d.parolaTekrar, {
    message: "Parolalar eşleşmiyor",
    path: ["parolaTekrar"],
  });

export type DavetiKabulIstegi = z.infer<typeof davetiKabulSemasi>;
