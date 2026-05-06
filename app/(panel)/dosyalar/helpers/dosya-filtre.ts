// ADR-0028 / F6 — `/dosyalar` filtre durumu için saf helper'lar.
// URL search params ↔ DosyaListeFiltre dönüşümü, default değerler,
// filtre temizleme. UI bileşeni bu fonksiyonları çağırır; saf JS
// (Kural 131 — iş mantığı UI'dan ayrı, Kural 139 — saf fonksiyon test ZORUNLU).

import type { DosyaListeFiltre } from "../schemas";

export const VARSAYILAN_FILTRE: DosyaListeFiltre = {
  siralama: "yeni-eklenen",
  limit: 50,
};

const KATEGORILER = [
  "GORSEL",
  "PDF",
  "OFIS_BELGESI",
  "TABLO",
  "SUNUM",
  "METIN",
  "ARSIV",
  "DIGER",
] as const;
type Kategori = (typeof KATEGORILER)[number];

const DURUMLAR = ["YUKLENIYOR", "HAZIR", "KARANTINA", "HATALI"] as const;
type Durum = (typeof DURUMLAR)[number];

const GIZLILIKLER = ["NORMAL", "HASSAS", "GIZLI"] as const;
type Gizlilik = (typeof GIZLILIKLER)[number];

