import { fakerTR as faker } from "@faker-js/faker";
import argon2 from "argon2";
import type { PrismaClient } from "@prisma/client";
import { siraSonuna } from "@/lib/sira";

// Tur 2 — Modul "Proje" integration testleri icin seed factory'leri.
// Faker-tr ile Turkce isimler/aciklamalar uretilir (Kontrol Kural 81).
// Argon2 kullanilir (Kontrol Kural 68); test parolasi sabit.
//
// ozet:
//   const ortam = await ortamKur(db);
//   await projeOlusturFiks(db, { birimId: ortam.birim.id, ... });

type AnyPrisma = Pick<
  PrismaClient,
  | "birim"
  | "kullanici"
  | "rol"
  | "izin"
  | "rolIzin"
  | "kullaniciRol"
  | "proje"
  | "projeBirimi"
  | "projeUyesi"
  | "liste"
  | "kart"
>;

// Sabit izin/rol matrisi — services'in `yetkiKontrol` testi yazildiginda gerekecek
// (Tur 2 services testlerinde dogrudan kullanilmiyor, ama hazir olsun).
const IZINLER = [
  { kod: "proje:create", ad: "Proje Olustur", kategori: "proje" },
  { kod: "proje:edit", ad: "Proje Duzenle", kategori: "proje" },
  { kod: "proje:delete", ad: "Proje Sil", kategori: "proje" },
  { kod: "proje:member", ad: "Proje Uyelerini Yonet", kategori: "proje" },
];

const ROLLER = [
  { kod: "SUPER_ADMIN", ad: "Super Yonetici" },
  { kod: "KAYMAKAM", ad: "Kaymakam" },
  { kod: "PERSONEL", ad: "Personel" },
];

const ROL_IZINLERI: Record<string, string[]> = {
  SUPER_ADMIN: IZINLER.map((i) => i.kod),
  KAYMAKAM: IZINLER.map((i) => i.kod),
  PERSONEL: ["proje:create", "proje:edit"],
};

export type Ortam = {
  birim: { id: string; ad: string };
  digerBirim: { id: string; ad: string };
  superAdmin: { id: string; email: string };
  personel: { id: string; email: string };
  // Diger birimin bir kullanicisi — paylasim kapsami testleri icin.
  digerKullanici: { id: string; email: string };
};

let _testParolaHash: string | null = null;
async function testParolaHashAl(): Promise<string> {
  if (_testParolaHash) return _testParolaHash;
  _testParolaHash = await argon2.hash("Test1234!", { type: argon2.argon2id });
  return _testParolaHash;
}

export async function rolIzinSeedle(db: AnyPrisma): Promise<void> {
  for (const izin of IZINLER) {
    await db.izin.upsert({
      where: { kod: izin.kod },
      update: { ad: izin.ad, kategori: izin.kategori },
      create: izin,
    });
  }
  for (const rol of ROLLER) {
    await db.rol.upsert({
      where: { kod: rol.kod },
      update: { ad: rol.ad, sistem_rolu: true },
      create: { ...rol, sistem_rolu: true },
    });
  }
  const tumIzinler = await db.izin.findMany();
  const izinHaritasi = new Map(tumIzinler.map((i) => [i.kod, i.id]));
  const tumRoller = await db.rol.findMany();
  for (const rol of tumRoller) {
    const istenenler = ROL_IZINLERI[rol.kod] ?? [];
    for (const kod of istenenler) {
      const izinId = izinHaritasi.get(kod);
      if (!izinId) continue;
      await db.rolIzin.upsert({
        where: { rol_id_izin_id: { rol_id: rol.id, izin_id: izinId } },
        update: {},
        create: { rol_id: rol.id, izin_id: izinId },
      });
    }
  }
}

export async function birimOlusturFiks(
  db: AnyPrisma,
  ad?: string,
): Promise<{ id: string; ad: string }> {
  // Test fikstürü: tekil tipte birden fazla kayıt olamayacağı için her seferinde
  // çoklu bir tip (ECZANE) kullanıyoruz. `ad` zorunlu çünkü çoklu tip.
  const adGercek = ad ?? `${faker.company.name()} Eczanesi`;
  const k = await db.birim.create({
    data: {
      kategori: "SAGLIK",
      tip: "ECZANE",
      ad: adGercek,
      kisa_ad: faker.string.alpha({ length: 3, casing: "upper" }),
      il: faker.location.state(),
      ilce: faker.location.county(),
    },
    select: { id: true, ad: true },
  });
  return { id: k.id, ad: k.ad ?? adGercek };
}

