// ADR-0028 / Sprint 3 S3-3 — Dosya bağlantı (link) yönetimi.

import { db } from "@/lib/db";
import { yetkiZorunluDosya } from "@/lib/dosya-yetki";
import type { DosyaBaglantiEkleGirdi } from "./schemas";
import { hata, kaynagaErisimZorunlu } from "./services-ortak";

export async function baglantiEkle(
  kullaniciId: string,
  girdi: DosyaBaglantiEkleGirdi,
): Promise<{ id: string }> {
  await yetkiZorunluDosya(kullaniciId, "dosya:link-add", girdi.dosya_id);
  const baglantiAlanlari = await kaynagaErisimZorunlu(
    kullaniciId,
    girdi.kaynak_tip,
    girdi.kaynak_id,
    true,
  );
  const yeni = await db.dosyaBaglantisi.create({
    data: {
      dosya_id: girdi.dosya_id,
      kaynak_tip: girdi.kaynak_tip,
      kaynak_id: girdi.kaynak_id,
      proje_id: baglantiAlanlari.proje_id,
      liste_id: baglantiAlanlari.liste_id,
      kart_id: baglantiAlanlari.kart_id,
      ekleyen_id: kullaniciId,
      birincil_mi: false,
    },
    select: { id: true },
  });
  return yeni;
}

export async function baglantiKaldir(
  kullaniciId: string,
  baglantiId: string,
): Promise<void> {
  const b = await db.dosyaBaglantisi.findUnique({
    where: { id: baglantiId },
    select: { dosya_id: true, kaynak_tip: true, kaynak_id: true },
  });
  if (!b) hata("Bağlantı bulunamadı.", "BULUNAMADI");
  // Hedef kaynakta edit yetkisi gerekir
  await kaynagaErisimZorunlu(kullaniciId, b.kaynak_tip, b.kaynak_id, true);
  // Dosyaya da link-remove izni
  await yetkiZorunluDosya(kullaniciId, "dosya:link-remove", b.dosya_id);
  await db.dosyaBaglantisi.delete({ where: { id: baglantiId } });
}
