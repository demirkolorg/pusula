// Sprint 4 / S4-16 — Profil yönetimi Zod şemaları.

import { z } from "zod";

// useForm tip uyumu için input/output aynı şekil — null'a çevirme
// service katmanında yapılır (boş string → null).
export const profilGuncelleSemasi = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter").max(100),
  soyad: z.string().trim().min(2, "Soyad en az 2 karakter").max(100),
  unvan: z.string().trim().max(150),
  telefon: z.string().trim().max(30),
});
export type ProfilGuncelle = z.infer<typeof profilGuncelleSemasi>;

export const parolaDegistirSemasi = z
  .object({
    mevcutParola: z.string().min(8, "Mevcut parola gerekli").max(128),
    yeniParola: z
      .string()
      .min(8, "Yeni parola en az 8 karakter")
      .max(128, "Yeni parola en fazla 128 karakter"),
    yeniParolaTekrar: z.string().min(8).max(128),
  })
  .refine((d) => d.yeniParola === d.yeniParolaTekrar, {
    message: "Parolalar eşleşmiyor.",
    path: ["yeniParolaTekrar"],
  })
  .refine((d) => d.mevcutParola !== d.yeniParola, {
    message: "Yeni parola mevcut parolayla aynı olamaz.",
    path: ["yeniParola"],
  });
export type ParolaDegistir = z.infer<typeof parolaDegistirSemasi>;
