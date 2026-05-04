import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import {
  boyutIzinliMi,
  eklentiYoluUret,
  mimeIzinliMi,
  objeyiSil,
  presignedDownload,
  presignedUpload,
} from "@/lib/storage";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import type { YuklemeBaslat, YuklemeOnayla } from "./schemas";

export type EklentiOzeti = {
  id: string;
  kart_id: string;
  yukleyen_id: string;
  yukleyen: { ad: string; soyad: string };
  ad: string;
  mime: string;
  boyut: number;
  depolama_yolu: string;
  olusturma_zamani: Date;
};

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
      liste: { select: { proje_id: true } },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id };
}

async function eklentiyiBul(
  _birimId: string,
  eklentiId: string,
): Promise<{ kart_id: string; depolama_yolu: string; yukleyen_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const e = await db.eklenti.findUnique({
    where: { id: eklentiId },
    select: {
      kart_id: true,
      depolama_yolu: true,
      yukleyen_id: true,
      silindi_mi: true,
    },
  });
  if (!e || e.silindi_mi) {
    throw new EylemHatasi("Eklenti bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return {
    kart_id: e.kart_id,
    depolama_yolu: e.depolama_yolu,
    yukleyen_id: e.yukleyen_id,
  };
}

// =====================================================================
// Listeleme
// =====================================================================

export async function kartEklentileriniListele(
  birimId: string,
  kartId: string,
): Promise<EklentiOzeti[]> {
  await kartiBulVeProjeAl(birimId, kartId);
  return db.eklenti.findMany({
    where: { kart_id: kartId, silindi_mi: false },
    orderBy: { olusturma_zamani: "desc" },
    select: {
      id: true,
      kart_id: true,
      yukleyen_id: true,
      ad: true,
      mime: true,
      boyut: true,
      depolama_yolu: true,
      olusturma_zamani: true,
      yukleyen: { select: { ad: true, soyad: true } },
    },
  });
}

// =====================================================================
// 2-aşamalı upload (presigned PUT)
// =====================================================================

export async function yuklemeBaslat(
  birimId: string,
  girdi: YuklemeBaslat,
): Promise<{ depolama_yolu: string; upload_url: string }> {
  await kartiBulVeProjeAl(birimId, girdi.kart_id);

  // Kural 72: mime + boyut whitelist
  if (!mimeIzinliMi(girdi.mime)) {
    throw new EylemHatasi(
      `'${girdi.mime}' tipi desteklenmiyor.`,
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  if (!boyutIzinliMi(girdi.boyut)) {
    throw new EylemHatasi(
      "Dosya boyutu sınırı aşıldı (25 MB).",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }

  const depolama_yolu = eklentiYoluUret(girdi.kart_id, girdi.ad, nanoid(16));
  const upload_url = await presignedUpload(depolama_yolu, girdi.mime);
  return { depolama_yolu, upload_url };
}

export async function yuklemeOnayla(
  birimId: string,
  yukleyenId: string,
  girdi: YuklemeOnayla,
): Promise<EklentiOzeti> {
  await kartiBulVeProjeAl(birimId, girdi.kart_id);

  // Yol bizim ürettiğimiz prefix ile başlamalı (kullanıcı manipüle etmesin)
  if (!girdi.depolama_yolu.startsWith(`kartlar/${girdi.kart_id}/`)) {
    throw new EylemHatasi(
      "Geçersiz depolama yolu.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }
  if (!mimeIzinliMi(girdi.mime) || !boyutIzinliMi(girdi.boyut)) {
    throw new EylemHatasi(
      "Mime veya boyut sınırı aşıldı.",
      HATA_KODU.GECERSIZ_GIRDI,
    );
  }

  const yeni = await db.eklenti.create({
    data: {
      kart_id: girdi.kart_id,
      yukleyen_id: yukleyenId,
      ad: girdi.ad,
      mime: girdi.mime,
      boyut: girdi.boyut,
      depolama_yolu: girdi.depolama_yolu,
    },
    select: {
      id: true,
      kart_id: true,
      yukleyen_id: true,
      ad: true,
      mime: true,
      boyut: true,
      depolama_yolu: true,
      olusturma_zamani: true,
      yukleyen: { select: { ad: true, soyad: true } },
    },
  });
  yayinla(SOCKET.EKLENTI_OLUSTUR, room.kart(girdi.kart_id), {
    kart_id: girdi.kart_id,
    eklenti_id: yeni.id,
  }).catch(() => {});
  return yeni;
}

// =====================================================================
// İndirme — presigned GET URL üret
// =====================================================================

export async function eklentiIndirURL(
  birimId: string,
  eklentiId: string,
): Promise<{ url: string }> {
  const e = await eklentiyiBul(birimId, eklentiId);
  const url = await presignedDownload(e.depolama_yolu);
  return { url };
}

// =====================================================================
// Silme — soft delete + storage'dan kaldır
// =====================================================================

export async function eklentiSil(
  birimId: string,
  silenId: string,
  eklentiId: string,
): Promise<void> {
  const e = await eklentiyiBul(birimId, eklentiId);

  // Yetki: yükleyen kendisi VEYA proje ADMIN silebilir
  if (e.yukleyen_id !== silenId) {
    const proje = await db.kart.findUnique({
      where: { id: e.kart_id },
      select: { liste: { select: { proje_id: true } } },
    });
    if (proje) {
      const uye = await db.projeUyesi.findUnique({
        where: {
          proje_id_kullanici_id: {
            proje_id: proje.liste.proje_id,
            kullanici_id: silenId,
          },
        },
        select: { seviye: true },
      });
      if (uye?.seviye !== "ADMIN") {
        throw new EylemHatasi(
          "Bu eklentiyi sadece yükleyen veya proje admin silebilir.",
          HATA_KODU.YETKISIZ,
        );
      }
    }
  }

  // Önce DB soft-delete (audit log için), sonra storage'dan da sil.
  // Storage hatası yutulur — kayıt zaten silinmiş, periodik temizlik daha sonra.
  await db.eklenti.update({
    where: { id: eklentiId },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
  yayinla(SOCKET.EKLENTI_SIL, room.kart(e.kart_id), {
    kart_id: e.kart_id,
    eklenti_id: eklentiId,
  }).catch(() => {});
  try {
    await objeyiSil(e.depolama_yolu);
  } catch {
    // MinIO erişilemese bile DB doğrudur; orphan obje olur.
    // Production'da periodic GC ile temizlenir.
  }
}