export async function kullaniciOlusturFiks(
  db: AnyPrisma,
  args: { birimId: string; rolKod?: string; email?: string },
): Promise<{ id: string; email: string }> {
  const parolaHash = await testParolaHashAl();
  const ad = faker.person.firstName();
  const soyad = faker.person.lastName();
  const email =
    args.email ??
    `${ad.toLowerCase()}.${soyad.toLowerCase()}.${faker.string.alphanumeric(6).toLowerCase()}@test.local`;

  const k = await db.kullanici.create({
    data: {
      birim_id: args.birimId,
      email,
      parola_hash: parolaHash,
      ad,
      soyad,
      aktif: true,
      onay_durumu: "ONAYLANDI",
      onay_zamani: new Date(),
    },
    select: { id: true, email: true },
  });

  if (args.rolKod) {
    const rol = await db.rol.findUnique({ where: { kod: args.rolKod } });
    if (rol) {
      await db.kullaniciRol.create({
        data: { kullanici_id: k.id, rol_id: rol.id },
      });
    }
  }
  return k;
}

// Iki birim + uc kullaniciyi tek seferde kuran ortam fabrikasi.
// Paylasim kapsami test ihtiyaclari icin `digerBirim` ve `digerKullanici` da hazir.
export async function ortamKur(db: AnyPrisma): Promise<Ortam> {
  await rolIzinSeedle(db);
  const birim = await birimOlusturFiks(db, "Test Birim A");
  const digerBirim = await birimOlusturFiks(db, "Test Birim B");

  const superAdmin = await kullaniciOlusturFiks(db, {
    birimId: birim.id,
    rolKod: "SUPER_ADMIN",
  });
  const personel = await kullaniciOlusturFiks(db, {
    birimId: birim.id,
    rolKod: "PERSONEL",
  });
  const digerKullanici = await kullaniciOlusturFiks(db, {
    birimId: digerBirim.id,
    rolKod: "PERSONEL",
  });

  return { birim, digerBirim, superAdmin, personel, digerKullanici };
}

export type ProjeFiksOps = {
  birimId: string;
  olusturanId?: string;
  ad?: string;
  aciklama?: string | null;
  kapak_renk?: string | null;
  yildizli_mi?: boolean;
  arsiv_mi?: boolean;
  silindi_mi?: boolean;
  // Verilmezse onceki sira'dan otomatik bir sonraki sira hesaplanir.
  sira?: string;
  oncekiSira?: string | null;
};

export async function projeOlusturFiks(
  db: AnyPrisma,
  ops: ProjeFiksOps,
): Promise<{
  id: string;
  ad: string;
  sira: string;
  yildizli_mi: boolean;
  arsiv_mi: boolean;
  silindi_mi: boolean;
}> {
  const sira = ops.sira ?? siraSonuna(ops.oncekiSira ?? null);
  const veri = {
    ad: ops.ad ?? `${faker.commerce.department()} Projesi`,
    aciklama: ops.aciklama ?? null,
    kapak_renk: ops.kapak_renk ?? null,
    yildizli_mi: ops.yildizli_mi ?? false,
    arsiv_mi: ops.arsiv_mi ?? false,
    arsiv_zamani: ops.arsiv_mi ? new Date() : null,
    silindi_mi: ops.silindi_mi ?? false,
    silinme_zamani: ops.silindi_mi ? new Date() : null,
    sira,
    olusturan_id: ops.olusturanId ?? null,
    birimler: { create: { birim_id: ops.birimId } },
  };
  const p = await db.proje.create({
    data: veri,
    select: {
      id: true,
      ad: true,
      sira: true,
      yildizli_mi: true,
      arsiv_mi: true,
      silindi_mi: true,
    },
  });
  return p;
}

// Bir birime birden fazla proje seedle — sira monoton artar.
// `tipler` her bir projenin durumunu belirler (default: hepsi aktif).
export async function projeleriSeedle(
  db: AnyPrisma,
  args: {
    birimId: string;
    olusturanId?: string;
    tipler?: Array<{
      ad?: string;
      aciklama?: string | null;
      yildizli_mi?: boolean;
      arsiv_mi?: boolean;
      silindi_mi?: boolean;
    }>;
    adet?: number;
  },
): Promise<Array<{ id: string; ad: string; sira: string }>> {
  const list = args.tipler ?? Array.from({ length: args.adet ?? 3 }, () => ({}));
  const sonuc: Array<{ id: string; ad: string; sira: string }> = [];
  let oncekiSira: string | null = null;
  for (const tip of list) {
    const p = await projeOlusturFiks(db, {
      birimId: args.birimId,
      olusturanId: args.olusturanId,
      oncekiSira,
      ...tip,
    });
    sonuc.push({ id: p.id, ad: p.ad, sira: p.sira });
    oncekiSira = p.sira;
  }
  return sonuc;
}

// ============================================================
// Tur 3 — Liste (kolon) ve Kart fixture'lari
// ============================================================

