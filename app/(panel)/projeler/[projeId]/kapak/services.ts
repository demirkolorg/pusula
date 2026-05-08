import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import { tokenMi, type KapakRenk } from "@/lib/kapak-renk";

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

  // Sprint 2 / S2-14 — ADR-0028 F8/F9: Eklenti tablosu yerine Dosya modeli.
  // Param adı (eklentiId) backward compat; aslında dosya id'si bekliyor.
  // Kart bağlantısı DosyaBaglantisi üzerinden doğrulanır.
  const d = await db.dosya.findUnique({
    where: { id: eklentiId },
    select: {
      mime: true,
      silindi_mi: true,
      baglantilar: {
        select: { kaynak_tip: true, kaynak_id: true, kart_id: true },
      },
    },
  });
  if (!d || d.silindi_mi) {
    throw new EylemHatasi("Dosya bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  const karttaMi = d.baglantilar.some(
    (b) => b.kart_id === kartId || (b.kaynak_tip === "KART" && b.kaynak_id === kartId),
  );
  if (!karttaMi) {
    throw new EylemHatasi(
      "Dosya bu karta bağlı değil.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  if (!d.mime.startsWith("image/")) {
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

// =====================================================================
// Kapak rengini ayarla — KapakRenk token'larından biri (lib/kapak-renk.ts)
// Renk konunca görsel kapak null'lanır — tek kapak gösterilir.
// =====================================================================

export async function kapakRenginiAyarla(
  birimId: string,
  kartId: string,
  renk: KapakRenk,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);

  // Defansif: schema'da z.enum doğruluyor ama service public — direkt çağrı
  // ihtimalini düşürelim (Kural #2 phantom-mindset).
  if (!tokenMi(renk)) {
    throw new EylemHatasi(
      "Geçersiz kapak rengi.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }

  await db.kart.update({
    where: { id: kartId },
    data: { kapak_renk: renk, kapak_dosya_id: null },
  });
  yayinla(SOCKET.KAPAK_RENGI_AYARLA, room.kart(kartId), {
    kart_id: kartId,
    renk,
  }).catch(() => {});
}

// =====================================================================
// Kapak rengini kaldır — kapak_renk null'lanır (görsel kapak dokunulmaz)
// =====================================================================

export async function kapakRenginiKaldir(
  birimId: string,
  kartId: string,
): Promise<void> {
  await kartiBulVeProjeAl(birimId, kartId);
  await db.kart.update({
    where: { id: kartId },
    data: { kapak_renk: null },
  });
  yayinla(SOCKET.KAPAK_RENGI_KALDIR, room.kart(kartId), {
    kart_id: kartId,
  }).catch(() => {});
}
