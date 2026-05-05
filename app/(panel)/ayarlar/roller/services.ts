import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { IZIN_KODLARI, type IzinKodu } from "@/lib/permissions-katalog";
import { rolIzinVersiyonuArtir } from "@/lib/permissions-versiyon";
import { ROL_KODLARI, SISTEM_ROL_KODLARI } from "@/lib/roller";
import type {
  KullaniciyaRolAtaGirdi,
  RolCogaltGirdi,
  RolGuncelleGirdi,
  RolIzinleriniGuncelleGirdi,
  RolOlusturGirdi,
} from "./schemas";

export type RolSatiri = {
  id: string;
  kod: string;
  ad: string;
  aciklama: string | null;
  sistem_rolu: boolean;
  izin_versiyonu: number;
  kullanici_sayisi: number;
  izin_sayisi: number;
};

export type RolDetay = {
  id: string;
  kod: string;
  ad: string;
  aciklama: string | null;
  sistem_rolu: boolean;
  izin_versiyonu: number;
  izinler: string[];
  kullanicilar: Array<{
    id: string;
    ad: string;
    soyad: string;
    email: string;
    aktif: boolean;
  }>;
};

// ============================================================
// Listeleme & detay
// ============================================================

export async function rolleriListele(arama?: string): Promise<RolSatiri[]> {
  const where: Prisma.RolWhereInput = {};
  if (arama && arama.trim().length > 0) {
    const q = arama.trim();
    where.OR = [
      { kod: { contains: q, mode: "insensitive" } },
      { ad: { contains: q, mode: "insensitive" } },
      { aciklama: { contains: q, mode: "insensitive" } },
    ];
  }

  const satirlar = await db.rol.findMany({
    where,
    orderBy: [{ sistem_rolu: "desc" }, { ad: "asc" }],
    select: {
      id: true,
      kod: true,
      ad: true,
      aciklama: true,
      sistem_rolu: true,
      izin_versiyonu: true,
      _count: { select: { kullanicilar: true, izinler: true } },
    },
  });

  return satirlar.map((r) => ({
    id: r.id,
    kod: r.kod,
    ad: r.ad,
    aciklama: r.aciklama,
    sistem_rolu: r.sistem_rolu,
    izin_versiyonu: r.izin_versiyonu,
    kullanici_sayisi: r._count.kullanicilar,
    izin_sayisi: r._count.izinler,
  }));
}

export async function rolDetayiniGetir(rolId: string): Promise<RolDetay> {
  const rol = await db.rol.findUnique({
    where: { id: rolId },
    select: {
      id: true,
      kod: true,
      ad: true,
      aciklama: true,
      sistem_rolu: true,
      izin_versiyonu: true,
      izinler: { select: { izin: { select: { kod: true } } } },
      kullanicilar: {
        select: {
          kullanici: {
            select: {
              id: true,
              ad: true,
              soyad: true,
              email: true,
              aktif: true,
              silindi_mi: true,
            },
          },
        },
        orderBy: { kullanici: { ad: "asc" } },
      },
    },
  });

  if (!rol) {
    throw new EylemHatasi("Rol bulunamadı.", HATA_KODU.BULUNAMADI);
  }

  return {
    id: rol.id,
    kod: rol.kod,
    ad: rol.ad,
    aciklama: rol.aciklama,
    sistem_rolu: rol.sistem_rolu,
    izin_versiyonu: rol.izin_versiyonu,
    izinler: rol.izinler.map((ri) => ri.izin.kod),
    kullanicilar: rol.kullanicilar
      .filter((kr) => !kr.kullanici.silindi_mi)
      .map((kr) => ({
        id: kr.kullanici.id,
        ad: kr.kullanici.ad,
        soyad: kr.kullanici.soyad,
        email: kr.kullanici.email,
        aktif: kr.kullanici.aktif,
      })),
  };
}

// ============================================================
// Rol CRUD
// ============================================================

