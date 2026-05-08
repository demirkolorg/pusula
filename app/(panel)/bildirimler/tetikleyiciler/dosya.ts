// Sprint 3 / S3-4 — ADR-0028 / F9 yeni dosya yönetimi bildirim tetikleyicileri.
// `tetikleEklentiYuklendi` (legacy) `kart.ts` modülünde; bu modül yeni Dosya
// akışı için. İlk faz yalnız KART kaynağı için bildirim üretir
// (kart üyelerine); PROJE/LISTE bağlantıları v2'de açılır.

import { kisalt } from "@/lib/metin-helpers";
import { bildirimUret } from "../services";
import { adSoyad, kartYetkiBaglami, kartYetkiliAliciMap } from "./_ortak";

export async function tetikleDosyaYuklendi(opt: {
  dosyaId: string;
  kaynakTip: "KART" | "PROJE" | "LISTE";
  kaynakId: string;
  yukleyenId: string;
  ad: string;
}): Promise<void> {
  if (opt.kaynakTip !== "KART") return; // PROJE/LISTE v2
  const kart = await kartYetkiBaglami(opt.kaynakId);
  if (!kart) return;
  const yetkiliMap = await kartYetkiliAliciMap([kart], [opt.yukleyenId]);
  const aliciIdler = yetkiliMap.get(kart.id) ?? [];
  if (aliciIdler.length === 0) return;

  const yukleyenAdi = await adSoyad(opt.yukleyenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.yukleyenId,
    tip: "DOSYA_YUKLENDI",
    baslik: `${yukleyenAdi} bir karta dosya yükledi`,
    ozet: `${kart.baslik}: ${kisalt(opt.ad, 80)}`,
    kart_id: opt.kaynakId,
    proje_id: kart.liste.proje_id,
    kaynak_tip: "Dosya",
    kaynak_id: opt.dosyaId,
  });
}

export async function tetikleDosyaSilindi(opt: {
  dosyaId: string;
  kartId: string;
  silenId: string;
  ad: string;
}): Promise<void> {
  const kart = await kartYetkiBaglami(opt.kartId);
  if (!kart) return;
  const yetkiliMap = await kartYetkiliAliciMap([kart], [opt.silenId]);
  const aliciIdler = yetkiliMap.get(kart.id) ?? [];
  if (aliciIdler.length === 0) return;

  const silenAdi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.silenId,
    tip: "DOSYA_SILINDI",
    baslik: `${silenAdi} bir dosya sildi`,
    ozet: `${kart.baslik}: ${kisalt(opt.ad, 80)}`,
    kart_id: opt.kartId,
    proje_id: kart.liste.proje_id,
    kaynak_tip: "Dosya",
    kaynak_id: opt.dosyaId,
  });
}

export async function tetikleDosyaBaglandi(opt: {
  dosyaId: string;
  kaynakTip: "KART" | "PROJE" | "LISTE";
  kaynakId: string;
  ekleyenId: string;
  ad: string;
}): Promise<void> {
  if (opt.kaynakTip !== "KART") return; // PROJE/LISTE v2
  const kart = await kartYetkiBaglami(opt.kaynakId);
  if (!kart) return;
  const yetkiliMap = await kartYetkiliAliciMap([kart], [opt.ekleyenId]);
  const aliciIdler = yetkiliMap.get(kart.id) ?? [];
  if (aliciIdler.length === 0) return;

  const ekleyenAdi = await adSoyad(opt.ekleyenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.ekleyenId,
    tip: "DOSYA_BAGLANDI",
    baslik: `${ekleyenAdi} bir dosyayı karta bağladı`,
    ozet: `${kart.baslik}: ${kisalt(opt.ad, 80)}`,
    kart_id: opt.kaynakId,
    proje_id: kart.liste.proje_id,
    kaynak_tip: "DosyaBaglantisi",
    kaynak_id: opt.dosyaId,
  });
}
