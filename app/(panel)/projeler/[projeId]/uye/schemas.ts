import { z } from "zod";

// ProjeUyesi.seviye enum mirror — Prisma ile uyumlu.
export const PROJE_UYE_SEVIYELERI = ["ADMIN", "NORMAL", "IZLEYICI"] as const;
export const projeUyeSeviyeSemasi = z.enum(PROJE_UYE_SEVIYELERI);
export type ProjeUyeSeviye = z.infer<typeof projeUyeSeviyeSemasi>;

// =====================================================================
// Proje üye yönetimi (proje admin işi)
// =====================================================================

export const projeUyeleriListeleSemasi = z.object({
  proje_id: z.string().uuid(),
});

export const projeyeUyeEkleSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
  seviye: projeUyeSeviyeSemasi.default("NORMAL"),
});

export const projeyeUyeKaldirSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
});

export const projeUyesiSeviyeGuncelleSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
  seviye: projeUyeSeviyeSemasi,
});

// Proje'ye eklenecek aday kullanıcıları kurumdan ara (proje üyesi olmayanlar).
export const projeAdayKullanicilarSemasi = z.object({
  proje_id: z.string().uuid(),
  q: z.string().trim().max(100).optional(),
});

// =====================================================================
// Karta üye atama
// =====================================================================

export const kartinUyeleriSemasi = z.object({
  kart_id: z.string().uuid(),
});

export const kartaUyeEkleSemasi = z.object({
  kart_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
});

export const kartaUyeKaldirSemasi = kartaUyeEkleSemasi;

export type ProjeUyeleriListele = z.infer<typeof projeUyeleriListeleSemasi>;
export type ProjeyeUyeEkle = z.infer<typeof projeyeUyeEkleSemasi>;
export type ProjeyeUyeKaldir = z.infer<typeof projeyeUyeKaldirSemasi>;
export type ProjeUyesiSeviyeGuncelle = z.infer<typeof projeUyesiSeviyeGuncelleSemasi>;
export type ProjeAdayKullanicilar = z.infer<typeof projeAdayKullanicilarSemasi>;
export type KartinUyeleri = z.infer<typeof kartinUyeleriSemasi>;
export type KartaUyeEkle = z.infer<typeof kartaUyeEkleSemasi>;
export type KartaUyeKaldir = z.infer<typeof kartaUyeKaldirSemasi>;
