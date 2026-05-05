import {
  ALT_KATEGORI_BASLIKLARI,
  IZIN_KATEGORI,
  IZIN_KODLARI,
  KATEGORI_BASLIKLARI,
  type IzinKodu,
} from "@/lib/permissions-katalog";
import type { IzinKategorisi } from "@prisma/client";

/**
 * ADR-0013/0014: PermissionMatrix saf logic katmanı.
 * UI'a (TSX) veri sağlar; DOM/React import etmez (Kural 131, 139).
 *
 * Alt-kategori desteği (ADR-0014): kategoriler "yetkili", "kapak", "tarih"
 * gibi alt gruplara ayrılır. UI iç içe accordion ile sunar.
 */

export type IzinSatiri = {
  id: string;
  kod: IzinKodu | string;
  ad: string;
  aciklama: string | null;
  kategori: IzinKategorisi;
  alt_kategori: string | null;
};

export type IzinAltGrubu = {
  altKategori: string | null;
  baslik: string;
  izinler: IzinSatiri[];
  toplamSayisi: number;
  secilmisSayisi: number;
};

export type IzinKategoriGrubu = {
  kategori: IzinKategorisi;
  baslik: string;
  altGruplar: IzinAltGrubu[];
  toplamSayisi: number;
  secilmisSayisi: number;
};

export type IzinDiff = {
  eklenen: string[];
  kaldirilan: string[];
  degismemis: string[];
};

const GENEL_BASLIK = "Temel";

function altKategoriBasligi(altKategori: string | null): string {
  if (!altKategori) return GENEL_BASLIK;
  return ALT_KATEGORI_BASLIKLARI[altKategori] ?? altKategori;
}

/**
 * İzinleri kategori → alt-kategori → izin hiyerarşisi olarak gruplar.
 * Boş gruplar atlanır.
 */
export function izinleriKategoriyeGore(
  izinler: IzinSatiri[],
  secili: ReadonlySet<string>,
): IzinKategoriGrubu[] {
  // Önce kategori → izinler haritası
  const ustGruplar = new Map<IzinKategorisi, IzinSatiri[]>();
  for (const izin of izinler) {
    const liste = ustGruplar.get(izin.kategori) ?? [];
    liste.push(izin);
    ustGruplar.set(izin.kategori, liste);
  }

  return Array.from(ustGruplar.entries()).map(([kategori, ustListe]) => {
    // Alt-kategori → izinler
    const altMap = new Map<string | null, IzinSatiri[]>();
    for (const izin of ustListe) {
      const k = izin.alt_kategori;
      const liste = altMap.get(k) ?? [];
      liste.push(izin);
      altMap.set(k, liste);
    }

    // Alt-grupları sırala: null (Genel) önce, sonra alfabetik başlığa göre
    const altGruplar: IzinAltGrubu[] = Array.from(altMap.entries())
      .map(([altKategori, altListe]) => ({
        altKategori,
        baslik: altKategoriBasligi(altKategori),
        izinler: altListe.sort((a, b) =>
          a.ad.localeCompare(b.ad, "tr"),
        ),
        toplamSayisi: altListe.length,
        secilmisSayisi: altListe.filter((i) => secili.has(i.kod)).length,
      }))
      .sort((a, b) => {
        if (a.altKategori === null) return -1;
        if (b.altKategori === null) return 1;
        return a.baslik.localeCompare(b.baslik, "tr");
      });

    return {
      kategori,
      baslik: KATEGORI_BASLIKLARI[kategori],
      altGruplar,
      toplamSayisi: ustListe.length,
      secilmisSayisi: ustListe.filter((i) => secili.has(i.kod)).length,
    };
  });
}

/**
 * Arama metnine göre izinleri filtreler — kod, ad, açıklama, kategori başlığı,
 * alt-kategori başlığında geçen kayıtları döner.
 */
