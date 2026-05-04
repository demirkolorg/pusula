import type { BirimTipi } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";

export type BirimPaylasimOzeti = {
  birim_id: string;
  ad: string | null;
  tip: BirimTipi;
  eklenme_zamani: Date;
};

export type KisiPaylasimOzeti = {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_ad: string | null;
  eklenme_zamani: Date;
};

export type AdayKisiPaylasim = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_ad: string | null;
};

async function projeyiDogrula(projeId: string): Promise<void> {
  const proje = await db.proje.findUnique({
    where: { id: projeId },
    select: { silindi_mi: true },
  });
  if (!proje || proje.silindi_mi) {
    throw new EylemHatasi("Proje bulunamadi.", HATA_KODU.BULUNAMADI);
  }
}

async function listeyiDogrula(listeId: string): Promise<{ proje_id: string }> {
  const liste = await db.liste.findUnique({
    where: { id: listeId },
    select: { proje_id: true },
  });
  if (!liste) {
    throw new EylemHatasi("Liste bulunamadi.", HATA_KODU.BULUNAMADI);
  }
  return liste;
}

async function aktifBirimDogrula(birimId: string): Promise<void> {
  const birim = await db.birim.findUnique({
    where: { id: birimId },
    select: { aktif: true, silindi_mi: true },
  });
  if (!birim || birim.silindi_mi || !birim.aktif) {
    throw new EylemHatasi("Birim bulunamadi.", HATA_KODU.BULUNAMADI);
  }
}

async function aktifKullaniciDogrula(
  kullaniciId: string,
): Promise<Omit<KisiPaylasimOzeti, "eklenme_zamani">> {
  const kullanici = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: {
      id: true,
      ad: true,
      soyad: true,
      email: true,
      aktif: true,
      silindi_mi: true,
      onay_durumu: true,
      birim: { select: { ad: true, kisa_ad: true } },
    },
  });
  if (
    !kullanici ||
    kullanici.silindi_mi ||
    !kullanici.aktif ||
    kullanici.onay_durumu !== "ONAYLANDI"
  ) {
    throw new EylemHatasi("Kullanici bulunamadi.", HATA_KODU.BULUNAMADI);
  }
  return {
    kullanici_id: kullanici.id,
    ad: kullanici.ad,
    soyad: kullanici.soyad,
    email: kullanici.email,
    birim_ad: kullanici.birim?.kisa_ad ?? kullanici.birim?.ad ?? null,
  };
}

export async function projeBirimleriniListele(
  projeId: string,
): Promise<BirimPaylasimOzeti[]> {
  await projeyiDogrula(projeId);
  const kayitlar = await db.projeBirimi.findMany({
    where: { proje_id: projeId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      birim_id: true,
      eklenme_zamani: true,
      birim: { select: { ad: true, tip: true } },
    },
  });
  return kayitlar.map((kayit) => ({
    birim_id: kayit.birim_id,
    ad: kayit.birim.ad,
    tip: kayit.birim.tip,
    eklenme_zamani: kayit.eklenme_zamani,
  }));
}

export async function projeBirimEkle(
  projeId: string,
  birimId: string,
): Promise<void> {
  await Promise.all([projeyiDogrula(projeId), aktifBirimDogrula(birimId)]);
  await db.projeBirimi.upsert({
    where: { proje_id_birim_id: { proje_id: projeId, birim_id: birimId } },
    update: {},
    create: { proje_id: projeId, birim_id: birimId },
  });
}

export async function projeBirimKaldir(
  projeId: string,
  birimId: string,
): Promise<void> {
  await projeyiDogrula(projeId);
  await db.projeBirimi
    .delete({
      where: { proje_id_birim_id: { proje_id: projeId, birim_id: birimId } },
    })
    .catch(() => undefined);
}

export async function listeBirimleriniListele(
  listeId: string,
): Promise<BirimPaylasimOzeti[]> {
  await listeyiDogrula(listeId);
  const kayitlar = await db.listeBirimi.findMany({
    where: { liste_id: listeId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      birim_id: true,
      eklenme_zamani: true,
      birim: { select: { ad: true, tip: true } },
    },
  });
  return kayitlar.map((kayit) => ({
    birim_id: kayit.birim_id,
    ad: kayit.birim.ad,
    tip: kayit.birim.tip,
    eklenme_zamani: kayit.eklenme_zamani,
  }));
}

