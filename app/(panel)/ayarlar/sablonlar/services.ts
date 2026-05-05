// Proje Şablonları service katmanı (ADR-0021).
// CRUD + "şablondan proje oluştur" yardımcısı.
// Kontrol Kural 45 (transaction birden fazla yazımda), 50 (RBAC), 71 (raw query yok).

import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { siraSonuna } from "@/lib/sira";
import type {
  SablonGuncelle,
  SablonOlustur,
  SablonSil,
} from "./schemas";

// =====================================================================
// Tipler
// =====================================================================

export type SablonOzet = {
  id: string;
  ad: string;
  aciklama: string | null;
  kapak_renk: string | null;
  kapak_ikon: string | null;
  sistem_mi: boolean;
  sistem_kodu: string | null;
  olusturan_id: string | null;
  listeler: { id: string; ad: string; sira: string; wip_limit: number | null }[];
  olusturma_zamani: Date;
};

// =====================================================================
// Listele — sistem + kullanıcı kendi şablonları
// =====================================================================

/**
 * Kullanıcının görebileceği şablonlar:
 * - Tüm sistem şablonları (sistem_mi = true)
 * - Kendi oluşturduğu şablonlar (olusturan_id = kullaniciId)
 *
 * Sistem şablonu önce, sonra kullanıcı şablonu (en yeni en üstte).
 */
export async function sablonlariListele(
  kullaniciId: string,
): Promise<SablonOzet[]> {
  const sablonlar = await db.projeSablonu.findMany({
    where: {
      silindi_mi: false,
      OR: [{ sistem_mi: true }, { olusturan_id: kullaniciId }],
    },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      kapak_ikon: true,
      sistem_mi: true,
      sistem_kodu: true,
      olusturan_id: true,
      olusturma_zamani: true,
      listeler: {
        select: { id: true, ad: true, sira: true, wip_limit: true },
        orderBy: { sira: "asc" },
      },
    },
    orderBy: [{ sistem_mi: "desc" }, { olusturma_zamani: "desc" }],
  });
  return sablonlar;
}

export async function sablonAl(
  kullaniciId: string,
  id: string,
): Promise<SablonOzet> {
  const s = await db.projeSablonu.findUnique({
    where: { id },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      kapak_renk: true,
      kapak_ikon: true,
      sistem_mi: true,
      sistem_kodu: true,
      olusturan_id: true,
      silindi_mi: true,
      olusturma_zamani: true,
      listeler: {
        select: { id: true, ad: true, sira: true, wip_limit: true },
        orderBy: { sira: "asc" },
      },
    },
  });
  if (!s || s.silindi_mi) {
    throw new EylemHatasi("Şablon bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (!s.sistem_mi && s.olusturan_id !== kullaniciId) {
    throw new EylemHatasi(
      "Bu şablonu görme yetkiniz yok.",
      HATA_KODU.YETKISIZ,
    );
  }
  return s;
}

// =====================================================================
// CRUD
// =====================================================================

export async function sablonOlustur(
  kullaniciId: string,
  girdi: SablonOlustur,
): Promise<{ id: string }> {
  const yeni = await db.$transaction(async (tx) => {
    const sablon = await tx.projeSablonu.create({
      data: {
        ad: girdi.ad,
        aciklama: girdi.aciklama ?? null,
        kapak_renk: girdi.kapak_renk ?? null,
        kapak_ikon: girdi.kapak_ikon ?? null,
        sistem_mi: false,
        olusturan_id: kullaniciId,
      },
      select: { id: true },
    });

    let oncekiSira: string | null = null;
    for (const l of girdi.listeler) {
      const sira = siraSonuna(oncekiSira);
      await tx.sablonListesi.create({
        data: {
          sablon_id: sablon.id,
          ad: l.ad,
          sira,
          wip_limit: l.wip_limit ?? null,
        },
      });
      oncekiSira = sira;
    }
    return sablon;
  });
  return { id: yeni.id };
}

