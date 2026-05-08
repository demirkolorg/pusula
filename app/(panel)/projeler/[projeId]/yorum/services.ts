import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { IZIN_KODLARI, izinVarMi } from "@/lib/permissions";
import {
  tetikleYorumEklendi,
  tetikleYorumMention,
} from "@/app/(panel)/bildirimler/tetikleyiciler";
import { mentionIdleriniCikar } from "@/lib/mention-format";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import type {
  YorumGuncelle,
  YorumOlustur,
} from "./schemas";

export type YorumOzeti = {
  id: string;
  kart_id: string;
  yazan_id: string;
  yazan: { ad: string; soyad: string; email: string };
  mention_kisiler: Array<{ id: string; ad: string; soyad: string }>;
  icerik: string;
  duzenlendi_mi: boolean;
  yanit_yorum_id: string | null;
  olusturma_zamani: Date;
  guncelleme_zamani: Date;
};

async function yorumMentionKisileri(
  metinler: ReadonlyArray<string>,
): Promise<Map<string, { id: string; ad: string; soyad: string }>> {
  const idler = new Set<string>();
  for (const metin of metinler) {
    for (const id of mentionIdleriniCikar(metin)) idler.add(id);
  }
  if (idler.size === 0) return new Map();
  const kisiler = await db.kullanici.findMany({
    where: { id: { in: Array.from(idler) } },
    select: { id: true, ad: true, soyad: true },
  });
  return new Map(kisiler.map((k) => [k.id.toLowerCase(), k]));
}

function yorumMentionListele(
  icerik: string,
  kisiMap: ReadonlyMap<string, { id: string; ad: string; soyad: string }>,
): Array<{ id: string; ad: string; soyad: string }> {
  const sonuc: Array<{ id: string; ad: string; soyad: string }> = [];
  const gorulen = new Set<string>();
  for (const id of mentionIdleriniCikar(icerik)) {
    if (gorulen.has(id)) continue;
    const kisi = kisiMap.get(id);
    if (!kisi) continue;
    sonuc.push(kisi);
    gorulen.add(id);
  }
  return sonuc;
}

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

async function yorumuBul(
  _birimId: string,
  yorumId: string,
): Promise<{ kart_id: string; yazan_id: string; proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const y = await db.yorum.findUnique({
    where: { id: yorumId },
    select: {
      kart_id: true,
      yazan_id: true,
      silindi_mi: true,
      kart: {
        select: {
          liste: {
            select: { proje_id: true },
          },
        },
      },
    },
  });
  if (!y || y.silindi_mi) {
    throw new EylemHatasi("Yorum bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { kart_id: y.kart_id, yazan_id: y.yazan_id, proje_id: y.kart.liste.proje_id };
}

// =====================================================================
// Listeleme + CRUD
// =====================================================================

export async function kartYorumlariniListele(
  birimId: string,
  kartId: string,
): Promise<YorumOzeti[]> {
  await kartiBulVeProjeAl(birimId, kartId);
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
  const kisiMap = await yorumMentionKisileri(yorumlar.map((y) => y.icerik));
  return yorumlar.map((y) => ({
    ...y,
    mention_kisiler: yorumMentionListele(y.icerik, kisiMap),
  }));
}

export async function yorumOlustur(
  birimId: string,
  yazanId: string,
  girdi: YorumOlustur,
): Promise<YorumOzeti> {
  await kartiBulVeProjeAl(birimId, girdi.kart_id);

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
  const kisiMap = await yorumMentionKisileri([girdi.icerik]);
  const yorum: YorumOzeti = {
    ...y,
    mention_kisiler: yorumMentionListele(y.icerik, kisiMap),
  };

  // Bildirim tetikleyicileri — fail ederse yorum yazılır, sadece bildirim
  // kaybolur (hata sessiz). Audit log her şeyi yakalar.
  Promise.all([
    tetikleYorumMention({
      yorumId: y.id,
      kartId: girdi.kart_id,
      yazanId,
      icerik: girdi.icerik,
    }),
    tetikleYorumEklendi({
      yorumId: y.id,
      kartId: girdi.kart_id,
      yazanId,
      icerik: girdi.icerik,
    }),
  ]).catch(() => {
    /* Bildirim hatası yorum işlemini bozmaz */
  });

  // Realtime — kart room'una yorum:olustur yayınla
  yayinla(SOCKET.YORUM_OLUSTUR, room.kart(girdi.kart_id), {
    kart_id: girdi.kart_id,
    yorum,
  }).catch(() => {});

  return yorum;
}

export async function yorumGuncelle(
  birimId: string,
  yazanId: string,
  girdi: YorumGuncelle,
): Promise<void> {
  const y = await yorumuBul(birimId, girdi.id);
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
  yayinla(SOCKET.YORUM_GUNCELLE, room.kart(y.kart_id), {
    kart_id: y.kart_id,
    yorum_id: girdi.id,
  }).catch(() => {});
}

// Silme: yazan kendisini siler (KART_YORUM_KENDI_SIL); başkasının yorumunu
// silmek için ayrı `KART_YORUM_BASKA_SIL` izni gerekir. Makam rolleri ('*')
// her iki kontrolü de geçer.
export async function yorumSil(
  birimId: string,
  silenId: string,
  yorumId: string,
): Promise<void> {
  const y = await yorumuBul(birimId, yorumId);
  if (y.yazan_id === silenId) {
    // Sprint 1 / S1-8 — sahip silme: önceden global izin kontrol edilmiyordu.
    const izinli = await izinVarMi(
      silenId,
      IZIN_KODLARI.KART_YORUM_KENDI_SIL,
    );
    if (!izinli) {
      throw new EylemHatasi(
        "Yorum silme yetkiniz yok.",
        HATA_KODU.YETKISIZ,
      );
    }
  } else {
    // Sprint 1 / S1-8 — başkasının yorumu için doğru granüler izin
    // (önceden hatalı olarak `PROJE_YETKILI_YONET` kullanılıyordu).
    const izinli = await izinVarMi(
      silenId,
      IZIN_KODLARI.KART_YORUM_BASKA_SIL,
    );
    if (!izinli) {
      throw new EylemHatasi(
        "Bu yorumu sadece yazan veya yetkili kullanıcı silebilir.",
        HATA_KODU.YETKISIZ,
      );
    }
  }
  await db.yorum.update({
    where: { id: yorumId },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
  yayinla(SOCKET.YORUM_SIL, room.kart(y.kart_id), {
    kart_id: y.kart_id,
    yorum_id: yorumId,
  }).catch(() => {});
}