const SIRALAMALAR = [
  "yeni-eklenen",
  "eski-eklenen",
  "ad-asc",
  "ad-desc",
  "boyut-asc",
  "boyut-desc",
  "son-indirme",
] as const;
type Siralama = (typeof SIRALAMALAR)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function tekDeger(
  v: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function uuidVeya(d: string | undefined): string | undefined {
  if (!d) return undefined;
  return UUID_RE.test(d) ? d : undefined;
}

function kategoriVeya(d: string | undefined): Kategori | undefined {
  if (!d) return undefined;
  return KATEGORILER.includes(d as Kategori) ? (d as Kategori) : undefined;
}

function durumVeya(d: string | undefined): Durum | undefined {
  if (!d) return undefined;
  return DURUMLAR.includes(d as Durum) ? (d as Durum) : undefined;
}

function gizlilikVeya(d: string | undefined): Gizlilik | undefined {
  if (!d) return undefined;
  return GIZLILIKLER.includes(d as Gizlilik) ? (d as Gizlilik) : undefined;
}

function siralamaVeya(d: string | undefined): Siralama {
  if (!d) return "yeni-eklenen";
  return SIRALAMALAR.includes(d as Siralama)
    ? (d as Siralama)
    : "yeni-eklenen";
}

function pozitifSayiVeya(d: string | undefined): number | undefined {
  if (!d) return undefined;
  const n = Number(d);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function tarihVeya(d: string | undefined): Date | undefined {
  if (!d) return undefined;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? undefined : t;
}

function boolVeya(d: string | undefined): boolean | undefined {
  if (d === "1" || d === "true") return true;
  if (d === "0" || d === "false") return false;
  return undefined;
}

/**
 * URL searchParams'ı `DosyaListeFiltre` objesine dönüştürür. Geçersiz
 * değerler atlanır (silently); kullanıcı manipüle ederse default'a düşer.
 */
export function paramlardanFiltreUret(
  params: Record<string, string | string[] | undefined>,
): DosyaListeFiltre {
  const arama = tekDeger(params.arama)?.trim();
  return {
    arama: arama && arama.length > 0 ? arama : undefined,
    kategori: kategoriVeya(tekDeger(params.kategori)),
    proje_id: uuidVeya(tekDeger(params.proje_id)),
    liste_id: uuidVeya(tekDeger(params.liste_id)),
    kart_id: uuidVeya(tekDeger(params.kart_id)),
    yukleyen_id: uuidVeya(tekDeger(params.yukleyen_id)),
    durum: durumVeya(tekDeger(params.durum)),
    gizlilik: gizlilikVeya(tekDeger(params.gizlilik)),
    silinmis: boolVeya(tekDeger(params.silinmis)),
    baglantisiz: boolVeya(tekDeger(params.baglantisiz)),
    boyut_min: pozitifSayiVeya(tekDeger(params.boyut_min)),
    boyut_max: pozitifSayiVeya(tekDeger(params.boyut_max)),
    tarih_baslangic: tarihVeya(tekDeger(params.tarih_baslangic)),
    tarih_bitis: tarihVeya(tekDeger(params.tarih_bitis)),
    siralama: siralamaVeya(tekDeger(params.siralama)),
    cursor: uuidVeya(tekDeger(params.cursor)),
    limit: 50,
  };
}

/**
 * `DosyaListeFiltre`'yi URLSearchParams string'ine çevirir. Default
 * değerler URL'e yazılmaz (temiz URL: `/dosyalar?kategori=PDF`).
 */
export function filtreyiSorguStringeyeCevir(
  filtre: DosyaListeFiltre,
): string {
  const p = new URLSearchParams();
  if (filtre.arama) p.set("arama", filtre.arama);
  if (filtre.kategori) p.set("kategori", filtre.kategori);
  if (filtre.proje_id) p.set("proje_id", filtre.proje_id);
  if (filtre.liste_id) p.set("liste_id", filtre.liste_id);
  if (filtre.kart_id) p.set("kart_id", filtre.kart_id);
  if (filtre.yukleyen_id) p.set("yukleyen_id", filtre.yukleyen_id);
  if (filtre.durum) p.set("durum", filtre.durum);
  if (filtre.gizlilik) p.set("gizlilik", filtre.gizlilik);
  if (filtre.silinmis !== undefined)
    p.set("silinmis", filtre.silinmis ? "1" : "0");
  if (filtre.baglantisiz !== undefined)
    p.set("baglantisiz", filtre.baglantisiz ? "1" : "0");
  if (filtre.boyut_min !== undefined)
    p.set("boyut_min", String(filtre.boyut_min));
  if (filtre.boyut_max !== undefined)
    p.set("boyut_max", String(filtre.boyut_max));
  if (filtre.tarih_baslangic)
    p.set("tarih_baslangic", filtre.tarih_baslangic.toISOString());
  if (filtre.tarih_bitis)
    p.set("tarih_bitis", filtre.tarih_bitis.toISOString());
  if (filtre.siralama && filtre.siralama !== "yeni-eklenen")
    p.set("siralama", filtre.siralama);
  return p.toString();
}

/**
 * Aktif filtre sayısı (default olmayan). UI'da "X filtre aktif" badge'i için.
 */
export function aktifFiltreSayisi(filtre: DosyaListeFiltre): number {
  let sayi = 0;
  if (filtre.arama) sayi++;
  if (filtre.kategori) sayi++;
  if (filtre.proje_id) sayi++;
  if (filtre.liste_id) sayi++;
  if (filtre.kart_id) sayi++;
  if (filtre.yukleyen_id) sayi++;
  if (filtre.durum) sayi++;
  if (filtre.gizlilik) sayi++;
  if (filtre.silinmis) sayi++;
  if (filtre.baglantisiz) sayi++;
  if (filtre.boyut_min !== undefined) sayi++;
  if (filtre.boyut_max !== undefined) sayi++;
  if (filtre.tarih_baslangic) sayi++;
  if (filtre.tarih_bitis) sayi++;
  return sayi;
}

/**
 * Filtreyi varsayılana sıfırla — UI "Filtreleri temizle" butonu için.
 */
export function filtreyiTemizle(): DosyaListeFiltre {
  return { ...VARSAYILAN_FILTRE };
}

/**
 * Boyutu insan-okur formata çevirir (UI'da satır metaverisi).
 */
export function boyutBicim(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  if (byte < 1024 * 1024 * 1024)
    return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
  return `${(byte / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
