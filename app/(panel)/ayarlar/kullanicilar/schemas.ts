import { z } from "zod";

const birimIdSemasi = z
  .string()
  .uuid({ message: "Birim seçimi geçersiz." })
  .nullable();

export const kullaniciListeSemasi = z.object({
  sayfa: z.number().int().min(1).default(1),
  sayfaBoyutu: z.number().int().min(1).max(100).default(20),
  arama: z.string().optional(),
  birimId: z.string().uuid().optional().nullable(),
  rolId: z.string().uuid().optional().nullable(),
  aktif: z.boolean().optional(),
});

export const kullaniciGuncelleSemasi = z.object({
  id: z.string().uuid(),
  ad: z.string().min(2).max(100),
  soyad: z.string().min(2).max(100),
  unvan: z.string().max(200).optional(),
  telefon: z.string().max(50).optional(),
  birim_id: birimIdSemasi,
  aktif: z.boolean(),
  rol_idleri: z.array(z.string().uuid()),
});

export const kullaniciSilSemasi = z.object({ id: z.string().uuid() });

export const davetGonderSemasi = z.object({
  email: z.string().min(1).email(),
  rol_id: z.string().uuid().optional().nullable(),
  birim_id: birimIdSemasi,
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