export async function rolOlustur(
  girdi: RolOlusturGirdi,
): Promise<{ id: string }> {
  if (SISTEM_ROL_KODLARI.includes(girdi.kod as (typeof SISTEM_ROL_KODLARI)[number])) {
    throw new EylemHatasi(
      "Bu kod sistem rolüne ayrılmıştır.",
      HATA_KODU.GECERSIZ_GIRDI,
      { kod: "Bu kod kullanılamaz." },
    );
  }

  const cakisan = await db.rol.findUnique({
    where: { kod: girdi.kod },
    select: { id: true },
  });
  if (cakisan) {
    throw new EylemHatasi("Bu kod ile bir rol zaten var.", HATA_KODU.CAKISMA, {
      kod: "Kod kullanımda.",
    });
  }

  const izinIdleri = await izinKodlariniIdyeCevir(girdi.izinler);

  const sonuc = await db.$transaction(async (tx) => {
    const rol = await tx.rol.create({
      data: {
        kod: girdi.kod,
        ad: girdi.ad,
        aciklama: girdi.aciklama ?? null,
        sistem_rolu: false,
      },
      select: { id: true },
    });
    if (izinIdleri.length > 0) {
      await tx.rolIzin.createMany({
        data: izinIdleri.map((izin_id) => ({ rol_id: rol.id, izin_id })),
      });
    }
    return rol;
  });

  return sonuc;
}

export async function rolGuncelle(girdi: RolGuncelleGirdi): Promise<void> {
  const rol = await rolGetirVeyaHataFirlat(girdi.id);
  // Sistem rolünün ad/açıklaması düzenlenebilir; kod kilitli (zaten formda yok).
  await db.rol.update({
    where: { id: rol.id },
    data: { ad: girdi.ad, aciklama: girdi.aciklama ?? null },
  });
}

