// Sprint 3 / S3-2 — Proje detay servisi parça dosyası: liste (kolon) işlemleri.
// ADR-0032 mega dosya bölmesi.
//
// İçerik:
//   - arsivListesiniSagla     — ADR-0009 sistem ARSIV listesi
//   - sistemListesiKoru       — ARSIV listesi rename/sil/sıra reddi
//   - listeOlustur / Guncelle / Sil
//   - projeListeleriniRebalance + listeyeSiraVer (LexoRank)

import { ListeTipi } from "@prisma/client";
import { db } from "@/lib/db";
import { siraArasi, siraSonuna } from "@/lib/sira";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import type {
  ListeGuncelle,
  ListeOlustur,
  ListeSira,
} from "./schemas";
import {
  ARSIV_LISTESI_AD,
  ARSIV_LISTESI_SIRA,
  type ListeOzeti,
  kaynakErisimi,
  projeyeErisimDogrula,
  listeyiBulVeProjeAl,
} from "./services-ortak";

// =====================================================================
// Sistem ARSIV listesi sağla
// =====================================================================

export async function arsivListesiniSagla(projeId: string): Promise<string> {
  const mevcut = await db.liste.findFirst({
    where: { proje_id: projeId, tip: ListeTipi.ARSIV },
    select: { id: true },
  });
  if (mevcut) return mevcut.id;
  const yeni = await db.liste.create({
    data: {
      proje_id: projeId,
      ad: ARSIV_LISTESI_AD,
      sira: ARSIV_LISTESI_SIRA,
      tip: ListeTipi.ARSIV,
    },
    select: { id: true },
  });
  return yeni.id;
}

// ADR-0009 — sistem ARSIV listesinde rename/sil/sıra değişikliği reddedilir.
export async function sistemListesiKoru(listeId: string): Promise<void> {
  const l = await db.liste.findUnique({
    where: { id: listeId },
    select: { tip: true },
  });
  if (l?.tip === ListeTipi.ARSIV) {
    throw new EylemHatasi(
      "Arşiv listesi sistem listesidir, değiştirilemez veya silinemez.",
      HATA_KODU.YETKISIZ,
    );
  }
}

// =====================================================================
// Liste CRUD
// =====================================================================

export async function listeOlustur(
  kullaniciId: string,
  girdi: ListeOlustur,
): Promise<ListeOzeti> {
  await projeyeErisimDogrula(kullaniciId, girdi.proje_id);
  const erisim = await kaynakErisimi(kullaniciId);

  // ADR-0009 — Yeni NORMAL liste Arşiv'in (sira="ZZZZ") ÖNCESİNE eklenir.
  // findFirst + tip=NORMAL ile son normal listenin sıraısını alıp ardı.
  const son = await db.liste.findFirst({
    where: { proje_id: girdi.proje_id, tip: ListeTipi.NORMAL },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);

  const yeni = await db.liste.create({
    data: {
      proje_id: girdi.proje_id,
      ad: girdi.ad.trim(),
      sira,
      tip: ListeTipi.NORMAL,
      yetkililer: { create: { kullanici_id: kullaniciId } },
      birimler: erisim.birimId
        ? { create: { birim_id: erisim.birimId } }
        : undefined,
    },
    select: {
      id: true,
      proje_id: true,
      ad: true,
      sira: true,
      tip: true,
      arsiv_mi: true,
      wip_limit: true,
    },
  });

  yayinla(SOCKET.LISTE_OLUSTUR, room.proje(girdi.proje_id), {
    proje_id: girdi.proje_id,
    liste: yeni,
  }).catch(() => {});
  return { ...yeni, kartlar: [] };
}

export async function listeGuncelle(
  birimId: string,
  girdi: ListeGuncelle,
): Promise<void> {
  const { proje_id } = await listeyiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);
  await sistemListesiKoru(girdi.id);

  const veri: Record<string, unknown> = {};
  if (girdi.ad !== undefined) veri.ad = girdi.ad.trim();
  if (girdi.arsiv_mi !== undefined) veri.arsiv_mi = girdi.arsiv_mi;
  if (girdi.wip_limit !== undefined) veri.wip_limit = girdi.wip_limit;
  await db.liste.update({ where: { id: girdi.id }, data: veri });
  yayinla(SOCKET.LISTE_GUNCELLE, room.proje(proje_id), {
    proje_id,
    liste_id: girdi.id,
  }).catch(() => {});
}

