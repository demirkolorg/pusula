import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { mailGonder } from "@/lib/mail";
import { aramaUuidIdleri } from "@/lib/arama";
import type {
  DavetGonder,
  KullaniciGuncelle,
  KullaniciListe,
} from "./schemas";

export type KullaniciSatiri = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  unvan: string | null;
  telefon: string | null;
  aktif: boolean;
  silindi_mi: boolean;
  son_giris_zamani: Date | null;
  birim_id: string | null;
  birim_ad: string | null;
  birim_tip: string | null;
  roller: { id: string; kod: string; ad: string }[];
};

export async function kullanicilariListele(
  girdi: KullaniciListe,
): Promise<{ kayitlar: KullaniciSatiri[]; toplam: number }> {
  const where: Prisma.KullaniciWhereInput = { silindi_mi: false };
  if (girdi.arama) {
    const idler = await aramaUuidIdleri({
      tablo: "Kullanici",
      sutunlar: ["ad", "soyad", "email", "unvan", "telefon"],
      arama: girdi.arama,
    });
    if (idler !== null) {
      if (idler.length === 0) return { kayitlar: [], toplam: 0 };
      where.id = { in: idler };
    }
  }
  // Tek-birim (ADR-0007) — birim filtresi kaldırıldı.
  if (girdi.aktif !== undefined) where.aktif = girdi.aktif;
  if (girdi.rolId) {
    where.roller = { some: { rol_id: girdi.rolId } };
  }

  const [toplam, satirlar] = await db.$transaction([
    db.kullanici.count({ where }),
    db.kullanici.findMany({
      where,
      orderBy: [{ ad: "asc" }, { soyad: "asc" }],
      skip: (girdi.sayfa - 1) * girdi.sayfaBoyutu,
      take: girdi.sayfaBoyutu,
      select: {
        id: true,
        ad: true,
        soyad: true,
        email: true,
        unvan: true,
        telefon: true,
        aktif: true,
        silindi_mi: true,
        son_giris_zamani: true,
        birim_id: true,
        birim: { select: { ad: true, tip: true } },
        roller: { select: { rol: { select: { id: true, kod: true, ad: true } } } },
      },
    }),
  ]);

  return {
    toplam,
    kayitlar: satirlar.map((k) => ({
      id: k.id,
      ad: k.ad,
      soyad: k.soyad,
      email: k.email,
      unvan: k.unvan,
      telefon: k.telefon,
      aktif: k.aktif,
      silindi_mi: k.silindi_mi,
      son_giris_zamani: k.son_giris_zamani,
      birim_id: k.birim_id,
      birim_ad: k.birim?.ad ?? null,
      birim_tip: k.birim?.tip ?? null,
      roller: k.roller.map((r) => r.rol),
    })),
  };
}

export async function rolleriListele() {
  return db.rol.findMany({
    select: { id: true, kod: true, ad: true },
    orderBy: { ad: "asc" },
  });
}

export async function kullaniciyiGuncelle(
  girdi: KullaniciGuncelle,
  atayanId: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.kullanici.update({
      where: { id: girdi.id },
      data: {
        ad: girdi.ad.trim(),
        soyad: girdi.soyad.trim(),
        unvan: girdi.unvan?.trim() || null,
        telefon: girdi.telefon?.trim() || null,
        birim_id: girdi.birim_id,
        aktif: girdi.aktif,
      },
    });

    await tx.kullaniciRol.deleteMany({ where: { kullanici_id: girdi.id } });
    if (girdi.rol_idleri.length > 0) {
      await tx.kullaniciRol.createMany({
        data: girdi.rol_idleri.map((rid) => ({
          kullanici_id: girdi.id,
          rol_id: rid,
          atayan_id: atayanId,
        })),
        skipDuplicates: true,
      });
    }
  });
}

export async function kullaniciyiSil(id: string): Promise<void> {
  await db.kullanici.update({
    where: { id },
    data: { silindi_mi: true, silinme_zamani: new Date(), aktif: false },
  });
}

export async function kullaniciyiGeriYukle(id: string): Promise<void> {
  await db.kullanici.update({
    where: { id },
    data: { silindi_mi: false, silinme_zamani: null, aktif: true },
  });
}

const DAVET_OMUR_GUN = 7;

function tokenUret(): string {
  const bayt = new Uint8Array(32);
  crypto.getRandomValues(bayt);
  let s = "";
  for (const b of bayt) s += b.toString(16).padStart(2, "0");
  return s;
}

export async function davetOlustur(
  davetEdenId: string,
  girdi: DavetGonder,
): Promise<{ id: string; token: string }> {
  const email = girdi.email.toLowerCase();

  const mevcut = await db.kullanici.findUnique({ where: { email } });
  if (mevcut) {
    throw new Error("Bu e-posta ile zaten bir kullanıcı var.");
  }

  // Davet edilen birim mevcut mu?
  const birim = await db.birim.findUnique({
    where: { id: girdi.birim_id },
    select: { id: true, silindi_mi: true, aktif: true },
  });
  if (!birim || birim.silindi_mi || !birim.aktif) {
    throw new Error("Seçilen birim geçerli değil.");
  }

  const token = tokenUret();
  const sonKullanma = new Date(
    Date.now() + DAVET_OMUR_GUN * 24 * 60 * 60 * 1000,
  );

  const kayit = await db.davetTokeni.create({
    data: {
      token,
      email,
      rol_id: girdi.rol_id || null,
      birim_id: girdi.birim_id,
      davet_eden_id: davetEdenId,
      son_kullanma: sonKullanma,
    },
    select: { id: true, token: true },
  });

  const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2500"}/davet/${kayit.token}`;
  await mailGonder({
    alici: email,
    konu: "Pusula — Davetiniz",
    govde: `Pusula sistemine davet edildiniz. Hesabınızı oluşturmak için aşağıdaki bağlantıya tıklayın. Bağlantı ${DAVET_OMUR_GUN} gün geçerlidir.\n\n${url}`,
  });

  return kayit;
}

/**
 * Onay bekleyen kullanıcıları listeler (kayıt akışından gelen self-register'lar).
 */
export async function bekleyenKullanicilariListele() {
  return db.kullanici.findMany({
    where: { onay_durumu: "BEKLIYOR", silindi_mi: false },
    orderBy: { olusturma_zamani: "desc" },
    select: {
      id: true,
      ad: true,
      soyad: true,
      email: true,
      telefon: true,
      unvan: true,
      olusturma_zamani: true,
      birim: { select: { id: true, ad: true, tip: true } },
    },
  });
}

export async function kullaniciyiOnayla(
  id: string,
  onaylayanId: string,
): Promise<void> {
  await db.kullanici.update({
    where: { id },
    data: {
      onay_durumu: "ONAYLANDI",
      onaylayan_id: onaylayanId,
      onay_zamani: new Date(),
      red_sebebi: null,
      aktif: true,
    },
  });
}

export async function kullaniciyiReddet(
  id: string,
  onaylayanId: string,
  sebep: string,
): Promise<void> {
  await db.kullanici.update({
    where: { id },
    data: {
      onay_durumu: "REDDEDILDI",
      onaylayan_id: onaylayanId,
      onay_zamani: new Date(),
      red_sebebi: sebep,
      aktif: false,
    },
  });
}
