import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import type {
  IliskiOlustur,
  KartIliskiTipi,
  ProjeKartiAra,
} from "./schemas";

// İlişki yön bilgisiyle döner: bu kartın açısından "diğer" kart hangisi?
// "yon: 'giden'" → A=ben, B=diğer · "yon: 'gelen'" → A=diğer, B=ben
export type IliskiOzeti = {
  id: string;
  tip: KartIliskiTipi;
  yon: "giden" | "gelen";
  diger_kart: {
    id: string;
    baslik: string;
    liste_ad: string;
    silindi_mi: boolean;
    arsiv_mi: boolean;
  };
};

// =====================================================================
// Erişim doğrulama
// =====================================================================

async function kartiBulVeProjeAl(
  kurumId: string,
  kartId: string,
): Promise<{ proje_id: string; liste_id: string }> {
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste_id: true,
      liste: { select: { proje_id: true, proje: { select: { kurum_id: true } } } },
    },
  });
  if (!k || k.liste.proje.kurum_id !== kurumId) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id, liste_id: k.liste_id };
}

// =====================================================================
// Kart ilişkileri listele
// =====================================================================

export async function kartinIliskileri(
  kurumId: string,
  kartId: string,
): Promise<IliskiOzeti[]> {
  await kartiBulVeProjeAl(kurumId, kartId);

  const select = {
    id: true,
    tip: true,
    kart_a_id: true,
    kart_b_id: true,
    kart_a: {
      select: {
        id: true,
        baslik: true,
        silindi_mi: true,
        arsiv_mi: true,
        liste: { select: { ad: true } },
      },
    },
    kart_b: {
      select: {
        id: true,
        baslik: true,
        silindi_mi: true,
        arsiv_mi: true,
        liste: { select: { ad: true } },
      },
    },
  } as const;

  const [giden, gelen] = await Promise.all([
    db.kartIliskisi.findMany({ where: { kart_a_id: kartId }, select }),
    db.kartIliskisi.findMany({ where: { kart_b_id: kartId }, select }),
  ]);

  const sonuc: IliskiOzeti[] = [];
  for (const r of giden) {
    sonuc.push({
      id: r.id,
      tip: r.tip,
      yon: "giden",
      diger_kart: {
        id: r.kart_b.id,
        baslik: r.kart_b.baslik,
        liste_ad: r.kart_b.liste.ad,
        silindi_mi: r.kart_b.silindi_mi,
        arsiv_mi: r.kart_b.arsiv_mi,
      },
    });
  }
  for (const r of gelen) {
    sonuc.push({
      id: r.id,
      tip: r.tip,
      yon: "gelen",
      diger_kart: {
        id: r.kart_a.id,
        baslik: r.kart_a.baslik,
        liste_ad: r.kart_a.liste.ad,
        silindi_mi: r.kart_a.silindi_mi,
        arsiv_mi: r.kart_a.arsiv_mi,
      },
    });
  }
  return sonuc;
}

// =====================================================================
// İlişki oluştur / sil
// =====================================================================

export async function iliskiOlustur(
  kurumId: string,
  girdi: IliskiOlustur,
): Promise<{ id: string }> {
  if (girdi.kart_a_id === girdi.kart_b_id) {
    throw new EylemHatasi(
      "Kart kendisiyle ilişkilendirilemez.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  const { proje_id: aProje } = await kartiBulVeProjeAl(kurumId, girdi.kart_a_id);
  const { proje_id: bProje } = await kartiBulVeProjeAl(kurumId, girdi.kart_b_id);
  if (aProje !== bProje) {
    throw new EylemHatasi(
      "İlişkilendirilen kartlar aynı projede olmalı.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  try {
    const r = await db.kartIliskisi.create({
      data: {
        kart_a_id: girdi.kart_a_id,
        kart_b_id: girdi.kart_b_id,
        tip: girdi.tip,
      },
      select: { id: true },
    });
    return r;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new EylemHatasi(
        "Bu ilişki zaten var.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
    throw err;
  }
}

export async function iliskiSil(
  kurumId: string,
  iliskiId: string,
): Promise<void> {
  const r = await db.kartIliskisi.findUnique({
    where: { id: iliskiId },
    select: {
      kart_a: { select: { liste: { select: { proje: { select: { kurum_id: true } } } } } },
    },
  });
  if (!r || r.kart_a.liste.proje.kurum_id !== kurumId) {
    throw new EylemHatasi("İlişki bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  await db.kartIliskisi.delete({ where: { id: iliskiId } });
}

// =====================================================================
// Proje içinde kart arama (ilişki için aday)
// =====================================================================

export async function projedeKartiAra(
  kurumId: string,
  girdi: ProjeKartiAra,
): Promise<Array<{ id: string; baslik: string; liste_ad: string }>> {
  const proje = await db.proje.findUnique({
    where: { id: girdi.proje_id },
    select: { kurum_id: true },
  });
  if (!proje || proje.kurum_id !== kurumId) {
    throw new EylemHatasi("Proje bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  const aramaQ = girdi.q?.trim() ?? "";
  const kartlar = await db.kart.findMany({
    where: {
      silindi_mi: false,
      liste: { proje_id: girdi.proje_id, arsiv_mi: false },
      ...(girdi.haric_kart_id ? { id: { not: girdi.haric_kart_id } } : {}),
      ...(aramaQ
        ? { baslik: { contains: aramaQ, mode: "insensitive" } }
        : {}),
    },
    orderBy: { olusturma_zamani: "desc" },
    take: 20,
    select: {
      id: true,
      baslik: true,
      liste: { select: { ad: true } },
    },
  });
  return kartlar.map((k) => ({
    id: k.id,
    baslik: k.baslik,
    liste_ad: k.liste.ad,
  }));
}
