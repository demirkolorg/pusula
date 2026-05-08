// ADR-0028 / Sprint 3 S3-3 — Upload akışı (yükleme + sürüm yükleme).
// Plan Bölüm 10.

import { nanoid } from "nanoid";
import { DosyaDurumu } from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { dosyaKategorisi, dosyaUzantisi } from "@/lib/dosya-kategori";
import {
  uploadGirdisiniDogrula,
  kategoriBoyutLimiti,
  magicByteEsleseMi,
} from "@/lib/dosya-guvenlik";
import {
  DOSYA_BUCKET,
  dosyaObjesiBoyutuAl,
  dosyaObjesininIlkBaytlari,
  dosyaObjesiniSil,
  dosyaYoluUret,
  presignedDosyaUpload,
} from "@/lib/dosya-storage";
import { yetkiZorunluDosya } from "@/lib/dosya-yetki";
import type {
  DosyaYuklemeBaslatGirdi,
  DosyaYuklemeOnaylaGirdi,
  DosyaSurumYuklemeBaslatGirdi,
  DosyaSurumYuklemeOnaylaGirdi,
} from "./schemas";
import {
  UPLOAD_OTURUMU_TTL_DK,
  hata,
  kaynagaErisimZorunlu,
} from "./services-ortak";

export interface YuklemeBaslatSonuc {
  oturum_id: string;
  upload_url: string;
  depolama_yolu: string;
  son_kullanma: Date;
}

export async function yuklemeBaslat(
  kullaniciId: string,
  girdi: DosyaYuklemeBaslatGirdi,
): Promise<YuklemeBaslatSonuc> {
  const dogrulama = uploadGirdisiniDogrula(girdi);
  if (!dogrulama.gecerli) {
    throw new EylemHatasi(dogrulama.sebep, HATA_KODU.GECERSIZ_GIRDI);
  }
  await kaynagaErisimZorunlu(kullaniciId, girdi.kaynak_tip, girdi.kaynak_id, true);

  // Yer tutucu dosyaId — gerçek dosya onayda yaratılır.
  const dosyaIdOn = nanoid(16);
  const yol = dosyaYoluUret(dosyaIdOn, 1, girdi.ad, nanoid(12));
  const son_kullanma = new Date(Date.now() + UPLOAD_OTURUMU_TTL_DK * 60_000);

  const oturum = await db.dosyaYuklemeOturumu.create({
    data: {
      kullanici_id: kullaniciId,
      kaynak_tip: girdi.kaynak_tip,
      kaynak_id: girdi.kaynak_id,
      ad: girdi.ad,
      mime: girdi.mime,
      boyut: girdi.boyut,
      depolama_yolu: yol,
      son_kullanma,
    },
    select: { id: true },
  });

  const upload_url = await presignedDosyaUpload(yol, girdi.mime);
  return {
    oturum_id: oturum.id,
    upload_url,
    depolama_yolu: yol,
    son_kullanma,
  };
}