export type ListeFiksOps = {
  projeId: string;
  ad?: string;
  sira?: string;
  oncekiSira?: string | null;
  arsiv_mi?: boolean;
  wip_limit?: number | null;
};

export async function listeOlusturFiks(
  db: AnyPrisma,
  ops: ListeFiksOps,
): Promise<{
  id: string;
  proje_id: string;
  ad: string;
  sira: string;
  arsiv_mi: boolean;
  wip_limit: number | null;
}> {
  const sira = ops.sira ?? siraSonuna(ops.oncekiSira ?? null);
  const l = await db.liste.create({
    data: {
      proje_id: ops.projeId,
      ad: ops.ad ?? `${faker.commerce.department()} Listesi`,
      sira,
      arsiv_mi: ops.arsiv_mi ?? false,
      wip_limit: ops.wip_limit ?? null,
    },
    select: {
      id: true,
      proje_id: true,
      ad: true,
      sira: true,
      arsiv_mi: true,
      wip_limit: true,
    },
  });
  return l;
}

// Bir projeye birden fazla liste seedle — sira monoton artar.
export async function listeleriSeedle(
  db: AnyPrisma,
  args: {
    projeId: string;
    tipler?: Array<{
      ad?: string;
      arsiv_mi?: boolean;
      wip_limit?: number | null;
    }>;
    adet?: number;
  },
): Promise<
  Array<{
    id: string;
    proje_id: string;
    ad: string;
    sira: string;
    arsiv_mi: boolean;
    wip_limit: number | null;
  }>
> {
  const list =
    args.tipler ?? Array.from({ length: args.adet ?? 3 }, () => ({}));
  const sonuc: Array<{
    id: string;
    proje_id: string;
    ad: string;
    sira: string;
    arsiv_mi: boolean;
    wip_limit: number | null;
  }> = [];
  let oncekiSira: string | null = null;
  for (const tip of list) {
    const l = await listeOlusturFiks(db, {
      projeId: args.projeId,
      oncekiSira,
      ...tip,
    });
    sonuc.push(l);
    oncekiSira = l.sira;
  }
  return sonuc;
}

export type KartFiksOps = {
  listeId: string;
  baslik?: string;
  aciklama?: string | null;
  sira?: string;
  oncekiSira?: string | null;
  kapak_renk?: string | null;
  baslangic?: Date | null;
  bitis?: Date | null;
  arsiv_mi?: boolean;
  silindi_mi?: boolean;
  olusturanId?: string;
};

export async function kartOlusturFiks(
  db: AnyPrisma,
  ops: KartFiksOps,
): Promise<{
  id: string;
  liste_id: string;
  baslik: string;
  sira: string;
  arsiv_mi: boolean;
  silindi_mi: boolean;
}> {
  const sira = ops.sira ?? siraSonuna(ops.oncekiSira ?? null);
  const k = await db.kart.create({
    data: {
      liste_id: ops.listeId,
      baslik: ops.baslik ?? faker.commerce.productName(),
      aciklama: ops.aciklama ?? null,
      sira,
      kapak_renk: ops.kapak_renk ?? null,
      baslangic: ops.baslangic ?? null,
      bitis: ops.bitis ?? null,
      arsiv_mi: ops.arsiv_mi ?? false,
      silindi_mi: ops.silindi_mi ?? false,
      silinme_zamani: ops.silindi_mi ? new Date() : null,
      olusturan_id: ops.olusturanId ?? null,
    },
    select: {
      id: true,
      liste_id: true,
      baslik: true,
      sira: true,
      arsiv_mi: true,
      silindi_mi: true,
    },
  });
  return k;
}

// Bir listeye birden fazla kart seedle — sira monoton artar.
export async function kartlariSeedle(
  db: AnyPrisma,
  args: {
    listeId: string;
    olusturanId?: string;
    tipler?: Array<{
      baslik?: string;
      aciklama?: string | null;
      arsiv_mi?: boolean;
      silindi_mi?: boolean;
      kapak_renk?: string | null;
      bitis?: Date | null;
    }>;
    adet?: number;
  },
): Promise<
  Array<{
    id: string;
    liste_id: string;
    baslik: string;
    sira: string;
    arsiv_mi: boolean;
    silindi_mi: boolean;
  }>
> {
  const list =
    args.tipler ?? Array.from({ length: args.adet ?? 3 }, () => ({}));
  const sonuc: Array<{
    id: string;
    liste_id: string;
    baslik: string;
    sira: string;
    arsiv_mi: boolean;
    silindi_mi: boolean;
  }> = [];
  let oncekiSira: string | null = null;
  for (const tip of list) {
    const k = await kartOlusturFiks(db, {
      listeId: args.listeId,
      olusturanId: args.olusturanId,
      oncekiSira,
      ...tip,
    });
    sonuc.push(k);
    oncekiSira = k.sira;
  }
  return sonuc;
}
