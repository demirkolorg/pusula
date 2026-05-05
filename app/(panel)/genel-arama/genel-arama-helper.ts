// Genel Arama — saf logic helper'ları.
// Kontrol Kural 131/139 (logic UI'dan ayrı + test ZORUNLU).
// DB/React/dnd-kit bağımlılığı YOK — doğrudan unit test edilir.

import type { AramaTipi } from "./schemas";
import type { AramaSonucu } from "./tipler";

/**
 * Kullanıcı sorgusunu Postgres `tsquery` formatına çevirir.
 *
 * - Türkçe normalize (Postgres `pusula_turkish` config'i unaccent içeriyor;
 *   bu fonksiyon ek kullanıcı-dostu normalize yapar: I/i ayrımı vb. korunur).
 * - Birden fazla kelimeyi `&` ile birleştirir (AND mantığı — daha hassas eşleşme).
 * - Son kelimeye `:*` prefix wildcard ekler (yazılırken canlı arama için).
 * - tsquery special karakterlerini (`&`, `|`, `!`, `(`, `)`, `:`) escape eder.
 *
 * Örnek:
 *   "yetki ay" → "yetki & ay:*"
 *   "kış"      → "kış:*"
 *   ""         → null  (sorgu yoksa SQL'i atla)
 */
export function tsqueryyeCevir(ham: string): string | null {
  const temiz = ham.trim();
  if (temiz.length < 2) return null;

  const kelimeler = temiz
    .split(/\s+/)
    .map(kelimeyiTemizle)
    .filter((k): k is string => k !== null);

  if (kelimeler.length === 0) return null;

  // Son kelimeye prefix wildcard ekle (canlı arama UX'i — "yetk" yazınca
  // "yetkili"yi bulur). Diğer kelimeler tam eşleşme.
  const sonIndex = kelimeler.length - 1;
  return kelimeler
    .map((k, i) => (i === sonIndex ? `${k}:*` : k))
    .join(" & ");
}

/**
 * tsquery special karakterlerini sökerek temiz bir kelime üretir. Tek karakter
 * veya tamamen özel karakterli kelimeleri reddeder (null).
 */
function kelimeyiTemizle(kelime: string): string | null {
  // Sadece harf, rakam, tire, alt çizgi kalsın. Türkçe karakterler korunur
  // (Postgres `unaccent` mapping'i kendisi yapar — biz korumalıyız ki
  // `pg_trgm` similarity'si Türkçe karakteri görsün).
  const temiz = kelime.replace(/[^\p{L}\p{N}\-_]/gu, "");
  if (temiz.length < 2) return null;
  return temiz;
}

/**
 * Aday sonuçları rank'a göre sıralayıp limit'e indirger. UNION ALL sonucu
 * SQL'de zaten sıralı dönse de, app-level yetki filtresinden sonra tekrar
 * gerekebilir.
 */
export function rankaGoreSirala(
  sonuclar: AramaSonucu[],
  limit: number,
): AramaSonucu[] {
  return [...sonuclar]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit);
}

/**
 * Sonuçları tip bazlı gruplandırır. UI başlık + grup içi liste için.
 * Her grup içinde rank sıralaması korunur.
 */
export function tipeGoreGrupla(
  sonuclar: AramaSonucu[],
): Map<AramaTipi, AramaSonucu[]> {
  const map = new Map<AramaTipi, AramaSonucu[]>();
  for (const s of sonuclar) {
    const liste = map.get(s.tip) ?? [];
    liste.push(s);
    map.set(s.tip, liste);
  }
  return map;
}

/**
 * Ham metni daraltır (UI satır sığdırma — ts_headline yoksa fallback).
 * Sorgu kelimesinin ilk geçtiği yerin etrafını kırpar.
 */
export function metniKirp(metin: string, sorgu: string, max = 120): string {
  if (metin.length <= max) return metin;
  const ilkKelime = sorgu.trim().split(/\s+/)[0]?.toLowerCase();
  if (!ilkKelime) return metin.slice(0, max) + "…";
  const idx = metin.toLowerCase().indexOf(ilkKelime);
  if (idx < 0) return metin.slice(0, max) + "…";
  const baslangic = Math.max(0, idx - 30);
  const son = Math.min(metin.length, baslangic + max);
  const onek = baslangic > 0 ? "…" : "";
  const sonek = son < metin.length ? "…" : "";
  return onek + metin.slice(baslangic, son) + sonek;
}
