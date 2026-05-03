// Kart Hedef Kurum yönetimi — KartHedefKurumu join tablosu üzerinden kartlara
// kurum atama. ADR-0001: bir görev birden fazla ilçe kurumuna yönlendirilebilir.
//
// Yetkilendirme: Kart sahibi proje, kullanıcının kurumuna ait olmalı (mevcut
// projeyeErisimDogrula deseniyle). Hedef kurum aktif ve silinmemiş olmalı.

import type { KurumTipi } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";

export type KartHedefKurumOzeti = {
  kurum_id: string;
  ad: string | null;
  tip: KurumTipi;
  eklenme_zamani: Date;
};

async function kartiBulVeProjeAl(
  kurumId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: {
        select: { proje: { select: { id: true, kurum_id: true } } },
      },
    },
  });
  if (!k || k.liste.proje.kurum_id !== kurumId) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje.id };
}

async function hedefKurumDogrula(hedefKurumId: string): Promise<void> {
  const k = await db.kurum.findUnique({
    where: { id: hedefKurumId },
    select: { silindi_mi: true, aktif: true },
  });
  if (!k || k.silindi_mi || !k.aktif) {
    throw new EylemHatasi(
      "Hedef kurum geçerli değil.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
}

export async function kartHedefKurumlariniListele(
  kurumId: string,
  kartId: string,
): Promise<KartHedefKurumOzeti[]> {
  await kartiBulVeProjeAl(kurumId, kartId);
  const kayitlar = await db.kartHedefKurumu.findMany({
    where: { kart_id: kartId },
    orderBy: { eklenme_zamani: "asc" },
    select: {
      kurum_id: true,
      eklenme_zamani: true,
      kurum: { select: { ad: true, tip: true } },
    },
  });
  return kayitlar.map((k) => ({
    kurum_id: k.kurum_id,
    ad: k.kurum.ad,
    tip: k.kurum.tip,
    eklenme_zamani: k.eklenme_zamani,
  }));
}

export async function kartHedefKurumEkle(
  kurumId: string,
  kartId: string,
  hedefKurumId: string,
): Promise<void> {
  await kartiBulVeProjeAl(kurumId, kartId);
  await hedefKurumDogrula(hedefKurumId);
  // Idempotent: aynı çift varsa hata fırlatma.
  await db.kartHedefKurumu.upsert({
    where: { kart_id_kurum_id: { kart_id: kartId, kurum_id: hedefKurumId } },
    update: {},
    create: { kart_id: kartId, kurum_id: hedefKurumId },
  });
}

export async function kartHedefKurumKaldir(
  kurumId: string,
  kartId: string,
  hedefKurumId: string,
): Promise<void> {
  await kartiBulVeProjeAl(kurumId, kartId);
  // FK varsa siler; yoksa P2025 hatası — kullanıcıya 404 dön.
  try {
    await db.kartHedefKurumu.delete({
      where: { kart_id_kurum_id: { kart_id: kartId, kurum_id: hedefKurumId } },
    });
  } catch {
    throw new EylemHatasi(
      "Hedef kurum bağlantısı bulunamadı.",
      HATA_KODU.BULUNAMADI,
    );
  }
}
