// Sprint 3 / S3-1 — Aktivite servisi parça dosyası: diff → alan değişikliği.
// ADR-0032 mega dosya bölmesi.
//
// İçerik: degisiklikleriHazirla — UPDATE event'lerinde alan-bazlı diff'i
// `AlanDegisikligi[]`'ye çevirir. degerFormatla — id → ad join, Date →
// "dd.MM.yyyy HH:mm" gibi tip-spesifik gösterim.

import { kapakEtiketi } from "@/lib/kapak-renk";
import {
  type AlanDegisikligi,
  type HamAktivite,
  type IdMaplar,
} from "./services-ortak";

// =====================================================================
// Anlamsız alanlar (UI'a gösterilmez): zamanlar, sıralama, sistem flag'leri
// =====================================================================

const YOKSAY_ALANLAR = new Set([
  "olusturma_zamani",
  "guncelleme_zamani",
  "tamamlama_zamani",
  "tamamlanma_zamani",
  "tamamlayan_id",
  "eklenme_zamani",
  "silinme_zamani",
  "arsiv_zamani",
  "arsiv_oncesi_liste_id",
  "sira",
  // Bu alanlar ana mesajda zaten ifade ediliyor, çift göstermeyelim
  "silindi_mi",
  "arsiv_mi",
  "tamamlandi_mi",
  "duzenlendi_mi",
  // Anti-noise: meta-alanlar
  "id",
  "kart_id",
  "proje_id",
  "kontrol_listesi_id",
  "olusturan_id",
]);

// =====================================================================
// Kaynak tip + alan adı → TR etiket
// =====================================================================

const ALAN_ETIKETI: Record<string, Record<string, string>> = {
  Proje: {
    ad: "Ad",
    aciklama: "Açıklama",
    kapak_renk: "Kapak rengi",
    simge: "Simge",
    yildiz_mi: "Yıldız",
  },
  Liste: {
    ad: "Ad",
  },
  Kart: {
    baslik: "Başlık",
    // ADR-0023 — `aciklama_metin` denormalize alanı; denetim diyaloğu metin
    // farkını gösterir. `aciklama_dokuman` (Tiptap JSON) ham objedir,
    // anlamlı diff için plaintext yeterli.
    aciklama_metin: "Açıklama",
    aciklama_dokuman: "Açıklama (zengin metin)",
    bitis: "Bitiş tarihi",
    baslangic: "Başlangıç tarihi",
    kapak_renk: "Kapak rengi",
    kapak_dosya_id: "Kapak görseli",
    liste_id: "Liste",
  },
  Yorum: {
    icerik: "İçerik",
  },
  Eklenti: {
    ad: "Dosya adı",
  },
  KontrolListesi: {
    ad: "Ad",
  },
  KontrolMaddesi: {
    metin: "Metin",
    atanan_id: "Atanan",
    bitis: "Bitiş",
    tamamlayan_id: "Tamamlayan",
  },
  Etiket: {
    ad: "Ad",
    renk: "Renk",
  },
  ProjeYetkilisi: {
    // ADR-0012: seviye kaldırıldı.
  },
};

// =====================================================================
// Diff → Alan değişikliği listesi
// =====================================================================

export function degisiklikleriHazirla(
  a: HamAktivite,
  idMaplar: IdMaplar,
): AlanDegisikligi[] | null {
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  if (!diff) return null;

  const tipEtiketleri = ALAN_ETIKETI[a.kaynak_tip] ?? {};
  const sonuc: AlanDegisikligi[] = [];

  for (const [alan, deger] of Object.entries(diff)) {
    if (YOKSAY_ALANLAR.has(alan)) continue;
    // Sadece bilinen anlamlı alanları göster — meta-alanları gizle
    const etiket = tipEtiketleri[alan];
    if (!etiket) continue;
    sonuc.push({
      alan: etiket,
      eski: degerFormatla(alan, deger.eski, idMaplar),
      yeni: degerFormatla(alan, deger.yeni, idMaplar),
    });
  }
  return sonuc.length > 0 ? sonuc : null;
}

function degerFormatla(
  alan: string,
  v: unknown,
  idMaplar: IdMaplar,
): string | null {
  if (v === null || v === undefined || v === "") return null;

  // Id alanları → ad join
  if (alan === "liste_id" && typeof v === "string") {
    return idMaplar.liste.get(v) ?? "(silinmiş liste)";
  }
  if (
    (alan === "atanan_id" ||
      alan === "tamamlayan_id" ||
      alan === "olusturan_id" ||
      alan === "yukleyen_id") &&
    typeof v === "string"
  ) {
    return idMaplar.kullanici.get(v) ?? "(kullanıcı)";
  }
  if (alan === "kapak_dosya_id" && typeof v === "string") {
    return idMaplar.eklenti.get(v) ?? "(görsel)";
  }
  if (alan === "kapak_renk" && typeof v === "string") {
    return kapakEtiketi(v) ?? v;
  }
  if (alan === "birim_id" && typeof v === "string") {
    return idMaplar.birim.get(v) ?? "(birim)";
  }

  // Boolean
  if (typeof v === "boolean") return v ? "Evet" : "Hayır";

  // Tarih (ISO string veya Date)
  if (v instanceof Date) return TARIH_FORMAT.format(v);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return TARIH_FORMAT.format(d);
  }

  // Number
  if (typeof v === "number") return String(v);

  // String — TAM gösterim (modal'da kırpma yok; istemci truncate ister
  // sadece liste UI bağlamında uygular).
  if (typeof v === "string") return v;

  // Fallback: JSON — yine tam
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

// Kural 8: dd.MM.yyyy HH:mm, Europe/Istanbul
const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});