export async function yuklemeOnayla(
  kullaniciId: string,
  girdi: DosyaYuklemeOnaylaGirdi,
): Promise<{ id: string }> {
  const oturum = await db.dosyaYuklemeOturumu.findUnique({
    where: { id: girdi.oturum_id },
  });
  if (!oturum) hata("Yükleme oturumu bulunamadı.", "BULUNAMADI");
  if (oturum.kullanici_id !== kullaniciId) {
    hata("Bu oturuma erişim yetkiniz yok.", "YETKISIZ");
  }
  if (oturum.son_kullanma < new Date()) {
    hata("Yükleme oturumunun süresi dolmuş.", "GECERSIZ_GIRDI");
  }
  if (oturum.durum !== DosyaDurumu.YUKLENIYOR) {
    hata("Oturum zaten tamamlanmış.", "GECERSIZ_GIRDI");
  }

  // Storage'da gerçekten upload edildi mi? (Stat ile boyut doğrulaması)
  let gercekBoyut: number;
  try {
    gercekBoyut = await dosyaObjesiBoyutuAl(oturum.depolama_yolu);
  } catch {
    hata("Dosya storage'da bulunamadı.", "BULUNAMADI");
  }
  if (gercekBoyut !== oturum.boyut) {
    hata(
      `Storage boyutu (${gercekBoyut}) bildirilen boyutla (${oturum.boyut}) uyuşmuyor.`,
      "GECERSIZ_GIRDI",
    );
  }

  const kategori = dosyaKategorisi(oturum.mime, oturum.ad);
  if (gercekBoyut > kategoriBoyutLimiti(kategori)) {
    hata(`${kategori} kategorisi boyut sınırını aşıyor.`, "GECERSIZ_GIRDI");
  }

  // Sprint 1 / S1-4 — magic-byte doğrulaması: storage'a yüklenen gerçek
  // içeriğin başı, kullanıcının bildirdiği MIME imzasıyla eşleşmeli.
  // Eşleşme `null` dönerse (text/csv/markdown gibi imzasız format) atlanır.
  const ilkBaytlar = await dosyaObjesininIlkBaytlari(
    oturum.depolama_yolu,
    Math.min(gercekBoyut, 4096),
  );
  const imzaEslesti = magicByteEsleseMi(ilkBaytlar, oturum.mime);
  if (imzaEslesti === false) {
    // Sahte içerik; bucket'tan da temizle ki orphan kalmasın.
    try {
      await dosyaObjesiniSil(oturum.depolama_yolu);
    } catch {
      /* cleanup başarısız olursa cron'a düşer */
    }
    await db.dosyaYuklemeOturumu.update({
      where: { id: oturum.id },
      data: { durum: DosyaDurumu.HATALI },
    });
    hata(
      "Dosya içeriği bildirilen MIME tipiyle uyuşmuyor.",
      "GECERSIZ_GIRDI",
    );
  }

  const baglantiKaynaklari = await kaynagaErisimZorunlu(
    kullaniciId,
    oturum.kaynak_tip,
    oturum.kaynak_id,
    true,
  );

  const sonuc = await db.$transaction(async (tx) => {
    const dosya = await tx.dosya.create({
      data: {
        yukleyen_id: kullaniciId,
        ad: oturum.ad,
        mime: oturum.mime,
        uzanti: dosyaUzantisi(oturum.ad),
        kategori,
        boyut: gercekBoyut,
        hash_sha256: girdi.hash_sha256 ?? null,
        bucket: DOSYA_BUCKET,
        depolama_yolu: oturum.depolama_yolu,
        durum: DosyaDurumu.HAZIR,
      },
      select: { id: true },
    });
    await tx.dosyaSurumu.create({
      data: {
        dosya_id: dosya.id,
        surum_no: 1,
        yukleyen_id: kullaniciId,
        ad: oturum.ad,
        mime: oturum.mime,
        boyut: gercekBoyut,
        hash_sha256: girdi.hash_sha256 ?? null,
        bucket: DOSYA_BUCKET,
        depolama_yolu: oturum.depolama_yolu,
      },
    });
    await tx.dosyaBaglantisi.create({
      data: {
        dosya_id: dosya.id,
        kaynak_tip: oturum.kaynak_tip,
        kaynak_id: oturum.kaynak_id,
        proje_id: baglantiKaynaklari.proje_id,
        liste_id: baglantiKaynaklari.liste_id,
        kart_id: baglantiKaynaklari.kart_id,
        ekleyen_id: kullaniciId,
        birincil_mi: true,
      },
    });
    await tx.dosyaYuklemeOturumu.update({
      where: { id: oturum.id },
      data: { durum: DosyaDurumu.HAZIR },
    });
    return dosya;
  });

  return { id: sonuc.id };
}

// =====================================================================
// Sürüm yükleme (mevcut Dosya'ya yeni sürüm)
// =====================================================================

