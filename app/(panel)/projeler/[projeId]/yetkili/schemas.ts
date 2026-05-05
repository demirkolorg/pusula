import { z } from "zod";

// =====================================================================
// Proje yetkili yönetimi (ADR-0012)
// Yetkili olmak == proje erişimi. Seviye yok — aksiyon kontrolü sistem
// rolünden gelir (lib/permissions.ts + IZIN_KODLARI).
// =====================================================================

export const projeYetkilileriListeleSemasi = z.object({
  proje_id: z.string().uuid(),
});

export const projeyeYetkiliEkleSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
});

export const projeyeYetkiliKaldirSemasi = z.object({
  proje_id: z.string().uuid(),
  kullanici_id: z.string().uuid(),
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

// =====================================================================
// Proje davet bağlamı — sistemde kayıtsız bir e-postayı projeye davet et
// (Bölüm V/146 + ADR-0010 + ADR-0012)
//
// Seviye yok: davet kabul edilince kişi projeye yetkili olur, RBAC izinleri
// sistem rolünden gelir.
// =====================================================================

export const projeyeDavetGonderSemasi = z
  .object({
    proje_id: z.string().uuid().optional(),
    liste_id: z.string().uuid().optional(),
    kart_id: z.string().uuid().optional(),
    email: z.string().min(1).email(),
    birim_id: z.string().uuid().nullable(),
    // Sistem rolü (Rol tablosu) — davet kabul edilince KullaniciRol kaydı oluşur.
    rol_id: z.string().uuid({ message: "Sistem rolü seçilmelidir." }),
  })
  .strict()
  .refine(
    (v) =>
      [v.proje_id, v.liste_id, v.kart_id].filter((x) => x !== undefined)
        .length === 1,
    {
      message: "Tam olarak bir kaynak (proje/liste/kart) belirtilmeli.",
      path: ["proje_id"],
    },
  );

export const projeBekleyenDavetleriSemasi = z
  .object({
    proje_id: z.string().uuid().optional(),
    liste_id: z.string().uuid().optional(),
    kart_id: z.string().uuid().optional(),
  })
  .strict()
  .refine(
    (v) =>
      [v.proje_id, v.liste_id, v.kart_id].filter((x) => x !== undefined)
        .length === 1,
    { message: "Tam olarak bir kaynak belirtilmeli." },
  );

export const projeDavetIptalSemasi = z
  .object({
    proje_id: z.string().uuid().optional(),
    liste_id: z.string().uuid().optional(),
    kart_id: z.string().uuid().optional(),
    davet_id: z.string().uuid(),
  })
  .strict()
  .refine(
    (v) =>
      [v.proje_id, v.liste_id, v.kart_id].filter((x) => x !== undefined)
        .length === 1,
    { message: "Tam olarak bir kaynak belirtilmeli." },
  );

export const projeDavetYenidenGonderSemasi = z
  .object({
    proje_id: z.string().uuid().optional(),
    liste_id: z.string().uuid().optional(),
    kart_id: z.string().uuid().optional(),
    davet_id: z.string().uuid(),
  })
  .strict()
  .refine(
    (v) =>
      [v.proje_id, v.liste_id, v.kart_id].filter((x) => x !== undefined)
        .length === 1,
    { message: "Tam olarak bir kaynak belirtilmeli." },
  );

export type ProjeyeDavetGonder = z.infer<typeof projeyeDavetGonderSemasi>;
export type ProjeBekleyenDavetleri = z.infer<typeof projeBekleyenDavetleriSemasi>;
export type ProjeDavetIptal = z.infer<typeof projeDavetIptalSemasi>;
export type ProjeDavetYenidenGonder = z.infer<typeof projeDavetYenidenGonderSemasi>;

export type ProjeYetkilileriListele = z.infer<typeof projeYetkilileriListeleSemasi>;
export type ProjeyeYetkiliEkle = z.infer<typeof projeyeYetkiliEkleSemasi>;
export type ProjeyeYetkiliKaldir = z.infer<typeof projeyeYetkiliKaldirSemasi>;
export type ProjeAdayKullanicilar = z.infer<typeof projeAdayKullanicilarSemasi>;
export type KartAdayKullanicilar = z.infer<typeof kartAdayKullanicilarSemasi>;
export type KartinYetkilileri = z.infer<typeof kartinYetkilileriSemasi>;
export type KartaYetkiliEkle = z.infer<typeof kartaYetkiliEkleSemasi>;
export type KartaYetkiliKaldir = z.infer<typeof kartaYetkiliKaldirSemasi>;
