import { z } from "zod";
import { TUM_IZIN_KODLARI } from "@/lib/permissions-katalog";

// ADR-0013: Rol kod formatı = sistem rolleriyle uyumlu (UPPER_SNAKE).
// İlk karakter harf olmak zorunda, alt çizgi+rakam izinli.
const rolKodSemasi = z
  .string()
  .min(2, { message: "Rol kodu en az 2 karakter olmalı." })
  .max(40, { message: "Rol kodu en fazla 40 karakter olabilir." })
  .regex(/^[A-Z][A-Z0-9_]*$/, {
    message: "Rol kodu büyük harfle başlamalı; harf, rakam ve _ içerebilir.",
  });

const rolAdSemasi = z
  .string()
  .min(2, { message: "Rol adı en az 2 karakter olmalı." })
  .max(80, { message: "Rol adı en fazla 80 karakter olabilir." });

const rolAciklamaSemasi = z
  .string()
  .max(500, { message: "Açıklama en fazla 500 karakter olabilir." })
  .nullable()
  .optional();

const izinKoduSemasi = z.enum(
  TUM_IZIN_KODLARI as unknown as readonly [string, ...string[]],
  { message: "Geçersiz izin kodu." },
);

export const rolListeSemasi = z.object({
  arama: z.string().max(100).optional(),
});

export const rolDetaySemasi = z.object({
  id: z.string().uuid(),
});

export const rolOlusturSemasi = z.object({
  kod: rolKodSemasi,
  ad: rolAdSemasi,
  aciklama: rolAciklamaSemasi,
  izinler: z.array(izinKoduSemasi),
});

export const rolGuncelleSemasi = z.object({
  id: z.string().uuid(),
  ad: rolAdSemasi,
  aciklama: rolAciklamaSemasi,
});

export const rolIzinleriniGuncelleSemasi = z.object({
  id: z.string().uuid(),
  izinler: z.array(izinKoduSemasi),
});

export const rolSilSemasi = z.object({
  id: z.string().uuid(),
});

export const rolCogaltSemasi = z.object({
  kaynakId: z.string().uuid(),
  kod: rolKodSemasi,
  ad: rolAdSemasi,
  aciklama: rolAciklamaSemasi,
});

export const kullaniciyaRolAtaSemasi = z.object({
  kullaniciId: z.string().uuid(),
  rolIdleri: z.array(z.string().uuid()),
});

export type RolOlusturGirdi = z.infer<typeof rolOlusturSemasi>;
export type RolGuncelleGirdi = z.infer<typeof rolGuncelleSemasi>;
export type RolIzinleriniGuncelleGirdi = z.infer<
  typeof rolIzinleriniGuncelleSemasi
>;
export type RolCogaltGirdi = z.infer<typeof rolCogaltSemasi>;
export type KullaniciyaRolAtaGirdi = z.infer<typeof kullaniciyaRolAtaSemasi>;