export async function surumYuklemeBaslat(
  kullaniciId: string,
  girdi: DosyaSurumYuklemeBaslatGirdi,
): Promise<YuklemeBaslatSonuc> {
  await yetkiZorunluDosya(kullaniciId, "dosya:version-add", girdi.dosya_id);
  const dogrulama = uploadGirdisiniDogrula({
    ad: girdi.ad,
    mime: girdi.mime,
    boyut: girdi.boyut,
  });
  if (!dogrulama.gecerli) {
    throw new EylemHatasi(dogrulama.sebep, HATA_KODU.GECERSIZ_GIRDI);
  }
  const surumler = await db.dosyaSurumu.findMany({
    where: { dosya_id: girdi.dosya_id },
    orderBy: { surum_no: "desc" },
    take: 1,
    select: { surum_no: true },
  });
  const yeniSurumNo = (surumler[0]?.surum_no ?? 0) + 1;
  const yol = dosyaYoluUret(girdi.dosya_id, yeniSurumNo, girdi.ad, nanoid(12));
  const son_kullanma = new Date(Date.now() + UPLOAD_OTURUMU_TTL_DK * 60_000);
  // Surum yükleme oturumu için kaynak_tip null'lanamaz; convention olarak
  // KART tip + dosya_id kullan (ama gerçek kaynak girişten gelmiyor → hatalı).
  // Bu yüzden surum oturumunu doğrudan inline takip edeceğiz; mevcut tablo
  // kaynak alanlarını dosyanın birincil bağlantısından çek.
  const birincil = await db.dosyaBaglantisi.findFirst({
    where: { dosya_id: girdi.dosya_id, birincil_mi: true },
    select: { kaynak_tip: true, kaynak_id: true },
  });
  if (!birincil) hata("Dosyanın birincil bağlantısı yok.", "BULUNAMADI");

  const oturum = await db.dosyaYuklemeOturumu.create({
    data: {
      kullanici_id: kullaniciId,
      kaynak_tip: birincil.kaynak_tip,
      kaynak_id: birincil.kaynak_id,
      ad: girdi.ad,
      mime: girdi.mime,
      boyut: girdi.boyut,
      depolama_yolu: yol,
      son_kullanma,
      hata: `surum:${girdi.dosya_id}:${yeniSurumNo}`, // hata alanını surum işaretçisi olarak kullan
    },
    select: { id: true },
  });
  const upload_url = await presignedDosyaUpload(yol, girdi.mime);
  return { oturum_id: oturum.id, upload_url, depolama_yolu: yol, son_kullanma };
}

export async function surumYuklemeOnayla(
  kullaniciId: string,
  girdi: DosyaSurumYuklemeOnaylaGirdi,
): Promise<{ surum_id: string }> {
  const oturum = await db.dosyaYuklemeOturumu.findUnique({
    where: { id: girdi.oturum_id },
  });
  if (!oturum) hata("Oturum bulunamadı.", "BULUNAMADI");
  if (oturum.kullanici_id !== kullaniciId) hata("Yetkisiz.", "YETKISIZ");
  if (!oturum.hata?.startsWith("surum:")) hata("Sürüm oturumu değil.", "GECERSIZ_GIRDI");
  const parcalar = oturum.hata.split(":");
  const dosyaId = parcalar[1];
  const surumNoStr = parcalar[2];
  if (!dosyaId || !surumNoStr) hata("Sürüm oturumu bozuk.", "GECERSIZ_GIRDI");
  const surumNo = Number(surumNoStr);
  if (!Number.isFinite(surumNo)) hata("Sürüm numarası geçersiz.", "GECERSIZ_GIRDI");
  await yetkiZorunluDosya(kullaniciId, "dosya:version-add", dosyaId);

  let gercekBoyut: number;
  try {
    gercekBoyut = await dosyaObjesiBoyutuAl(oturum.depolama_yolu);
  } catch {
    hata("Dosya storage'da bulunamadı.", "BULUNAMADI");
  }
  if (gercekBoyut !== oturum.boyut) {
    hata("Boyut uyuşmazlığı.", "GECERSIZ_GIRDI");
  }

  const surum = await db.$transaction(async (tx) => {
    const yeni = await tx.dosyaSurumu.create({
      data: {
        dosya_id: dosyaId,
        surum_no: surumNo,
        yukleyen_id: kullaniciId,
        ad: oturum.ad,
        mime: oturum.mime,
        boyut: gercekBoyut,
        bucket: DOSYA_BUCKET,
        depolama_yolu: oturum.depolama_yolu,
        aciklama: girdi.aciklama ?? null,
      },
      select: { id: true },
    });
    await tx.dosya.update({
      where: { id: dosyaId },
      data: {
        aktif_surum_id: yeni.id,
        ad: oturum.ad,
        mime: oturum.mime,
        uzanti: dosyaUzantisi(oturum.ad),
        boyut: gercekBoyut,
        depolama_yolu: oturum.depolama_yolu,
      },
    });
    await tx.dosyaYuklemeOturumu.update({
      where: { id: oturum.id },
      data: { durum: DosyaDurumu.HAZIR },
    });
    return yeni;
  });
  return { surum_id: surum.id };
}