export async function rolSil(
  rolId: string,
  islemiYapanKullaniciId: string,
): Promise<void> {
  const rol = await rolGetirVeyaHataFirlat(rolId);

  if (rol.sistem_rolu) {
    throw new EylemHatasi(
      "Sistem rolleri silinemez.",
      HATA_KODU.YETKISIZ,
    );
  }

  const kullaniciSayisi = await db.kullaniciRol.count({
    where: { rol_id: rolId },
  });
  if (kullaniciSayisi > 0) {
    throw new EylemHatasi(
      "Bu role atanmış kullanıcılar var. Önce rolü kullanıcılardan kaldırın.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }

  // Self-lockout: kullanıcının kendi rolü ROL_YONET izni taşıyorsa ve son
  // ROL_YONET kaynağıysa silmeyi reddet.
  await sonAdminGuard(rolId, islemiYapanKullaniciId, []);

  await db.rol.delete({ where: { id: rolId } });
}

// ============================================================
// İzin atama (rol detay sayfası — kalp)
// ============================================================

export async function rolIzinleriniGuncelle(
  girdi: RolIzinleriniGuncelleGirdi,
  islemiYapanKullaniciId: string,
): Promise<{ izin_versiyonu: number }> {
  const rol = await rolGetirVeyaHataFirlat(girdi.id);
  await sonAdminGuard(rol.id, islemiYapanKullaniciId, girdi.izinler);

  const izinIdleri = await izinKodlariniIdyeCevir(girdi.izinler);

  const yeniVersiyon = await db.$transaction(async (tx) => {
    await tx.rolIzin.deleteMany({ where: { rol_id: rol.id } });
    if (izinIdleri.length > 0) {
      await tx.rolIzin.createMany({
        data: izinIdleri.map((izin_id) => ({ rol_id: rol.id, izin_id })),
      });
    }
    return rolIzinVersiyonuArtir(tx, rol.id);
  });

  return { izin_versiyonu: yeniVersiyon };
}

// ============================================================
// Çoğaltma (rol şablonu)
// ============================================================

export async function rolCogalt(girdi: RolCogaltGirdi): Promise<{ id: string }> {
  const kaynak = await rolGetirVeyaHataFirlat(girdi.kaynakId);

  if (
    SISTEM_ROL_KODLARI.includes(
      girdi.kod as (typeof SISTEM_ROL_KODLARI)[number],
    )
  ) {
    throw new EylemHatasi(
      "Bu kod sistem rolüne ayrılmıştır.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }

  const cakisan = await db.rol.findUnique({
    where: { kod: girdi.kod },
    select: { id: true },
  });
  if (cakisan) {
    throw new EylemHatasi("Bu kod ile bir rol zaten var.", HATA_KODU.CAKISMA);
  }

  const sonuc = await db.$transaction(async (tx) => {
    const yeni = await tx.rol.create({
      data: {
        kod: girdi.kod,
        ad: girdi.ad,
        aciklama: girdi.aciklama ?? null,
        sistem_rolu: false,
      },
      select: { id: true },
    });
    const kaynakIzinler = await tx.rolIzin.findMany({
      where: { rol_id: kaynak.id },
      select: { izin_id: true },
    });
    if (kaynakIzinler.length > 0) {
      await tx.rolIzin.createMany({
        data: kaynakIzinler.map((ki) => ({
          rol_id: yeni.id,
          izin_id: ki.izin_id,
        })),
      });
    }
    return yeni;
  });

  return sonuc;
}

// ============================================================
// Kullanıcıya rol atama
// ============================================================

export async function kullaniciyaRolAta(
  girdi: KullaniciyaRolAtaGirdi,
  islemiYapanKullaniciId: string,
): Promise<void> {
  const kullanici = await db.kullanici.findUnique({
    where: { id: girdi.kullaniciId },
    select: { id: true, silindi_mi: true },
  });
  if (!kullanici || kullanici.silindi_mi) {
    throw new EylemHatasi("Kullanıcı bulunamadı.", HATA_KODU.BULUNAMADI);
  }

  // Tüm rol id'leri var mı, varsa kodlarını al — politika kontrolü için.
  const rolKayitlari = await db.rol.findMany({
    where: { id: { in: girdi.rolIdleri } },
    select: { id: true, kod: true },
  });
  if (rolKayitlari.length !== girdi.rolIdleri.length) {
    throw new EylemHatasi("Geçersiz rol seçimi.", HATA_KODU.GECERSIZ_GIRDI);
  }

  // Self-lockout: kullanıcı kendisinin son rol-yönetimi yetkisini
  // kaldırmaya kalkıyorsa engelle. Granüler izinlerden en azından biri
  // kalmalı (ROL_OLUSTUR/DUZENLE/IZIN_ATA/COGALT/SIL/KULLANICIYA_ATA).
  if (girdi.kullaniciId === islemiYapanKullaniciId) {
    const yeniIzinler = await izinSetiAlinmasiBeklenen(girdi.rolIdleri);
    const rolYonetimiYetkisi = ROL_YONETIMI_IZINLERI.some((k) =>
      yeniIzinler.has(k),
    );
    if (!rolYonetimiYetkisi) {
      throw new EylemHatasi(
        "Kendi rollerinizden tüm rol-yönetimi yetkilerini kaldıramazsınız.",
        HATA_KODU.YETKISIZ,
      );
    }
  }

  await db.$transaction([
    db.kullaniciRol.deleteMany({ where: { kullanici_id: girdi.kullaniciId } }),
    db.kullaniciRol.createMany({
      data: girdi.rolIdleri.map((rol_id) => ({
        kullanici_id: girdi.kullaniciId,
        rol_id,
        atayan_id: islemiYapanKullaniciId,
      })),
    }),
  ]);
}

// ============================================================
// Helpers
// ============================================================

async function rolGetirVeyaHataFirlat(rolId: string): Promise<{
  id: string;
  kod: string;
  sistem_rolu: boolean;
}> {
  const rol = await db.rol.findUnique({
    where: { id: rolId },
    select: { id: true, kod: true, sistem_rolu: true },
  });
  if (!rol) {
    throw new EylemHatasi("Rol bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return rol;
}

async function izinKodlariniIdyeCevir(kodlar: string[]): Promise<string[]> {
  if (kodlar.length === 0) return [];
  const kayitlar = await db.izin.findMany({
    where: { kod: { in: kodlar } },
    select: { id: true, kod: true },
  });
  if (kayitlar.length !== kodlar.length) {
    const bulunan = new Set(kayitlar.map((k) => k.kod));
    const eksikler = kodlar.filter((k) => !bulunan.has(k));
    throw new EylemHatasi(
      `Tanımsız izin kodu: ${eksikler.join(", ")}`,
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  return kayitlar.map((k) => k.id);
}

// ADR-0014: rol-yönetimi izinleri kümesi — en az biri olan kullanıcı
// rol matrisini düzenleyebiliyor demek.
const ROL_YONETIMI_IZINLERI: IzinKodu[] = [
  IZIN_KODLARI.ROL_OLUSTUR,
  IZIN_KODLARI.ROL_DUZENLE,
  IZIN_KODLARI.ROL_IZIN_ATA,
  IZIN_KODLARI.ROL_COGALT,
  IZIN_KODLARI.ROL_SIL,
  IZIN_KODLARI.ROL_KULLANICIYA_ATA,
];

/**
 * ADR-0013/0014 last-admin koruması.
 *
 * Kullanıcı bu rol içinde mi VE rolden tüm rol-yönetimi izinleri
 * kaldırılıyorsa, kullanıcının başka rolünde rol-yönetimi izni var mı
 * kontrol et. Yoksa reddet — kendi yetkisinden mahrum kalmasın.
 */
async function sonAdminGuard(
  rolId: string,
  islemiYapanKullaniciId: string,
  yeniIzinKodlari: string[],
): Promise<void> {
  const yapanKendiRoluMu = await db.kullaniciRol.findUnique({
    where: {
      kullanici_id_rol_id: {
        kullanici_id: islemiYapanKullaniciId,
        rol_id: rolId,
      },
    },
    select: { kullanici_id: true },
  });
  if (!yapanKendiRoluMu) return;

  // Yeni izin setinde rol-yönetimi izinlerinden EN AZ BİRİ varsa → güvenli.
  const yeniSet = new Set(yeniIzinKodlari);
  if (ROL_YONETIMI_IZINLERI.some((k) => yeniSet.has(k))) return;

  // Yapan kullanıcının diğer rollerinde rol-yönetimi izni var mı?
  const digerRoldeYetki = await db.kullaniciRol.findFirst({
    where: {
      kullanici_id: islemiYapanKullaniciId,
      NOT: { rol_id: rolId },
      rol: {
        izinler: {
          some: { izin: { kod: { in: ROL_YONETIMI_IZINLERI } } },
        },
      },
    },
    select: { rol_id: true },
  });
  if (digerRoldeYetki) return;

  // Makam rolü mü? SUPER_ADMIN/KAYMAKAM ise zaten "*" izniyle erişir.
  const makamRolu = await db.kullaniciRol.findFirst({
    where: {
      kullanici_id: islemiYapanKullaniciId,
      rol: {
        kod: { in: [ROL_KODLARI.SUPER_ADMIN, ROL_KODLARI.KAYMAKAM] },
      },
      NOT: { rol_id: rolId },
    },
    select: { rol_id: true },
  });
  if (makamRolu) return;

  throw new EylemHatasi(
    "Bu işlem kendi rol-yönetimi yetkinizi tamamen kaldırırdı. Başka bir kullanıcıya rol-yönetimi yetkisi verdikten sonra deneyin.",
    HATA_KODU.YETKISIZ,
  );
}

/**
 * Verilen rol id'lerinin toplam izin setini döner — atama öncesi
 * politika kontrolü için.
 */
async function izinSetiAlinmasiBeklenen(
  rolIdleri: string[],
): Promise<Set<string>> {
  if (rolIdleri.length === 0) return new Set();
  const satirlar = await db.rolIzin.findMany({
    where: { rol_id: { in: rolIdleri } },
    select: { izin: { select: { kod: true } } },
  });
  return new Set(satirlar.map((s) => s.izin.kod));
}

// İzin kataloğu listesi (rol detay sayfası matrisini doldurmak için).
export async function tumIzinleriListele(): Promise<
  Array<{
    id: string;
    kod: IzinKodu;
    ad: string;
    aciklama: string | null;
    kategori: import("@prisma/client").IzinKategorisi;
    alt_kategori: string | null;
  }>
> {
  const satirlar = await db.izin.findMany({
    orderBy: [
      { kategori: "asc" },
      { alt_kategori: "asc" },
      { kod: "asc" },
    ],
    select: {
      id: true,
      kod: true,
      ad: true,
      aciklama: true,
      kategori: true,
      alt_kategori: true,
    },
  });
  return satirlar.map((s) => ({
    id: s.id,
    kod: s.kod as IzinKodu,
    ad: s.ad,
    aciklama: s.aciklama,
    kategori: s.kategori,
    alt_kategori: s.alt_kategori,
  }));
}
