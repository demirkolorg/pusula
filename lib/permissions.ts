import { cache } from "react";
import { auth } from "@/auth";
import { db } from "./db";
import { EylemHatasi } from "./action-wrapper";
import { HATA_KODU } from "./sonuc";

export const IZIN_KODLARI = {
  PROJE_OLUSTUR: "proje:create",
  PROJE_DUZENLE: "proje:edit",
  PROJE_SIL: "proje:delete",
  PROJE_UYE_YONET: "proje:member",
  LISTE_OLUSTUR: "liste:create",
  LISTE_DUZENLE: "liste:edit",
  LISTE_SIL: "liste:delete",
  KART_OLUSTUR: "kart:create",
  KART_DUZENLE: "kart:edit",
  KART_SIL: "kart:delete",
  KART_TASI: "kart:move",
  KULLANICI_DAVET: "user:invite",
  KULLANICI_DUZENLE: "user:edit",
  KULLANICI_SIL: "user:delete",
  KULLANICI_ONAYLA: "user:approve",
  DENETIM_OKU: "audit:read",
  HATA_LOGU_OKU: "errorlog:read",
  AYAR_DUZENLE: "settings:edit",
  KURUM_YONET: "kurum:manage",
  ROL_YONET: "rol:manage",
} as const;

export type IzinKodu = (typeof IZIN_KODLARI)[keyof typeof IZIN_KODLARI];

export const kullaniciIzinleriniAl = cache(
  async (kullaniciId: string): Promise<Set<string>> => {
    const satirlar = await db.kullaniciRol.findMany({
      where: { kullanici_id: kullaniciId },
      select: {
        rol: {
          select: {
            kod: true,
            izinler: { select: { izin: { select: { kod: true } } } },
          },
        },
      },
    });

    const izinler = new Set<string>();
    for (const satir of satirlar) {
      // Makam rolleri (SUPER_ADMIN, KAYMAKAM) — tüm kurumların verisine erişir.
      // ADR-0001: Kural 50a güncel metni — kurum filtresi atlanır.
      if (satir.rol.kod === "SUPER_ADMIN" || satir.rol.kod === "KAYMAKAM") {
        izinler.add("*");
      }
      for (const ri of satir.rol.izinler) {
        izinler.add(ri.izin.kod);
      }
    }
    return izinler;
  },
);

export async function aktifKullaniciAl(): Promise<{
  kullaniciId: string;
  email: string;
  kurumId?: string;
  roller: string[];
} | null> {
  const oturum = await auth();
  if (!oturum?.user) return null;
  const u = oturum.user as {
    id: string;
    email?: string;
    kurumId?: string;
    roller?: string[];
  };
  return {
    kullaniciId: u.id,
    email: u.email ?? "",
    kurumId: u.kurumId,
    roller: u.roller ?? [],
  };
}

export async function izinVarMi(
  kullaniciId: string,
  ...izinler: string[]
): Promise<boolean> {
  const sahip = await kullaniciIzinleriniAl(kullaniciId);
  if (sahip.has("*")) return true;
  return izinler.every((i) => sahip.has(i));
}

export async function herhangiBirIzin(
  kullaniciId: string,
  ...izinler: string[]
): Promise<boolean> {
  const sahip = await kullaniciIzinleriniAl(kullaniciId);
  if (sahip.has("*")) return true;
  return izinler.some((i) => sahip.has(i));
}

export async function yetkiZorunlu(
  kullaniciId: string | null | undefined,
  ...izinler: string[]
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi(
      "Bu işlem için giriş yapmalısınız.",
      HATA_KODU.GIRIS_YOK,
    );
  }
  const ok = await izinVarMi(kullaniciId, ...izinler);
  if (!ok) {
    throw new EylemHatasi(
      "Bu işlem için yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}

export function rolKontrol(roller: string[], hedef: string | string[]): boolean {
  const dizi = Array.isArray(hedef) ? hedef : [hedef];
  return dizi.some((r) => roller.includes(r));
}
