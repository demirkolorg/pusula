import type { Prisma } from "@prisma/client";
import React from "react";
import { db } from "@/lib/db";
import { mailGonder, mailHtmlRender } from "@/lib/mail";
import { DavetMail } from "@/lib/mail-templates/davet";
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

  const mevcutDavet = await db.davetTokeni.findFirst({
    where: { email, kullanildi_mi: false, son_kullanma: { gt: new Date() } },
    select: { id: true },
  });
  if (mevcutDavet) {
    throw new EylemHatasi(
      "Bu e-posta için aktif bir davet zaten var.",
      HATA_KODU.CAKISMA,
      { email: "Bu e-posta için aktif bir davet zaten var." },
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

    if (girdi.proje_baglamlari.length > 0) {
      const projeIdleri = girdi.proje_baglamlari.map((b) => b.proje_id);
      const projeler = await tx.proje.findMany({
        where: { id: { in: projeIdleri } },
        select: { id: true, silindi_mi: true },
      });
      const bulunan = new Map(projeler.map((p) => [p.id, p.silindi_mi]));
      for (const baglam of girdi.proje_baglamlari) {
        const silindi = bulunan.get(baglam.proje_id);
        if (silindi === undefined || silindi) {
          throw new EylemHatasi(
            "Seçilen projelerden biri geçerli değil.",
            HATA_KODU.GECERSIZ_GIRDI,
            { proje_baglamlari: "Geçersiz proje seçimi." },
          );
        }
      }
    }

    if (girdi.liste_baglamlari.length > 0) {
      const listeIdleri = girdi.liste_baglamlari.map((b) => b.liste_id);
      const listeler = await tx.liste.findMany({
        where: { id: { in: listeIdleri } },
        select: { id: true },
      });
      const bulunanIds = new Set(listeler.map((l) => l.id));
      for (const baglam of girdi.liste_baglamlari) {
        if (!bulunanIds.has(baglam.liste_id)) {
          throw new EylemHatasi(
            "Seçilen listelerden biri geçerli değil.",
            HATA_KODU.GECERSIZ_GIRDI,
            { liste_baglamlari: "Geçersiz liste seçimi." },
          );
        }
      }
    }

    if (girdi.kart_baglamlari.length > 0) {
      const kartIdleri = girdi.kart_baglamlari.map((b) => b.kart_id);
      const kartlar = await tx.kart.findMany({
        where: { id: { in: kartIdleri } },
        select: { id: true, silindi_mi: true },
      });
      const bulunan = new Map(kartlar.map((k) => [k.id, k.silindi_mi]));
      for (const baglam of girdi.kart_baglamlari) {
        const silindi = bulunan.get(baglam.kart_id);
        if (silindi === undefined || silindi) {
          throw new EylemHatasi(
            "Seçilen kartlardan biri geçerli değil.",
            HATA_KODU.GECERSIZ_GIRDI,
            { kart_baglamlari: "Geçersiz kart seçimi." },
          );
        }
      }
    }

    const olusturulan = await tx.davetTokeni.create({
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

    if (girdi.proje_baglamlari.length > 0) {
      await tx.davetProjeBaglami.createMany({
        data: girdi.proje_baglamlari.map((b) => ({
          davet_id: olusturulan.id,
          proje_id: b.proje_id,
        })),
        skipDuplicates: true,
      });
    }

    if (girdi.liste_baglamlari.length > 0) {
      await tx.davetListeBaglami.createMany({
        data: girdi.liste_baglamlari.map((b) => ({
          davet_id: olusturulan.id,
          liste_id: b.liste_id,
        })),
        skipDuplicates: true,
      });
    }

    if (girdi.kart_baglamlari.length > 0) {
      await tx.davetKartBaglami.createMany({
        data: girdi.kart_baglamlari.map((b) => ({
          davet_id: olusturulan.id,
          kart_id: b.kart_id,
        })),
        skipDuplicates: true,
      });
    }

    return olusturulan;
  });

  const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2500"}/davet/${kayit.token}`;
  const davetEden = await db.kullanici.findUnique({
    where: { id: davetEdenId },
    select: { ad: true, soyad: true },
  });
  const davetEdenAd = davetEden
    ? `${davetEden.ad} ${davetEden.soyad}`.trim() || null
    : null;

  // Mail fail olursa davet kaydını silip kullanıcıya hata göster — operatör
  // tekrar denesin. Aksi halde "yetim" davet token kalır + mail gitmemiş olur.
  try {
    await davetMailGonder({ email, url, davetEdenAd });
  } catch (err) {
    await db.davetTokeni.delete({ where: { id: kayit.id } }).catch(() => {});
    if (err instanceof EylemHatasi) throw err;
    throw new EylemHatasi(
      err instanceof Error ? err.message : "Davet maili gönderilemedi.",
      HATA_KODU.IC_HATA,
    );
  }

  return kayit;
}

async function davetMailGonder(args: {
  email: string;
  url: string;
  davetEdenAd: string | null;
}): Promise<void> {
  const html = await mailHtmlRender(
    React.createElement(DavetMail, {
      url: args.url,
      omurGun: DAVET_OMUR_GUN,
      davetEdenAd: args.davetEdenAd,
    }),
  );
  const govde = `${
    args.davetEdenAd
      ? `${args.davetEdenAd} sizi Pusula'ya davet etti.`
      : "Pusula'ya davet edildiniz."
  }\n\nHesabınızı oluşturmak için bağlantıya tıklayın. Bağlantı ${DAVET_OMUR_GUN} gün geçerlidir.\n\n${args.url}`;
  await mailGonder({
    alici: args.email,
    konu: "Pusula - Davetiniz",
    govde,
    html,
  });
}

export async function davetiYenidenGonder(
  davetId: string,
): Promise<{ id: string; token: string; email: string }> {
  const davet = await db.davetTokeni.findUnique({
    where: { id: davetId },
    select: {
      id: true,
      token: true,
      email: true,
      kullanildi_mi: true,
      son_kullanma: true,
      davet_eden_id: true,
    },
  });
  if (!davet) {
    throw new EylemHatasi("Davet bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (davet.kullanildi_mi) {
    throw new EylemHatasi(
      "Bu davet zaten kullanılmış.",
      HATA_KODU.CAKISMA,
    );
  }

  // Why: davet süresi dolmuşsa veya 24 saatten az kaldıysa son_kullanma'yı 7 güne uzat.
  // Aksi halde sadece mail tekrar gönderilir, token aynı kalır.
  const simdi = new Date();
  const yeniSonKullanma = new Date(
    simdi.getTime() + DAVET_OMUR_GUN * 24 * 60 * 60 * 1000,
  );
  const kalanMs = davet.son_kullanma.getTime() - simdi.getTime();
  const dunSinir = 24 * 60 * 60 * 1000;
  if (kalanMs < dunSinir) {
    await db.davetTokeni.update({
      where: { id: davet.id },
      data: { son_kullanma: yeniSonKullanma },
    });
  }

  const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2500"}/davet/${davet.token}`;
  const davetEden = await db.kullanici.findUnique({
    where: { id: davet.davet_eden_id },
    select: { ad: true, soyad: true },
  });
  const davetEdenAd = davetEden
    ? `${davetEden.ad} ${davetEden.soyad}`.trim() || null
    : null;

  await davetMailGonder({ email: davet.email, url, davetEdenAd });
  return { id: davet.id, token: davet.token, email: davet.email };
}

