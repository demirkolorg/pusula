import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import type {
  YorumGuncelle,
  YorumOlustur,
} from "./schemas";

export type YorumOzeti = {
  id: string;
  kart_id: string;
  yazan_id: string;
  yazan: { ad: string; soyad: string; email: string };
  icerik: string;
  duzenlendi_mi: boolean;
  yanit_yorum_id: string | null;
  olusturma_zamani: Date;
  guncelleme_zamani: Date;
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

async function yorumuBul(
  kurumId: string,
  yorumId: string,
): Promise<{ kart_id: string; yazan_id: string; proje_id: string }> {
  const y = await db.yorum.findUnique({
    where: { id: yorumId },
    select: {
      kart_id: true,
      yazan_id: true,
      silindi_mi: true,
      kart: {
        select: {
          liste: {
            select: { proje_id: true, proje: { select: { kurum_id: true } } },
          },
        },
      },
    },
  });
  if (!y || y.silindi_mi || y.kart.liste.proje.kurum_id !== kurumId) {
    throw new EylemHatasi("Yorum bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { kart_id: y.kart_id, yazan_id: y.yazan_id, proje_id: y.kart.liste.proje_id };
}

// =====================================================================
// Listeleme + CRUD
// =====================================================================

export async function kartYorumlariniListele(
  kurumId: string,
  kartId: string,
): Promise<YorumOzeti[]> {
  await kartiBulVeProjeAl(kurumId, kartId);
  const yorumlar = await db.yorum.findMany({
    where: { kart_id: kartId, silindi_mi: false },
    orderBy: { olusturma_zamani: "asc" },
    select: {
      id: true,
      kart_id: true,
      yazan_id: true,
      icerik: true,
      duzenlendi_mi: true,
      yanit_yorum_id: true,
      olusturma_zamani: true,
      guncelleme_zamani: true,
      yazan: { select: { ad: true, soyad: true, email: true } },
    },
  });
  return yorumlar;
}

export async function yorumOlustur(
  kurumId: string,
  yazanId: string,
  girdi: YorumOlustur,
): Promise<YorumOzeti> {
  await kartiBulVeProjeAl(kurumId, girdi.kart_id);

  // yanit_yorum aynı karta ait mi?
  if (girdi.yanit_yorum_id) {
    const yanit = await db.yorum.findUnique({
      where: { id: girdi.yanit_yorum_id },
      select: { kart_id: true, silindi_mi: true },
    });
    if (!yanit || yanit.silindi_mi || yanit.kart_id !== girdi.kart_id) {
      throw new EylemHatasi(
        "Yanıtlanan yorum bulunamadı veya başka karta ait.",
        HATA_KODU.GECERSIZ_GIRDI,
      );
    }
  }

  const y = await db.yorum.create({
    data: {
      kart_id: girdi.kart_id,
      yazan_id: yazanId,
      icerik: girdi.icerik,
      yanit_yorum_id: girdi.yanit_yorum_id ?? null,
    },
    select: {
      id: true,
      kart_id: true,
      yazan_id: true,
      icerik: true,
      duzenlendi_mi: true,
      yanit_yorum_id: true,
      olusturma_zamani: true,
      guncelleme_zamani: true,
      yazan: { select: { ad: true, soyad: true, email: true } },
    },
  });
  return y;
}

export async function yorumGuncelle(
  kurumId: string,
  yazanId: string,
  girdi: YorumGuncelle,
): Promise<void> {
  const y = await yorumuBul(kurumId, girdi.id);
  // Sadece yazan kendi yorumunu düzenler.
  if (y.yazan_id !== yazanId) {
    throw new EylemHatasi(
      "Sadece kendi yorumunuzu düzenleyebilirsiniz.",
      HATA_KODU.YETKISIZ,
    );
  }
  await db.yorum.update({
    where: { id: girdi.id },
    data: { icerik: girdi.icerik, duzenlendi_mi: true },
  });
}

// Silme: yazan veya proje ADMIN silebilir.
export async function yorumSil(
  kurumId: string,
  silenId: string,
  yorumId: string,
): Promise<void> {
  const y = await yorumuBul(kurumId, yorumId);
  if (y.yazan_id !== silenId) {
    // Silen ADMIN mi kontrol et
    const uye = await db.projeUyesi.findUnique({
      where: {
        proje_id_kullanici_id: { proje_id: y.proje_id, kullanici_id: silenId },
      },
      select: { seviye: true },
    });
    if (uye?.seviye !== "ADMIN") {
      throw new EylemHatasi(
        "Bu yorumu sadece yazan veya proje admin silebilir.",
        HATA_KODU.YETKISIZ,
      );
    }
  }
  await db.yorum.update({
    where: { id: yorumId },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
}
