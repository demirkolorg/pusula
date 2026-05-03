import { z } from "zod";

export const kullaniciListeSemasi = z.object({
  sayfa: z.number().int().min(1).default(1),
  sayfaBoyutu: z.number().int().min(1).max(100).default(20),
  arama: z.string().optional(),
  kurumId: z.string().uuid().optional().nullable(),
  rolId: z.string().uuid().optional().nullable(),
  aktif: z.boolean().optional(),
});

export const kullaniciGuncelleSemasi = z.object({
  id: z.string().uuid(),
  ad: z.string().min(2).max(100),
  soyad: z.string().min(2).max(100),
  unvan: z.string().max(200).optional(),
  telefon: z.string().max(50).optional(),
  kurum_id: z.string().uuid(),
  aktif: z.boolean(),
  rol_idleri: z.array(z.string().uuid()),
});

export const kullaniciSilSemasi = z.object({ id: z.string().uuid() });

export const davetGonderSemasi = z.object({
  email: z.string().min(1).email(),
  rol_id: z.string().uuid().optional().nullable(),
  kurum_id: z.string().uuid({
    message: "Davet edilecek kurum seçilmeli.",
  }),
});

export const kullaniciOnaylaSemasi = z.object({ id: z.string().uuid() });
export const kullaniciReddetSemasi = z.object({
  id: z.string().uuid(),
  sebep: z.string().min(2).max(500),
});

export type KullaniciListe = z.infer<typeof kullaniciListeSemasi>;
export type KullaniciGuncelle = z.infer<typeof kullaniciGuncelleSemasi>;
export type DavetGonder = z.infer<typeof davetGonderSemasi>;
export type KullaniciOnayla = z.infer<typeof kullaniciOnaylaSemasi>;
export type KullaniciReddet = z.infer<typeof kullaniciReddetSemasi>;
