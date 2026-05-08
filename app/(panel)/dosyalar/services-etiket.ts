// ADR-0028 / Sprint 3 S3-3 — Dosya etiketi yönetimi (atama + CRUD).

import { db } from "@/lib/db";
import { yetkiZorunluDosya } from "@/lib/dosya-yetki";
import type {
  DosyaEtiketleriGuncelleGirdi,
  DosyaEtiketiOlusturGirdi,
} from "./schemas";

export async function etiketleriGuncelle(
  kullaniciId: string,
  girdi: DosyaEtiketleriGuncelleGirdi,
): Promise<void> {
  await yetkiZorunluDosya(kullaniciId, "dosya:tag", girdi.dosya_id);
  await db.$transaction(async (tx) => {
    await tx.dosyaEtiketBaglantisi.deleteMany({
      where: { dosya_id: girdi.dosya_id },
    });
    if (girdi.etiket_idleri.length === 0) return;
    await tx.dosyaEtiketBaglantisi.createMany({
      data: girdi.etiket_idleri.map((etiket_id) => ({
        dosya_id: girdi.dosya_id,
        etiket_id,
      })),
      skipDuplicates: true,
    });
  });
}

export async function etiketOlustur(
  kullaniciId: string,
  girdi: DosyaEtiketiOlusturGirdi,
): Promise<{ id: string }> {
  // Resource bağı yok — sistem izni (DOSYA_ETIKET_YONET) action wrapper'da
  // kontrol edilir; burada sadece create.
  const e = await db.dosyaEtiketi.create({
    data: {
      proje_id: girdi.proje_id ?? null,
      ad: girdi.ad,
      renk: girdi.renk ?? null,
      olusturan_id: kullaniciId,
    },
    select: { id: true },
  });
  return e;
}

export async function etiketSil(etiketId: string): Promise<void> {
  await db.dosyaEtiketi.delete({ where: { id: etiketId } });
}
