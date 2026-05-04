// Kart Birim yönetimi — KartBirimi join tablosu üzerinden kartlara
// birim atama. ADR-0001: bir görev birden fazla ilçe birimina yönlendirilebilir.
//
// Yetkilendirme: Kart sahibi proje, kullanıcının birimina ait olmalı (mevcut
// projeyeErisimDogrula deseniyle). Hedef birim aktif ve silinmemiş olmalı.

import type { BirimTipi } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";

export type KartBirimOzeti = {
  birim_id: string;
  ad: string | null;
  tip: BirimTipi;
  eklenme_zamani: Date;
};

async function kartiBulVeProjeAl(
  _birimId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: {
        select: { proje: { select: { id: true } } },
      },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje.id };
}

async function hedefBirimDogrula(hedefBirimId: string): Promise<void> {
  const k = await db.birim.findUnique({
    where: { id: hedefBirimId },
    select: { silindi_mi: true, aktif: true },
  });
  if (!k || k.silindi_mi || !k.aktif) {
    throw new EylemHatasi(
      "Hedef birim geçerli değil.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
}

export async function kartBirimleriniListele(
  birimId: string,
  kartId: string,
): Promise<KartBirimOzeti[]> {
  await kartiBulVeProjeAl(birimId, kartId);
  const kayitlar = await db.kartBirimi.findMany({
    where: { kart_id: kartId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      birim_id: true,
      eklenme_zamani: true,
      birim: { select: { ad: true, tip: true } },
    },
  });
  return kayitlar.map((k) => ({
    birim_id: k.birim_id,
    ad: k.birim.ad,
    tip: k.birim.tip,
    eklenme_zamani: k.eklenme_zamani,
  }));
}

export async function kartBirimEkle(
  birimId: string,
  kartId: string,
  hedefBirimId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  await hedefBirimDogrula(hedefBirimId);
  // Idempotent: aynı çift varsa hata fırlatma.
  await db.kartBirimi.upsert({
    where: { kart_id_birim_id: { kart_id: kartId, birim_id: hedefBirimId } },
    update: {},
    create: { kart_id: kartId, birim_id: hedefBirimId },
  });
}

export async function kartBirimKaldir(
  birimId: string,
  kartId: string,
  hedefBirimId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  // FK varsa siler; yoksa P2025 hatası — kullanıcıya 404 dön.
  try {
    await db.kartBirimi.delete({
      where: { kart_id_birim_id: { kart_id: kartId, birim_id: hedefBirimId } },
    });
  } catch {
    throw new EylemHatasi(
      "Hedef birim bağlantısı bulunamadı.",
      HATA_KODU.BULUNAMADI,
    );
  }
}