export type ProjeBekleyenDavetSatiri = {
  davet_id: string;
  email: string;
  davet_eden_id: string;
  son_kullanma: Date;
  olusturma_zamani: Date;
};

export async function projeBekleyenDavetleriListele(
  projeId: string,
): Promise<ProjeBekleyenDavetSatiri[]> {
  const satirlar = await db.davetProjeBaglami.findMany({
    where: {
      proje_id: projeId,
      davet: { kullanildi_mi: false, son_kullanma: { gt: new Date() } },
    },
    orderBy: { olusturma_zamani: "desc" },
    select: {
      davet_id: true,
      olusturma_zamani: true,
      davet: {
        select: {
          email: true,
          son_kullanma: true,
          davet_eden_id: true,
        },
      },
    },
  });
  return satirlar.map((s) => ({
    davet_id: s.davet_id,
    email: s.davet.email,
    davet_eden_id: s.davet.davet_eden_id,
    son_kullanma: s.davet.son_kullanma,
    olusturma_zamani: s.olusturma_zamani,
  }));
}

export async function projeDavetBaglamiKaldir(
  davetId: string,
  projeId: string,
): Promise<void> {
  await db.davetProjeBaglami.deleteMany({
    where: { davet_id: davetId, proje_id: projeId },
  });
}

export async function listeBekleyenDavetleriListele(
  listeId: string,
): Promise<ProjeBekleyenDavetSatiri[]> {
  const satirlar = await db.davetListeBaglami.findMany({
    where: {
      liste_id: listeId,
      davet: { kullanildi_mi: false, son_kullanma: { gt: new Date() } },
    },
    orderBy: { olusturma_zamani: "desc" },
    select: {
      davet_id: true,
      olusturma_zamani: true,
      davet: {
        select: { email: true, son_kullanma: true, davet_eden_id: true },
      },
    },
  });
  return satirlar.map((s) => ({
    davet_id: s.davet_id,
    email: s.davet.email,
    davet_eden_id: s.davet.davet_eden_id,
    son_kullanma: s.davet.son_kullanma,
    olusturma_zamani: s.olusturma_zamani,
  }));
}

export async function listeDavetBaglamiKaldir(
  davetId: string,
  listeId: string,
): Promise<void> {
  await db.davetListeBaglami.deleteMany({
    where: { davet_id: davetId, liste_id: listeId },
  });
}

export async function kartBekleyenDavetleriListele(
  kartId: string,
): Promise<ProjeBekleyenDavetSatiri[]> {
  const satirlar = await db.davetKartBaglami.findMany({
    where: {
      kart_id: kartId,
      davet: { kullanildi_mi: false, son_kullanma: { gt: new Date() } },
    },
    orderBy: { olusturma_zamani: "desc" },
    select: {
      davet_id: true,
      olusturma_zamani: true,
      davet: {
        select: { email: true, son_kullanma: true, davet_eden_id: true },
      },
    },
  });
  return satirlar.map((s) => ({
    davet_id: s.davet_id,
    email: s.davet.email,
    davet_eden_id: s.davet.davet_eden_id,
    son_kullanma: s.davet.son_kullanma,
    olusturma_zamani: s.olusturma_zamani,
  }));
}

export async function kartDavetBaglamiKaldir(
  davetId: string,
  kartId: string,
): Promise<void> {
  await db.davetKartBaglami.deleteMany({
    where: { davet_id: davetId, kart_id: kartId },
  });
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