export async function listeSil(birimId: string, id: string): Promise<void> {
  const { proje_id } = await listeyiBulVeProjeAl(birimId, id);
  await projeyeErisimDogrula(birimId, proje_id);
  await sistemListesiKoru(id);
  // Liste tamamen kaldırılır (kartlar onDelete: Cascade ile birlikte gider).
  // Çöp kutusu liste düzeyinde MVP dışında, ileride eklenebilir.
  await db.liste.delete({ where: { id } });
  yayinla(SOCKET.LISTE_SIL, room.proje(proje_id), {
    proje_id,
    liste_id: id,
  }).catch(() => {});
}

// =====================================================================
// LexoRank rebalance + sıralama
// =====================================================================

async function projeListeleriniRebalance(projeId: string): Promise<void> {
  const listeler = await db.liste.findMany({
    where: { proje_id: projeId },
    orderBy: { sira: "asc" },
    select: { id: true },
  });
  if (listeler.length === 0) return;

  const yeniSiralar: string[] = [];
  let son: string | null = null;
  for (let i = 0; i < listeler.length; i++) {
    const yeni = siraSonuna(son);
    yeniSiralar.push(yeni);
    son = yeni;
  }

  await db.$transaction(
    listeler.map((l, i) =>
      db.liste.update({ where: { id: l.id }, data: { sira: yeniSiralar[i] } }),
    ),
  );
}

export async function listeyeSiraVer(
  birimId: string,
  girdi: ListeSira,
): Promise<{ sira: string }> {
  await projeyeErisimDogrula(birimId, girdi.proje_id);
  // ADR-0009 — sistem ARSIV listesi sürüklenemez.
  await sistemListesiKoru(girdi.id);

  async function komsulariOku() {
    const [onceki, sonraki] = await Promise.all([
      girdi.onceki_id
        ? db.liste.findUnique({
            where: { id: girdi.onceki_id },
            select: { sira: true, proje_id: true, tip: true },
          })
        : null,
      girdi.sonraki_id
        ? db.liste.findUnique({
            where: { id: girdi.sonraki_id },
            select: { sira: true, proje_id: true, tip: true },
          })
        : null,
    ]);
    if (onceki && onceki.proje_id !== girdi.proje_id) {
      throw new EylemHatasi(
        "Önceki liste farklı projeden.",
        HATA_KODU.YETKISIZ,
      );
    }
    if (sonraki && sonraki.proje_id !== girdi.proje_id) {
      throw new EylemHatasi(
        "Sonraki liste farklı projeden.",
        HATA_KODU.YETKISIZ,
      );
    }
    // ADR-0009 — Arşiv listesinin sağına başka liste atılamaz.
    // (Arşiv `onceki` olarak verilmesi yasaktır; `sonraki` her zaman Arşiv olabilir.)
    if (onceki?.tip === ListeTipi.ARSIV) {
      throw new EylemHatasi(
        "Arşiv listesi her zaman en sağdadır; sağına liste konulamaz.",
        HATA_KODU.YETKISIZ,
      );
    }
    return { onceki, sonraki };
  }

  let { onceki, sonraki } = await komsulariOku();

  let yeniSira: string;
  try {
    yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
  } catch (err) {
    if (err instanceof Error && err.message.includes("alfabe tabanı")) {
      await projeListeleriniRebalance(girdi.proje_id);
      const yeni = await komsulariOku();
      onceki = yeni.onceki;
      sonraki = yeni.sonraki;
      yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
    } else {
      throw err;
    }
  }

  await db.liste.update({ where: { id: girdi.id }, data: { sira: yeniSira } });
  yayinla(SOCKET.LISTE_SIRALA, room.proje(girdi.proje_id), {
    proje_id: girdi.proje_id,
    liste_id: girdi.id,
    sira: yeniSira,
  }).catch(() => {});
  return { sira: yeniSira };
}