export function izinleriAra(
  izinler: IzinSatiri[],
  arama: string,
): IzinSatiri[] {
  const q = arama.trim().toLocaleLowerCase("tr");
  if (q.length === 0) return izinler;
  return izinler.filter((izin) => {
    const ust = KATEGORI_BASLIKLARI[izin.kategori].toLocaleLowerCase("tr");
    const alt = altKategoriBasligi(izin.alt_kategori).toLocaleLowerCase("tr");
    return (
      izin.kod.toLocaleLowerCase("tr").includes(q) ||
      izin.ad.toLocaleLowerCase("tr").includes(q) ||
      (izin.aciklama?.toLocaleLowerCase("tr").includes(q) ?? false) ||
      ust.includes(q) ||
      alt.includes(q)
    );
  });
}

/** Tek izin kodu seç/kaldır. */
export function izinTogglela(
  secili: ReadonlySet<string>,
  izin: IzinKodu | string,
): Set<string> {
  const yeni = new Set(secili);
  if (yeni.has(izin)) yeni.delete(izin);
  else yeni.add(izin);
  return yeni;
}

/** Bir izin grubunu (kategori veya alt-grup) topluca seç/kaldır. */
export function grubuToggle(
  secili: ReadonlySet<string>,
  grupIzinleri: IzinSatiri[],
): Set<string> {
  const yeni = new Set(secili);
  const tumuSecili = grupIzinleri.every((i) => secili.has(i.kod));
  if (tumuSecili) {
    for (const izin of grupIzinleri) yeni.delete(izin.kod);
  } else {
    for (const izin of grupIzinleri) yeni.add(izin.kod);
  }
  return yeni;
}

/** ADR-0013 geri uyum: eski helper ismi (test bağımlılığı). */
export const kategoriToggle = grubuToggle;

/** Tüm izinleri topluca seç/kaldır. */
export function tumuToggle(
  secili: ReadonlySet<string>,
  tumIzinler: IzinSatiri[],
): Set<string> {
  const tumuSecili = tumIzinler.every((i) => secili.has(i.kod));
  if (tumuSecili) return new Set();
  return new Set(tumIzinler.map((i) => i.kod));
}

/** Baseline ↔ yeni seçim diff. */
export function izinDiffi(
  baseline: ReadonlySet<string>,
  yeni: ReadonlySet<string>,
): IzinDiff {
  const eklenen: string[] = [];
  const kaldirilan: string[] = [];
  const degismemis: string[] = [];

  for (const kod of yeni) {
    if (!baseline.has(kod)) eklenen.push(kod);
    else degismemis.push(kod);
  }
  for (const kod of baseline) {
    if (!yeni.has(kod)) kaldirilan.push(kod);
  }

  return { eklenen, kaldirilan, degismemis };
}

export function diffBosMu(diff: IzinDiff): boolean {
  return diff.eklenen.length === 0 && diff.kaldirilan.length === 0;
}

/**
 * Rol yönetimi yetkisinin kaldırılma riski — kullanıcının kendi rolünden
 * `rol:*` izinlerinin tamamı çıkıyorsa uyarı göster.
 */
const ROL_YONET_IZINLERI: ReadonlySet<string> = new Set([
  IZIN_KODLARI.ROL_OLUSTUR,
  IZIN_KODLARI.ROL_DUZENLE,
  IZIN_KODLARI.ROL_IZIN_ATA,
  IZIN_KODLARI.ROL_COGALT,
  IZIN_KODLARI.ROL_SIL,
  IZIN_KODLARI.ROL_KULLANICIYA_ATA,
  // Eski geniş kod (geri uyum)
  "rol:manage",
]);

export function rolYonetKaldiriliyorMu(
  baseline: ReadonlySet<string>,
  yeni: ReadonlySet<string>,
): boolean {
  const baselineVar = Array.from(baseline).some((k) =>
    ROL_YONET_IZINLERI.has(k),
  );
  const yeniVar = Array.from(yeni).some((k) => ROL_YONET_IZINLERI.has(k));
  return baselineVar && !yeniVar;
}

/** İzin kodunun kategori başlığını döner — UI rozet/etiket için. */
export function izinKategoriBasligi(kod: IzinKodu | string): string {
  const kategori = IZIN_KATEGORI[kod as IzinKodu];
  if (!kategori) return "Diğer";
  return KATEGORI_BASLIKLARI[kategori];
}
