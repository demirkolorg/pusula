import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { siraSonuna } from "@/lib/sira";
import type {
  KontrolListesiGuncelle,
  KontrolListesiOlustur,
  MaddeGuncelle,
  MaddeOlustur,
} from "./schemas";

export type MaddeOzeti = {
  id: string;
  kontrol_listesi_id: string;
  metin: string;
  tamamlandi_mi: boolean;
  tamamlama_zamani: Date | null;
  tamamlayan_id: string | null;
  atanan_id: string | null;
  atanan: { ad: string; soyad: string } | null;
  bitis: Date | null;
  sira: string;
};

export type KontrolListesiOzeti = {
  id: string;
  kart_id: string;
  ad: string;
  sira: string;
  maddeler: MaddeOzeti[];
};

// =====================================================================
// Erişim doğrulama
// =====================================================================

async function kartiBulVeProjeAl(
  kurumId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: { select: { proje_id: true, proje: { select: { kurum_id: true } } } },
    },
  });
  if (!k || k.liste.proje.kurum_id !== kurumId) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id };
}

async function kontrolListesiBulVeKart(
  kurumId: string,
  klId: string,
): Promise<{ kart_id: string; proje_id: string }> {
  const kl = await db.kontrolListesi.findUnique({
    where: { id: klId },
    select: {
      kart_id: true,
      kart: {
        select: {
          liste: {
            select: { proje_id: true, proje: { select: { kurum_id: true } } },
          },
        },
      },
    },
  });
  if (!kl || kl.kart.liste.proje.kurum_id !== kurumId) {
    throw new EylemHatasi("Kontrol listesi bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { kart_id: kl.kart_id, proje_id: kl.kart.liste.proje_id };
}

async function maddeBul(
  kurumId: string,
  maddeId: string,
): Promise<{ kontrol_listesi_id: string; kart_id: string; proje_id: string }> {
  const m = await db.kontrolMaddesi.findUnique({
    where: { id: maddeId },
    select: {
      kontrol_listesi_id: true,
      kontrol_listesi: {
        select: {
          kart_id: true,
          kart: {
            select: {
              liste: {
                select: {
                  proje_id: true,
                  proje: { select: { kurum_id: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!m || m.kontrol_listesi.kart.liste.proje.kurum_id !== kurumId) {
    throw new EylemHatasi("Madde bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return {
    kontrol_listesi_id: m.kontrol_listesi_id,
    kart_id: m.kontrol_listesi.kart_id,
    proje_id: m.kontrol_listesi.kart.liste.proje_id,
  };
}

// =====================================================================
// Kontrol Listesi CRUD
// =====================================================================

export async function kartKontrolListeleriniListele(
  kurumId: string,
  kartId: string,
): Promise<KontrolListesiOzeti[]> {
  await kartiBulVeProjeAl(kurumId, kartId);
  const liste = await db.kontrolListesi.findMany({
    where: { kart_id: kartId },
    orderBy: { sira: "asc" },
    select: {
      id: true,
      kart_id: true,
      ad: true,
      sira: true,
      maddeler: {
        orderBy: { sira: "asc" },
        select: {
          id: true,
          kontrol_listesi_id: true,
          metin: true,
          tamamlandi_mi: true,
          tamamlama_zamani: true,
          tamamlayan_id: true,
          atanan_id: true,
          bitis: true,
          sira: true,
          atanan: { select: { ad: true, soyad: true } },
        },
      },
    },
  });
  return liste.map((kl) => ({
    id: kl.id,
    kart_id: kl.kart_id,
    ad: kl.ad,
    sira: kl.sira,
    maddeler: kl.maddeler.map((m) => ({
      id: m.id,
      kontrol_listesi_id: m.kontrol_listesi_id,
      metin: m.metin,
      tamamlandi_mi: m.tamamlandi_mi,
      tamamlama_zamani: m.tamamlama_zamani,
      tamamlayan_id: m.tamamlayan_id,
      atanan_id: m.atanan_id,
      atanan: m.atanan,
      bitis: m.bitis,
      sira: m.sira,
    })),
  }));
}

export async function kontrolListesiOlustur(
  kurumId: string,
  girdi: KontrolListesiOlustur,
): Promise<KontrolListesiOzeti> {
  await kartiBulVeProjeAl(kurumId, girdi.kart_id);
  const son = await db.kontrolListesi.findFirst({
    where: { kart_id: girdi.kart_id },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);
  const yeni = await db.kontrolListesi.create({
    data: { kart_id: girdi.kart_id, ad: girdi.ad, sira },
    select: { id: true, kart_id: true, ad: true, sira: true },
  });
  return { ...yeni, maddeler: [] };
}

export async function kontrolListesiGuncelle(
  kurumId: string,
  girdi: KontrolListesiGuncelle,
): Promise<void> {
  await kontrolListesiBulVeKart(kurumId, girdi.id);
  await db.kontrolListesi.update({
    where: { id: girdi.id },
    data: { ad: girdi.ad },
  });
}

export async function kontrolListesiSil(
  kurumId: string,
  id: string,
): Promise<void> {
  await kontrolListesiBulVeKart(kurumId, id);
  // Maddeler onDelete: Cascade ile birlikte gider.
  await db.kontrolListesi.delete({ where: { id } });
}

// =====================================================================
// Madde CRUD
// =====================================================================

export async function maddeOlustur(
  kurumId: string,
  girdi: MaddeOlustur,
): Promise<MaddeOzeti> {
  const { proje_id } = await kontrolListesiBulVeKart(
    kurumId,
    girdi.kontrol_listesi_id,
  );
  // atanan proje üyesi mi?
  if (girdi.atanan_id) {
    const uye = await db.projeUyesi.findUnique({
      where: {
        proje_id_kullanici_id: { proje_id, kullanici_id: girdi.atanan_id },
      },
      select: { kullanici_id: true },
    });
    if (!uye) {
      throw new EylemHatasi(
        "Madde sadece proje üyesine atanabilir.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
  }
  const son = await db.kontrolMaddesi.findFirst({
    where: { kontrol_listesi_id: girdi.kontrol_listesi_id },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);
  const yeni = await db.kontrolMaddesi.create({
    data: {
      kontrol_listesi_id: girdi.kontrol_listesi_id,
      metin: girdi.metin,
      atanan_id: girdi.atanan_id ?? null,
      bitis: girdi.bitis ?? null,
      sira,
    },
    select: {
      id: true,
      kontrol_listesi_id: true,
      metin: true,
      tamamlandi_mi: true,
      tamamlama_zamani: true,
      tamamlayan_id: true,
      atanan_id: true,
      bitis: true,
      sira: true,
      atanan: { select: { ad: true, soyad: true } },
    },
  });
  return yeni;
}

export async function maddeGuncelle(
  kurumId: string,
  yapanId: string,
  girdi: MaddeGuncelle,
): Promise<void> {
  const { proje_id } = await maddeBul(kurumId, girdi.id);
  if (girdi.atanan_id) {
    const uye = await db.projeUyesi.findUnique({
      where: {
        proje_id_kullanici_id: { proje_id, kullanici_id: girdi.atanan_id },
      },
      select: { kullanici_id: true },
    });
    if (!uye) {
      throw new EylemHatasi(
        "Madde sadece proje üyesine atanabilir.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
  }

  const veri: Record<string, unknown> = {};
  if (girdi.metin !== undefined) veri.metin = girdi.metin;
  if (girdi.atanan_id !== undefined) veri.atanan_id = girdi.atanan_id;
  if (girdi.bitis !== undefined) veri.bitis = girdi.bitis;
  if (girdi.tamamlandi_mi !== undefined) {
    veri.tamamlandi_mi = girdi.tamamlandi_mi;
    veri.tamamlama_zamani = girdi.tamamlandi_mi ? new Date() : null;
    veri.tamamlayan_id = girdi.tamamlandi_mi ? yapanId : null;
  }

  if (Object.keys(veri).length === 0) return;
  await db.kontrolMaddesi.update({ where: { id: girdi.id }, data: veri });
}

export async function maddeSil(kurumId: string, id: string): Promise<void> {
  await maddeBul(kurumId, id);
  await db.kontrolMaddesi.delete({ where: { id } });
}
