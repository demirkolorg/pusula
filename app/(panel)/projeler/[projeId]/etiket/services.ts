import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import type {
  EtiketGuncelle,
  EtiketOlustur,
} from "./schemas";

export type EtiketOzeti = {
  id: string;
  proje_id: string;
  ad: string;
  renk: string;
};

// =====================================================================
// Erişim doğrulama (birim izolasyonu — yetki kontrolü actions katmanında)
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

async function etiketiBulVeProjeAl(
  _birimId: string,
  etiketId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const e = await db.etiket.findUnique({
    where: { id: etiketId },
    select: { proje_id: true },
  });
  if (!e) {
    throw new EylemHatasi("Etiket bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: e.proje_id };
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
// Etiket CRUD
// =====================================================================

export async function etiketleriListele(
  birimId: string,
  projeId: string,
): Promise<EtiketOzeti[]> {
  await projeyeErisimDogrula(birimId, projeId);
  return db.etiket.findMany({
    where: { proje_id: projeId },
    orderBy: { olusturma_zamani: "asc" },
    select: { id: true, proje_id: true, ad: true, renk: true },
  });
}

export async function etiketOlustur(
  birimId: string,
  girdi: EtiketOlustur,
): Promise<EtiketOzeti> {
  await projeyeErisimDogrula(birimId, girdi.proje_id);
  try {
    return await db.etiket.create({
      data: {
        proje_id: girdi.proje_id,
        ad: girdi.ad,
        renk: girdi.renk,
      },
      select: { id: true, proje_id: true, ad: true, renk: true },
    });
  } catch (err) {
    // @@unique([proje_id, ad]) — aynı projede aynı adlı etiket yasak
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new EylemHatasi(
        "Bu projede aynı adda bir etiket zaten var.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
    throw err;
  }
}

export async function etiketGuncelle(
  birimId: string,
  girdi: EtiketGuncelle,
): Promise<void> {
  await etiketiBulVeProjeAl(birimId, girdi.id);
  const veri: Record<string, unknown> = {};
  if (girdi.ad !== undefined) veri.ad = girdi.ad;
  if (girdi.renk !== undefined) veri.renk = girdi.renk;
  if (Object.keys(veri).length === 0) return;
  try {
    await db.etiket.update({ where: { id: girdi.id }, data: veri });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new EylemHatasi(
        "Bu projede aynı adda bir etiket zaten var.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
    throw err;
  }
}

export async function etiketSil(birimId: string, id: string): Promise<void> {
  await etiketiBulVeProjeAl(birimId, id);
  // KartEtiket join onDelete: Cascade ile birlikte gider — hard delete.
  // Soft delete burada gereksiz; tekrar olusturulabilen domain.
  await db.etiket.delete({ where: { id } });
}

// =====================================================================
// Karta etiket ata / kaldır
// =====================================================================

export async function kartaEtiketEkle(
  birimId: string,
  kartId: string,
  etiketId: string,
): Promise<void> {
  const { proje_id: kartProje } = await kartiBulVeProjeAl(birimId, kartId);
  const { proje_id: etiketProje } = await etiketiBulVeProjeAl(birimId, etiketId);
  if (kartProje !== etiketProje) {
    throw new EylemHatasi(
      "Etiket başka bir projeye ait.",
      HATA_KODU.YETKISIZ,
    );
  }
  // Idempotent — zaten varsa sessizce yoksay
  await db.kartEtiket.upsert({
    where: { kart_id_etiket_id: { kart_id: kartId, etiket_id: etiketId } },
    create: { kart_id: kartId, etiket_id: etiketId },
    update: {},
  });
  yayinla(SOCKET.ETIKET_KART_EKLE, room.kart(kartId), {
    kart_id: kartId,
    etiket_id: etiketId,
  }).catch(() => {});
}

export async function kartaEtiketKaldir(
  birimId: string,
  kartId: string,
  etiketId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  await db.kartEtiket
    .delete({
      where: { kart_id_etiket_id: { kart_id: kartId, etiket_id: etiketId } },
    })
    .catch(() => {
      // Zaten yoksa sessiz; idempotent çıkış
    });
  yayinla(SOCKET.ETIKET_KART_KALDIR, room.kart(kartId), {
    kart_id: kartId,
    etiket_id: etiketId,
  }).catch(() => {});
}

// Karttaki etiket id'lerini getir (UI'da seçili durumu göstermek için)
export async function kartinEtiketleri(
  birimId: string,
  kartId: string,
): Promise<string[]> {
  await kartiBulVeProjeAl(birimId, kartId);
  const baglar = await db.kartEtiket.findMany({
    where: { kart_id: kartId },
    select: { etiket_id: true },
  });
  return baglar.map((b) => b.etiket_id);
}