export async function sablonGuncelle(
  kullaniciId: string,
  girdi: SablonGuncelle,
): Promise<{ id: string }> {
  const mevcut = await db.projeSablonu.findUnique({
    where: { id: girdi.id },
    select: { sistem_mi: true, olusturan_id: true, silindi_mi: true },
  });
  if (!mevcut || mevcut.silindi_mi) {
    throw new EylemHatasi("Şablon bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (mevcut.sistem_mi) {
    throw new EylemHatasi(
      "Sistem şablonları düzenlenemez.",
      HATA_KODU.YETKISIZ,
    );
  }
  if (mevcut.olusturan_id !== kullaniciId) {
    throw new EylemHatasi(
      "Bu şablonu düzenleme yetkiniz yok.",
      HATA_KODU.YETKISIZ,
    );
  }

  await db.$transaction(async (tx) => {
    await tx.projeSablonu.update({
      where: { id: girdi.id },
      data: {
        ad: girdi.ad,
        aciklama: girdi.aciklama ?? null,
        kapak_renk: girdi.kapak_renk ?? null,
        kapak_ikon: girdi.kapak_ikon ?? null,
      },
    });
    // Listeleri sil + yeniden oluştur (sıralama korunur).
    // SablonListesi karta bağlanmaz, ID değişimi safe.
    await tx.sablonListesi.deleteMany({ where: { sablon_id: girdi.id } });
    let oncekiSira: string | null = null;
    for (const l of girdi.listeler) {
      const sira = siraSonuna(oncekiSira);
      await tx.sablonListesi.create({
        data: {
          sablon_id: girdi.id,
          ad: l.ad,
          sira,
          wip_limit: l.wip_limit ?? null,
        },
      });
      oncekiSira = sira;
    }
  });
  return { id: girdi.id };
}

export async function sablonSil(
  kullaniciId: string,
  girdi: SablonSil,
): Promise<{ id: string }> {
  const mevcut = await db.projeSablonu.findUnique({
    where: { id: girdi.id },
    select: { sistem_mi: true, olusturan_id: true, silindi_mi: true },
  });
  if (!mevcut || mevcut.silindi_mi) {
    throw new EylemHatasi("Şablon bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (mevcut.sistem_mi) {
    throw new EylemHatasi(
      "Sistem şablonları silinemez.",
      HATA_KODU.YETKISIZ,
    );
  }
  if (mevcut.olusturan_id !== kullaniciId) {
    throw new EylemHatasi(
      "Bu şablonu silme yetkiniz yok.",
      HATA_KODU.YETKISIZ,
    );
  }
  // Soft delete — kullanıcı geri yükleyebilsin diye (çöp kutusu v2'de
  // şablon tipi opsiyonel; şimdilik sadece silindi_mi flag).
  await db.projeSablonu.update({
    where: { id: girdi.id },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
  return { id: girdi.id };
}

// =====================================================================
// "Şablondan proje oluştur" yardımcısı
// =====================================================================

/**
 * Verilen şablon ID'sinin listelerini döndürür. `proje/services.ts`
 * `projeOlustur` fonksiyonu tarafından çağrılır — şablon listeleri yeni
 * projeye kopyalanır (sıralama + wip_limit korunur).
 *
 * Sistem şablonu için yetki kontrolü yok; kullanıcı şablonu için sadece
 * sahibi kullanabilir.
 */
export async function sablonListeleriniGetir(
  kullaniciId: string,
  sablonId: string,
): Promise<{ ad: string; sira: string; wip_limit: number | null }[]> {
  const s = await db.projeSablonu.findUnique({
    where: { id: sablonId },
    select: {
      sistem_mi: true,
      olusturan_id: true,
      silindi_mi: true,
      listeler: {
        select: { ad: true, sira: true, wip_limit: true },
        orderBy: { sira: "asc" },
      },
    },
  });
  if (!s || s.silindi_mi) {
    throw new EylemHatasi("Şablon bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (!s.sistem_mi && s.olusturan_id !== kullaniciId) {
    throw new EylemHatasi(
      "Bu şablonu kullanma yetkiniz yok.",
      HATA_KODU.YETKISIZ,
    );
  }
  return s.listeler;
}
