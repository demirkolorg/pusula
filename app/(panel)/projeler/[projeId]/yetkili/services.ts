import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import type {
  KartAdayKullanicilar,
  ProjeAdayKullanicilar,
  ProjeyeYetkiliEkle,
} from "./schemas";

export type ProjeYetkiliOzeti = {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
  eklenme_zamani: Date;
};

export type AdayKullanici = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  // Why birim görünümü: aday listesi sistem genelinden çekildiği için aynı
  // ad/soyad farklı birimlerda olabilir; kullanıcı doğru kişiyi seçebilsin.
  birim_ad: string | null;
};

// =====================================================================
// Erişim doğrulama
// =====================================================================

async function projeyeErisimDogrula(
  _birimId: string,
  projeId: string,
): Promise<void> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const p = await db.proje.findUnique({
    where: { id: projeId },
    select: { silindi_mi: true },
  });
  if (!p || p.silindi_mi) {
    throw new EylemHatasi("Proje bulunamadı.", HATA_KODU.BULUNAMADI);
  }
}

async function kartiBulVeProjeAl(
  _birimId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: { select: { proje_id: true } },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id };
}

export async function kartProjeIdGetir(kartId: string): Promise<string> {
  return (await kartiBulVeProjeAl("", kartId)).proje_id;
}

export async function listeProjeIdGetir(listeId: string): Promise<string> {
  const liste = await db.liste.findUnique({
    where: { id: listeId },
    select: { proje_id: true },
  });
  if (!liste) {
    throw new EylemHatasi("Liste bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return liste.proje_id;
}

async function aktifKullaniciDogrula(kullaniciId: string): Promise<void> {
  const kullanici = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { aktif: true, silindi_mi: true, onay_durumu: true },
  });
  if (
    !kullanici ||
    kullanici.silindi_mi ||
    !kullanici.aktif ||
    kullanici.onay_durumu !== "ONAYLANDI"
  ) {
    throw new EylemHatasi("Kullanıcı bulunamadı.", HATA_KODU.BULUNAMADI);
  }
}

// =====================================================================
// Proje yetkili yönetimi
// =====================================================================

export async function projeYetkilileriniListele(
  birimId: string,
  projeId: string,
): Promise<ProjeYetkiliOzeti[]> {
  await projeyeErisimDogrula(birimId, projeId);
  const yetkililer = await db.projeYetkilisi.findMany({
    where: { proje_id: projeId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      kullanici_id: true,
      eklenme_zamani: true,
      kullanici: { select: { ad: true, soyad: true, email: true } },
    },
  });
  return yetkililer.map((u) => ({
    kullanici_id: u.kullanici_id,
    ad: u.kullanici.ad,
    soyad: u.kullanici.soyad,
    email: u.kullanici.email,
    eklenme_zamani: u.eklenme_zamani,
  }));
}

