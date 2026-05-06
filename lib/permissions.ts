import { cache } from "react";
import { auth } from "@/auth";
import { db } from "./db";
import { EylemHatasi } from "./action-wrapper";
import { HATA_KODU } from "./sonuc";
import { ROL_KODLARI, makamRoluMu } from "./roller";
import { izinKoduGenislet } from "./permissions-eslesme";

// ADR-0013/0014: izin kataloğu saf modüldedir; auth/db bağımlılığı yok.
// Re-export — eski importlar (`import { IZIN_KODLARI } from "@/lib/permissions"`)
// olduğu gibi çalışır. Yeni katalog ADR-0014 ile granülerleştirildi (60+ izin).
export {
  IZIN_KODLARI,
  TUM_IZIN_KODLARI,
  IZIN_KATEGORI,
  IZIN_ALT_KATEGORI,
  KATEGORI_BASLIKLARI,
  ALT_KATEGORI_BASLIKLARI,
  IZIN_TANIMLARI,
  VARSAYILAN_ROL_IZINLERI,
  type IzinKodu,
} from "./permissions-katalog";

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
      // Makam rolleri (SUPER_ADMIN, KAYMAKAM) — tüm birimlerin verisine erişir.
      // ADR-0001: Kural 50a güncel metni — birim filtresi atlanır.
      if (makamRoluMu(satir.rol.kod)) {
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
  birimId?: string;
  roller: string[];
} | null> {
  const oturum = await auth();
  if (!oturum?.user) return null;
  const u = oturum.user as {
    id: string;
    email?: string;
    birimId?: string;
    roller?: string[];
  };
  return {
    kullaniciId: u.id,
    email: u.email ?? "",
    birimId: u.birimId,
    roller: u.roller ?? [],
  };
}

/**
 * ADR-0014: AND semantiği — kullanıcı tüm istenen izinlere sahip mi?
 * Eski geniş kodlar (kart:edit gibi) `izinKoduGenislet` ile yeni granüler
 * kümeye dönüştürülür; kullanıcı kümeden HERHANGİ BİRİNE sahipse o eski kod
 * için "yetkili" sayılır.
 */
export async function izinVarMi(
  kullaniciId: string,
  ...izinler: string[]
): Promise<boolean> {
  const sahip = await kullaniciIzinleriniAl(kullaniciId);
  if (sahip.has("*")) return true;
  return izinler.every((kod) => {
    const genis = izinKoduGenislet(kod);
    return genis.some((g) => sahip.has(g));
  });
}

/**
 * ADR-0014: OR semantiği — kullanıcı verilen kodlardan en az birine
 * sahip mi? Eski kodlar yine genişletilir.
 */
export async function herhangiBirIzin(
  kullaniciId: string,
  ...izinler: string[]
): Promise<boolean> {
  const sahip = await kullaniciIzinleriniAl(kullaniciId);
  if (sahip.has("*")) return true;
  return izinler.some((kod) => {
    const genis = izinKoduGenislet(kod);
    return genis.some((g) => sahip.has(g));
  });
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

export async function superAdminMi(kullaniciId: string): Promise<boolean> {
  const satir = await db.kullaniciRol.findFirst({
    where: {
      kullanici_id: kullaniciId,
      rol: { kod: ROL_KODLARI.SUPER_ADMIN },
    },
    select: { kullanici_id: true },
  });
  return satir !== null;
}

export function rolKontrol(roller: string[], hedef: string | string[]): boolean {
  const dizi = Array.isArray(hedef) ? hedef : [hedef];
  return dizi.some((r) => roller.includes(r));
}