export async function listeBirimEkle(
  listeId: string,
  birimId: string,
): Promise<void> {
  await Promise.all([listeyiDogrula(listeId), aktifBirimDogrula(birimId)]);
  await db.listeBirimi.upsert({
    where: { liste_id_birim_id: { liste_id: listeId, birim_id: birimId } },
    update: {},
    create: { liste_id: listeId, birim_id: birimId },
  });
}

export async function listeBirimKaldir(
  listeId: string,
  birimId: string,
): Promise<void> {
  await listeyiDogrula(listeId);
  await db.listeBirimi
    .delete({
      where: { liste_id_birim_id: { liste_id: listeId, birim_id: birimId } },
    })
    .catch(() => undefined);
}

export async function listeUyeleriniListele(
  listeId: string,
): Promise<KisiPaylasimOzeti[]> {
  await listeyiDogrula(listeId);
  const kayitlar = await db.listeUyesi.findMany({
    where: { liste_id: listeId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      kullanici_id: true,
      eklenme_zamani: true,
      kullanici: {
        select: {
          ad: true,
          soyad: true,
          email: true,
          birim: { select: { ad: true, kisa_ad: true } },
        },
      },
    },
  });
  return kayitlar.map((kayit) => ({
    kullanici_id: kayit.kullanici_id,
    ad: kayit.kullanici.ad,
    soyad: kayit.kullanici.soyad,
    email: kayit.kullanici.email,
    birim_ad:
      kayit.kullanici.birim?.kisa_ad ?? kayit.kullanici.birim?.ad ?? null,
    eklenme_zamani: kayit.eklenme_zamani,
  }));
}

export async function listeAdayKisileriAra(
  listeId: string,
  q?: string,
): Promise<AdayKisiPaylasim[]> {
  await listeyiDogrula(listeId);
  const arama = q?.trim();
  const adaylar = await db.kullanici.findMany({
    where: {
      aktif: true,
      silindi_mi: false,
      onay_durumu: "ONAYLANDI",
      liste_uyelik: { none: { liste_id: listeId } },
      ...(arama
        ? {
            OR: [
              { ad: { contains: arama, mode: "insensitive" } },
              { soyad: { contains: arama, mode: "insensitive" } },
              { email: { contains: arama, mode: "insensitive" } },
              { birim: { ad: { contains: arama, mode: "insensitive" } } },
              {
                birim: { kisa_ad: { contains: arama, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ ad: "asc" }, { soyad: "asc" }],
    take: 20,
    select: {
      id: true,
      ad: true,
      soyad: true,
      email: true,
      birim: { select: { ad: true, kisa_ad: true } },
    },
  });
  return adaylar.map((aday) => ({
    id: aday.id,
    ad: aday.ad,
    soyad: aday.soyad,
    email: aday.email,
    birim_ad: aday.birim?.kisa_ad ?? aday.birim?.ad ?? null,
  }));
}

export async function listeUyeEkle(
  listeId: string,
  kullaniciId: string,
): Promise<KisiPaylasimOzeti> {
  await listeyiDogrula(listeId);
  const kullanici = await aktifKullaniciDogrula(kullaniciId);
  const yeni = await db.listeUyesi.upsert({
    where: {
      liste_id_kullanici_id: {
        liste_id: listeId,
        kullanici_id: kullaniciId,
      },
    },
    update: {},
    create: { liste_id: listeId, kullanici_id: kullaniciId },
    select: { eklenme_zamani: true },
  });
  return { ...kullanici, eklenme_zamani: yeni.eklenme_zamani };
}

export async function listeUyeKaldir(
  listeId: string,
  kullaniciId: string,
): Promise<void> {
  await listeyiDogrula(listeId);
  await db.listeUyesi
    .delete({
      where: {
        liste_id_kullanici_id: {
          liste_id: listeId,
          kullanici_id: kullaniciId,
        },
      },
    })
    .catch(() => undefined);
}
