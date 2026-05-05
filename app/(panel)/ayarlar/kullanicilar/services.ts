import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { mailGonder } from "@/lib/mail";
import { aramaUuidIdleri } from "@/lib/arama";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import {
  kullaniciKaymakamRoluneSahipMi,
  rolAtamaPolitikasiniDogrula,
} from "@/lib/kullanici-rol-politikasi";
import { ROL_KODLARI } from "@/lib/roller";
import type {
  DavetGonder,
  KullaniciGuncelle,
  KullaniciListe,
} from "./schemas";

type RolDb = Pick<typeof db, "rol">;

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
  // Tek-birim (ADR-0007) - birim filtresi kaldırıldı.
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
    await rolAtamaPolitikasiniDogrula(tx, {
      rolIdleri: girdi.rol_idleri,
      birimId: girdi.birim_id,
      haricKullaniciId: girdi.id,
    });

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

async function kaymakamRolIdAl(tx: RolDb): Promise<string> {
  const rol = await tx.rol.findUnique({
    where: { kod: ROL_KODLARI.KAYMAKAM },
    select: { id: true },
  });
  if (!rol) {
    throw new EylemHatasi("Kaymakam rolü bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return rol.id;
}

export async function kullaniciyiGeriYukle(id: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const kullanici = await tx.kullanici.findUnique({
      where: { id },
      select: {
        id: true,
        birim_id: true,
        roller: { select: { rol_id: true } },
      },
    });
    if (!kullanici) {
      throw new EylemHatasi("Kullanıcı bulunamadı.", HATA_KODU.BULUNAMADI);
    }

    const kaymakamMi = await kullaniciKaymakamRoluneSahipMi(tx, id);
    const rolIdleri = kaymakamMi
      ? [await kaymakamRolIdAl(tx)]
      : kullanici.roller.map((rol) => rol.rol_id);
    await rolAtamaPolitikasiniDogrula(tx, {
      rolIdleri,
      birimId: kaymakamMi ? null : kullanici.birim_id,
      haricKullaniciId: id,
    });

    await tx.kullanici.update({
      where: { id },
      data: {
        silindi_mi: false,
        silinme_zamani: null,
        aktif: true,
        ...(kaymakamMi ? { birim_id: null } : {}),
      },
    });
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
    throw new EylemHatasi(
      "Bu e-posta ile zaten bir kullanıcı var.",
      HATA_KODU.CAKISMA,
    );
  }

  const token = tokenUret();
  const sonKullanma = new Date(
    Date.now() + DAVET_OMUR_GUN * 24 * 60 * 60 * 1000,
  );

  const kayit = await db.$transaction(async (tx) => {
    await rolAtamaPolitikasiniDogrula(tx, {
      rolIdleri: girdi.rol_id ? [girdi.rol_id] : [],
      birimId: girdi.birim_id,
      davetKontrol: true,
    });

    if (girdi.birim_id) {
      const birim = await tx.birim.findUnique({
        where: { id: girdi.birim_id },
        select: { id: true, silindi_mi: true, aktif: true },
      });
      if (!birim || birim.silindi_mi || !birim.aktif) {
        throw new EylemHatasi(
          "Seçilen birim geçerli değil.",
          HATA_KODU.GECERSIZ_GIRDI,
          { birim_id: "Seçilen birim geçerli değil." },
        );
      }
    }

    return tx.davetTokeni.create({
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
  });

  const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2500"}/davet/${kayit.token}`;
  await mailGonder({
    alici: email,
    konu: "Pusula - Davetiniz",
    govde: `Pusula sistemine davet edildiniz. Hesabınızı oluşturmak için aşağıdaki bağlantıya tıklayın. Bağlantı ${DAVET_OMUR_GUN} gün geçerlidir.\n\n${url}`,
  });

  return kayit;
}

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
