import { z } from "zod";

// ProjeYetkilisi.seviye enum mirror — Prisma ile uyumlu.
export const PROJE_YETKI_SEVIYELERI = ["ADMIN", "NORMAL", "IZLEYICI"] as const;
export const projeYetkiSeviyesiSemasi = z.enum(PROJE_YETKI_SEVIYELERI);
export type ProjeYetkiSeviyesi = z.infer<typeof projeYetkiSeviyesiSemasi>;

// =====================================================================
// Proje yetkili yönetimi (proje admin işi)
// =====================================================================

export const projeYetkilileriListeleSemasi = z.object({
  proje_id: z.string().uuid(),
});

export const projeyeYetkiliEkleSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
  seviye: projeYetkiSeviyesiSemasi.default("NORMAL"),
});

export const projeyeYetkiliKaldirSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
});

export const projeYetkilisiSeviyeGuncelleSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
  seviye: projeYetkiSeviyesiSemasi,
});

// Proje'ye eklenecek aday kullanıcıları sistem genelinden ara (proje yetkilisi olmayanlar).
export const projeAdayKullanicilarSemasi = z.object({
  proje_id: z.string().uuid(),
  q: z.string().trim().max(100).optional(),
});

// =====================================================================
// Karta yetkili atama
// =====================================================================

export const kartAdayKullanicilarSemasi = z.object({
  kart_id: z.string().uuid(),
  q: z.string().trim().max(100).optional(),
});

export const kartinYetkilileriSemasi = z.object({
  kart_id: z.string().uuid(),
});

export const kartaYetkiliEkleSemasi = z.object({
  kart_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
});

export const kartaYetkiliKaldirSemasi = kartaYetkiliEkleSemasi;

export type ProjeYetkilileriListele = z.infer<typeof projeYetkilileriListeleSemasi>;
export type ProjeyeYetkiliEkle = z.infer<typeof projeyeYetkiliEkleSemasi>;
export type ProjeyeYetkiliKaldir = z.infer<typeof projeyeYetkiliKaldirSemasi>;
export type ProjeYetkilisiSeviyeGuncelle = z.infer<typeof projeYetkilisiSeviyeGuncelleSemasi>;
export type ProjeAdayKullanicilar = z.infer<typeof projeAdayKullanicilarSemasi>;
export type KartAdayKullanicilar = z.infer<typeof kartAdayKullanicilarSemasi>;
export type KartinYetkilileri = z.infer<typeof kartinYetkilileriSemasi>;
export type KartaYetkiliEkle = z.infer<typeof kartaYetkiliEkleSemasi>;
export type KartaYetkiliKaldir = z.infer<typeof kartaYetkiliKaldirSemasi>;
