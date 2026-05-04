import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";

// =====================================================================
// Erişim doğrulama
// =====================================================================

async function kartiBulVeProjeAl(
  _birimId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: {
        select: { proje_id: true },
      },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id };
}

// =====================================================================
// Kapağı ayarla — bir Eklenti'yi kart kapağı yap
// =====================================================================

export async function kapagiAyarla(
  birimId: string,
  kartId: string,
  eklentiId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);

  // Eklenti aynı karta ait, silinmemiş ve görsel olmalı
  const e = await db.eklenti.findUnique({
    where: { id: eklentiId },
    select: { kart_id: true, mime: true, silindi_mi: true },
  });
  if (!e || e.silindi_mi) {
    throw new EylemHatasi("Eklenti bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (e.kart_id !== kartId) {
    throw new EylemHatasi(
      "Eklenti başka bir karta ait.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  if (!e.mime.startsWith("image/")) {
    throw new EylemHatasi(
      "Sadece görseller kart kapağı olabilir.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }

  // Görsel kapak konulunca renk kapağı null'lanır (tek kapak gösterilir).
  await db.kart.update({
    where: { id: kartId },
    data: { kapak_dosya_id: eklentiId, kapak_renk: null },
  });
  yayinla(SOCKET.KAPAK_AYARLA, room.kart(kartId), {
    kart_id: kartId,
    eklenti_id: eklentiId,
  }).catch(() => {});
}

// =====================================================================
// Kapağı kaldır — kart_id null'lanır (renk kapağı dokunulmaz)
// =====================================================================

export async function kapagiKaldir(
  birimId: string,
  kartId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  await db.kart.update({
    where: { id: kartId },
    data: { kapak_dosya_id: null },
  });
  yayinla(SOCKET.KAPAK_KALDIR, room.kart(kartId), { kart_id: kartId }).catch(
    () => {},
  );
}
