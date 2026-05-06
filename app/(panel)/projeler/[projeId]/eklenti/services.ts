// ADR-0028 / F5 — Kart eklenti compatibility wrapper.
//
// Önceki sürümde Eklenti tablosuna doğrudan yazıyordu; F5 itibariyle
// yeni `app/(panel)/dosyalar/services.ts` (Dosya + DosyaSurumu +
// DosyaBaglantisi) üçlü modeline delege eder. UI tarafı `EklentiOzeti`
// tipini bekliyor; bu modül yeni satırları o şekle çevirir.
//
// Eski tablo F4 sonrası read-only — backfill ile dolu, F4'ten sonra ek
// kayıt yazılmaz. Plan F8/F10'da kaldırılacak.

import {
  dosyalariListele as yeniListele,
  yuklemeBaslat as yeniYuklemeBaslat,
  yuklemeOnayla as yeniYuklemeOnayla,
  indirUrl as yeniIndirUrl,
  sil as yeniSil,
} from "@/app/(panel)/dosyalar/services";
import type { YuklemeBaslat, YuklemeOnayla } from "./schemas";

export type EklentiOzeti = {
  id: string;
  kart_id: string;
  yukleyen_id: string;
  yukleyen: { ad: string; soyad: string };
  ad: string;
  mime: string;
  boyut: number;
  olusturma_zamani: Date;
};

export async function kartEklentileriniListele(
  kullaniciId: string,
  kartId: string,
): Promise<EklentiOzeti[]> {
  const sonuc = await yeniListele(kullaniciId, {
    kart_id: kartId,
    siralama: "yeni-eklenen",
    limit: 50,
  });
  return sonuc.satirlar.map<EklentiOzeti>((s) => ({
    id: s.id,
    kart_id: kartId,
    yukleyen_id: s.yukleyen.id,
    yukleyen: { ad: s.yukleyen.ad, soyad: s.yukleyen.soyad },
    ad: s.ad,
    mime: s.mime,
    boyut: s.boyut,
    olusturma_zamani: s.olusturma_zamani,
  }));
}

export async function yuklemeBaslat(
  kullaniciId: string,
  girdi: YuklemeBaslat,
): Promise<{ oturum_id: string; upload_url: string }> {
  const sonuc = await yeniYuklemeBaslat(kullaniciId, {
    kaynak_tip: "KART",
    kaynak_id: girdi.kart_id,
    ad: girdi.ad,
    mime: girdi.mime,
    boyut: girdi.boyut,
  });
  return { oturum_id: sonuc.oturum_id, upload_url: sonuc.upload_url };
}

export async function yuklemeOnayla(
  kullaniciId: string,
  girdi: YuklemeOnayla,
): Promise<{ id: string }> {
  return yeniYuklemeOnayla(kullaniciId, { oturum_id: girdi.oturum_id });
}

export async function eklentiIndirURL(
  kullaniciId: string,
  eklentiId: string,
): Promise<{ url: string }> {
  return yeniIndirUrl(kullaniciId, eklentiId);
}

export async function eklentiSil(
  kullaniciId: string,
  eklentiId: string,
): Promise<void> {
  await yeniSil(kullaniciId, eklentiId);
}