export async function projeAdayKullanicilariniAra(
  birimId: string,
  girdi: ProjeAdayKullanicilar,
): Promise<AdayKullanici[]> {
  // Why erişim doğrula: sadece projeyi görebildiğinden emin ol; aday havuzu
  // sistem geneli (birim filtresi kaldırıldı, çoklu birim atama desteklenir).
  await projeyeErisimDogrula(birimId, girdi.proje_id);
  const aramaQ = girdi.q?.trim() ?? "";
  const sonuc = await db.kullanici.findMany({
    where: {
      silindi_mi: false,
      aktif: true,
      onay_durumu: "ONAYLANDI",
      // Proje yetkilisi olmayanlar
      proje_yetkileri: { none: { proje_id: girdi.proje_id } },
      ...(aramaQ
        ? {
            OR: [
              { ad: { contains: aramaQ, mode: "insensitive" } },
              { soyad: { contains: aramaQ, mode: "insensitive" } },
              { email: { contains: aramaQ, mode: "insensitive" } },
              {
                birim: { ad: { contains: aramaQ, mode: "insensitive" } },
              },
              {
                birim: { kisa_ad: { contains: aramaQ, mode: "insensitive" } },
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
  return sonuc.map((k) => ({
    id: k.id,
    ad: k.ad,
    soyad: k.soyad,
    email: k.email,
    birim_ad: k.birim?.kisa_ad ?? k.birim?.ad ?? null,
  }));
}

export async function projeyeYetkiliEkle(
  birimId: string,
  girdi: ProjeyeYetkiliEkle,
): Promise<ProjeYetkiliOzeti> {
  await projeyeErisimDogrula(birimId, girdi.proje_id);
  // Kullanıcı sistem genelinden eklenebilir (birim izolasyonu kaldırıldı —
  // aday listesi de tüm birimlerden kullanıcı dönüyor). Sadece silinmiş /
  // var olmayan kullanıcılar reddedilir; aktiflik & onay durumu aday
  // sorgusunda zaten süzülmüş olur.
  const k = await db.kullanici.findUnique({
    where: { id: girdi.kullanici_id },
    select: { ad: true, soyad: true, email: true, silindi_mi: true },
  });
  if (!k || k.silindi_mi) {
    throw new EylemHatasi(
      "Kullanıcı bulunamadı.",
      HATA_KODU.BULUNAMADI,
    );
  }
  try {
    const yeni = await db.projeYetkilisi.create({
      data: {
        proje_id: girdi.proje_id,
        kullanici_id: girdi.kullanici_id,
      },
      select: { eklenme_zamani: true },
    });
    return {
      kullanici_id: girdi.kullanici_id,
      ad: k.ad,
      soyad: k.soyad,
      email: k.email,
      eklenme_zamani: yeni.eklenme_zamani,
    };
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new EylemHatasi(
        "Bu kullanıcı zaten projenin yetkilisi.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
    throw err;
  }
}

export async function projeyeYetkiliKaldir(
  birimId: string,
  projeId: string,
  kullaniciId: string,
): Promise<void> {
  await projeyeErisimDogrula(birimId, projeId);
  // Son yetkiliyi çıkarmaya izin verme — proje sahipsiz kalmasın.
  // (ADR-0012 öncesinde "son ADMIN" koruması vardı; seviye kalkınca son yetkili
  // koruması yeterli — sistem rolü makamı/admini ayrıca her projeyi görür.)
  const yetkili = await db.projeYetkilisi.findUnique({
    where: {
      proje_id_kullanici_id: { proje_id: projeId, kullanici_id: kullaniciId },
    },
    select: { proje_id: true },
  });
  if (!yetkili) return; // Idempotent
  const yetkiliSayisi = await db.projeYetkilisi.count({
    where: { proje_id: projeId },
  });
  if (yetkiliSayisi <= 1) {
    throw new EylemHatasi(
      "Projedeki son yetkili çıkarılamaz.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  await db.projeYetkilisi.delete({
    where: { proje_id_kullanici_id: { proje_id: projeId, kullanici_id: kullaniciId } },
  });
}

// =====================================================================
// Kart yetkili atama
// =====================================================================

export type KartYetkiliOzeti = {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
};

export async function kartAdayKullanicilariniAra(
  birimId: string,
  girdi: KartAdayKullanicilar,
): Promise<AdayKullanici[]> {
  await kartiBulVeProjeAl(birimId, girdi.kart_id);
  const aramaQ = girdi.q?.trim() ?? "";
  const sonuc = await db.kullanici.findMany({
    where: {
      silindi_mi: false,
      aktif: true,
      onay_durumu: "ONAYLANDI",
      kart_yetkileri: { none: { kart_id: girdi.kart_id } },
      ...(aramaQ
        ? {
            OR: [
              { ad: { contains: aramaQ, mode: "insensitive" } },
              { soyad: { contains: aramaQ, mode: "insensitive" } },
              { email: { contains: aramaQ, mode: "insensitive" } },
              { birim: { ad: { contains: aramaQ, mode: "insensitive" } } },
              {
                birim: { kisa_ad: { contains: aramaQ, mode: "insensitive" } },
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
  return sonuc.map((k) => ({
    id: k.id,
    ad: k.ad,
    soyad: k.soyad,
    email: k.email,
    birim_ad: k.birim?.kisa_ad ?? k.birim?.ad ?? null,
  }));
}

export async function kartinYetkilileri(
  birimId: string,
  kartId: string,
): Promise<KartYetkiliOzeti[]> {
  await kartiBulVeProjeAl(birimId, kartId);
  const yetkililer = await db.kartYetkilisi.findMany({
    where: { kart_id: kartId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      kullanici_id: true,
      kullanici: { select: { ad: true, soyad: true, email: true } },
    },
  });
  return yetkililer.map((u) => ({
    kullanici_id: u.kullanici_id,
    ad: u.kullanici.ad,
    soyad: u.kullanici.soyad,
    email: u.kullanici.email,
  }));
}

export async function kartaYetkiliEkle(
  birimId: string,
  kartId: string,
  kullaniciId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  await aktifKullaniciDogrula(kullaniciId);
  await db.kartYetkilisi.upsert({
    where: { kart_id_kullanici_id: { kart_id: kartId, kullanici_id: kullaniciId } },
    create: { kart_id: kartId, kullanici_id: kullaniciId },
    update: {},
  });
  yayinla(SOCKET.YETKILI_KART_EKLE, room.kart(kartId), {
    kart_id: kartId,
    kullanici_id: kullaniciId,
  }).catch(() => {});
}

export async function kartaYetkiliKaldir(
  birimId: string,
  kartId: string,
  kullaniciId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  await db.kartYetkilisi
    .delete({
      where: {
        kart_id_kullanici_id: { kart_id: kartId, kullanici_id: kullaniciId },
      },
    })
    .catch(() => {
      // Idempotent
    });
  yayinla(SOCKET.YETKILI_KART_KALDIR, room.kart(kartId), {
    kart_id: kartId,
    kullanici_id: kullaniciId,
  }).catch(() => {});
}
