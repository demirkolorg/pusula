import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import type {
  ProjeAdayKullanicilar,
  ProjeyeUyeEkle,
  ProjeUyesiSeviyeGuncelle,
} from "./schemas";

export type ProjeUyeOzeti = {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
  seviye: "ADMIN" | "NORMAL" | "IZLEYICI";
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

// =====================================================================
// Proje üye yönetimi
// =====================================================================

export async function projeUyeleriniListele(
  birimId: string,
  projeId: string,
): Promise<ProjeUyeOzeti[]> {
  await projeyeErisimDogrula(birimId, projeId);
  const uyeler = await db.projeUyesi.findMany({
    where: { proje_id: projeId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      kullanici_id: true,
      seviye: true,
      eklenme_zamani: true,
      kullanici: { select: { ad: true, soyad: true, email: true } },
    },
  });
  return uyeler.map((u) => ({
    kullanici_id: u.kullanici_id,
    ad: u.kullanici.ad,
    soyad: u.kullanici.soyad,
    email: u.kullanici.email,
    seviye: u.seviye,
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
      // Proje üyesi olmayanlar
      proje_uyelik: { none: { proje_id: girdi.proje_id } },
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

export async function projeyeUyeEkle(
  birimId: string,
  girdi: ProjeyeUyeEkle,
): Promise<ProjeUyeOzeti> {
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
    const yeni = await db.projeUyesi.create({
      data: {
        proje_id: girdi.proje_id,
        kullanici_id: girdi.kullanici_id,
        seviye: girdi.seviye,
      },
      select: { seviye: true, eklenme_zamani: true },
    });
    return {
      kullanici_id: girdi.kullanici_id,
      ad: k.ad,
      soyad: k.soyad,
      email: k.email,
      seviye: yeni.seviye,
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
        "Bu kullanıcı zaten projenin üyesi.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
    throw err;
  }
}

export async function projeyeUyeKaldir(
  birimId: string,
  projeId: string,
  kullaniciId: string,
): Promise<void> {
  await projeyeErisimDogrula(birimId, projeId);
  // Son ADMIN'i çıkarmaya izin verme — proje sahipsiz kalmasın.
  const uye = await db.projeUyesi.findUnique({
    where: { proje_id_kullanici_id: { proje_id: projeId, kullanici_id: kullaniciId } },
    select: { seviye: true },
  });
  if (!uye) return; // Yoksa idempotent
  if (uye.seviye === "ADMIN") {
    const adminSayisi = await db.projeUyesi.count({
      where: { proje_id: projeId, seviye: "ADMIN" },
    });
    if (adminSayisi <= 1) {
      throw new EylemHatasi(
        "Projedeki son ADMIN üye çıkarılamaz.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
  }
  // Kullanıcının kart üyelikleri de cascade ile gitmeli — manuel temizle
  // (KartUyesi'nin proje_id alanı yok, doğrudan FK ile bağlı değil).
  await db.$transaction([
    db.kartUyesi.deleteMany({
      where: {
        kullanici_id: kullaniciId,
        kart: { liste: { proje_id: projeId } },
      },
    }),
    db.projeUyesi.delete({
      where: { proje_id_kullanici_id: { proje_id: projeId, kullanici_id: kullaniciId } },
    }),
  ]);
}

export async function projeUyesiSeviyeGuncelle(
  birimId: string,
  girdi: ProjeUyesiSeviyeGuncelle,
): Promise<void> {
  await projeyeErisimDogrula(birimId, girdi.proje_id);
  const uye = await db.projeUyesi.findUnique({
    where: {
      proje_id_kullanici_id: { proje_id: girdi.proje_id, kullanici_id: girdi.kullanici_id },
    },
    select: { seviye: true },
  });
  if (!uye) {
    throw new EylemHatasi("Üye bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  // ADMIN'i NORMAL'e düşürürken son ADMIN olmasın
  if (uye.seviye === "ADMIN" && girdi.seviye !== "ADMIN") {
    const adminSayisi = await db.projeUyesi.count({
      where: { proje_id: girdi.proje_id, seviye: "ADMIN" },
    });
    if (adminSayisi <= 1) {
      throw new EylemHatasi(
        "Projedeki son ADMIN seviyesini düşüremezsiniz.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
  }
  await db.projeUyesi.update({
    where: {
      proje_id_kullanici_id: { proje_id: girdi.proje_id, kullanici_id: girdi.kullanici_id },
    },
    data: { seviye: girdi.seviye },
  });
}

// =====================================================================
// Kart üye atama
// =====================================================================

export type KartUyeOzeti = {
  kullanici_id: string;
  ad: string;
  soyad: string;
  email: string;
};

export async function kartinUyeleri(
  birimId: string,
  kartId: string,
): Promise<KartUyeOzeti[]> {
  await kartiBulVeProjeAl(birimId, kartId);
  const uyeler = await db.kartUyesi.findMany({
    where: { kart_id: kartId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      kullanici_id: true,
      kullanici: { select: { ad: true, soyad: true, email: true } },
    },
  });
  return uyeler.map((u) => ({
    kullanici_id: u.kullanici_id,
    ad: u.kullanici.ad,
    soyad: u.kullanici.soyad,
    email: u.kullanici.email,
  }));
}

export async function kartaUyeEkle(
  birimId: string,
  kartId: string,
  kullaniciId: string,
): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, kartId);
  // Kullanıcı projenin üyesi olmalı
  const uye = await db.projeUyesi.findUnique({
    where: {
      proje_id_kullanici_id: { proje_id, kullanici_id: kullaniciId },
    },
    select: { kullanici_id: true },
  });
  if (!uye) {
    throw new EylemHatasi(
      "Karta atanacak kullanıcı önce proje üyesi olmalı.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  await db.kartUyesi.upsert({
    where: { kart_id_kullanici_id: { kart_id: kartId, kullanici_id: kullaniciId } },
    create: { kart_id: kartId, kullanici_id: kullaniciId },
    update: {},
  });
  yayinla(SOCKET.UYE_KART_EKLE, room.kart(kartId), {
    kart_id: kartId,
    kullanici_id: kullaniciId,
  }).catch(() => {});
}

export async function kartaUyeKaldir(
  birimId: string,
  kartId: string,
  kullaniciId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  await db.kartUyesi
    .delete({
      where: {
        kart_id_kullanici_id: { kart_id: kartId, kullanici_id: kullaniciId },
      },
    })
    .catch(() => {
      // Idempotent
    });
  yayinla(SOCKET.UYE_KART_KALDIR, room.kart(kartId), {
    kart_id: kartId,
    kullanici_id: kullaniciId,
  }).catch(() => {});
}
