// ADR-0028 / Sprint 3 S3-3 — Dosya servisi ortak yardımcılar.
// hata helper + dosya lookup + kaynak yetki kontrolü.

import {
  DosyaKaynakTipi,
} from "@prisma/client";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { canKart, canListe, canProje } from "@/lib/yetki";

export const UPLOAD_OTURUMU_TTL_DK = 30;

export function hata(
  mesaj: string,
  kod: keyof typeof HATA_KODU = "GECERSIZ_GIRDI",
): never {
  throw new EylemHatasi(mesaj, HATA_KODU[kod]);
}

export async function dosyayiBulSilinmemis(
  dosyaId: string,
): Promise<{
  id: string;
  yukleyen_id: string;
  bucket: string;
  depolama_yolu: string;
  mime: string;
  silindi_mi: boolean;
}> {
  const d = await db.dosya.findUnique({
    where: { id: dosyaId },
    select: {
      id: true,
      yukleyen_id: true,
      bucket: true,
      depolama_yolu: true,
      mime: true,
      silindi_mi: true,
    },
  });
  if (!d) hata("Dosya bulunamadı.", "BULUNAMADI");
  return d;
}

export async function kaynagaErisimZorunlu(
  kullaniciId: string,
  kaynakTip: DosyaKaynakTipi,
  kaynakId: string,
  edit: boolean,
): Promise<{
  proje_id: string | null;
  liste_id: string | null;
  kart_id: string | null;
}> {
  if (kaynakTip === "KART") {
    const ok = edit
      ? await canKart(kullaniciId, "kart:edit", kaynakId)
      : await canKart(kullaniciId, "kart:read", kaynakId);
    if (!ok) hata("Bu karta erişim yetkiniz yok.", "YETKISIZ");
    const k = await db.kart.findUnique({
      where: { id: kaynakId },
      select: { id: true, liste: { select: { id: true, proje_id: true } } },
    });
    if (!k) hata("Kart bulunamadı.", "BULUNAMADI");
    return {
      kart_id: k.id,
      liste_id: k.liste.id,
      proje_id: k.liste.proje_id,
    };
  }
  if (kaynakTip === "LISTE") {
    const ok = edit
      ? await canListe(kullaniciId, "liste:edit", kaynakId)
      : await canListe(kullaniciId, "liste:read", kaynakId);
    if (!ok) hata("Bu listeye erişim yetkiniz yok.", "YETKISIZ");
    const l = await db.liste.findUnique({
      where: { id: kaynakId },
      select: { id: true, proje_id: true },
    });
    if (!l) hata("Liste bulunamadı.", "BULUNAMADI");
    return { liste_id: l.id, proje_id: l.proje_id, kart_id: null };
  }
  // PROJE
  const ok = edit
    ? await canProje(kullaniciId, "proje:edit", kaynakId)
    : await canProje(kullaniciId, "proje:read", kaynakId);
  if (!ok) hata("Bu projeye erişim yetkiniz yok.", "YETKISIZ");
  const p = await db.proje.findUnique({
    where: { id: kaynakId },
    select: { id: true },
  });
  if (!p) hata("Proje bulunamadı.", "BULUNAMADI");
  return { proje_id: p.id, liste_id: null, kart_id: null };
}
