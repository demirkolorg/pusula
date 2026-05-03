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
//   await projeOlusturFiks(db, { kurumId: ortam.kurum.id, ... });

type AnyPrisma = Pick<
  PrismaClient,
  | "kurum"
  | "kullanici"
  | "rol"
  | "izin"
  | "rolIzin"
  | "kullaniciRol"
  | "proje"
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
  kurum: { id: string; ad: string };
  digerKurum: { id: string; ad: string };
  superAdmin: { id: string; email: string };
  personel: { id: string; email: string };
  // diger kurumun bir kullanicisi — cross-tenant izolasyon testleri icin.
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

export async function kurumOlusturFiks(
  db: AnyPrisma,
  ad?: string,
): Promise<{ id: string; ad: string }> {
  // Test fikstürü: tekil tipte birden fazla kayıt olamayacağı için her seferinde
  // çoklu bir tip (ECZANE) kullanıyoruz. `ad` zorunlu çünkü çoklu tip.
  const adGercek = ad ?? `${faker.company.name()} Eczanesi`;
  const k = await db.kurum.create({
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
  args: { kurumId: string; rolKod?: string; email?: string },
): Promise<{ id: string; email: string }> {
  const parolaHash = await testParolaHashAl();
  const ad = faker.person.firstName();
  const soyad = faker.person.lastName();
  const email =
    args.email ??
    `${ad.toLowerCase()}.${soyad.toLowerCase()}.${faker.string.alphanumeric(6).toLowerCase()}@test.local`;

  const k = await db.kullanici.create({
    data: {
      kurum_id: args.kurumId,
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

// Iki kurum + uc kullaniciyi tek seferde kuran ortam fabrikasi.
// Cross-tenant test ihtiyaclari icin `digerKurum` ve `digerKullanici` da hazir.
export async function ortamKur(db: AnyPrisma): Promise<Ortam> {
  await rolIzinSeedle(db);
  const kurum = await kurumOlusturFiks(db, "Test Kurum A");
  const digerKurum = await kurumOlusturFiks(db, "Test Kurum B");

  const superAdmin = await kullaniciOlusturFiks(db, {
    kurumId: kurum.id,
    rolKod: "SUPER_ADMIN",
  });
  const personel = await kullaniciOlusturFiks(db, {
    kurumId: kurum.id,
    rolKod: "PERSONEL",
  });
  const digerKullanici = await kullaniciOlusturFiks(db, {
    kurumId: digerKurum.id,
    rolKod: "PERSONEL",
  });

  return { kurum, digerKurum, superAdmin, personel, digerKullanici };
}

export type ProjeFiksOps = {
  kurumId: string;
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
    kurum_id: ops.kurumId,
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

// Bir kuruma birden fazla proje seedle — sira monoton artar.
// `tipler` her bir projenin durumunu belirler (default: hepsi aktif).
export async function projeleriSeedle(
  db: AnyPrisma,
  args: {
    kurumId: string;
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
      kurumId: args.kurumId,
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
