// ADR-0014: Granüler izin kataloğu — saf veri, server/client/test ortak.
//
// Sprint 3 / S3-5 — bu dosya ADR-0032 planına göre kategori bazlı parça
// dosyalara bölündü:
//   permissions-katalog/
//     kodlar.ts             — IZIN_KODLARI, IzinKodu, TUM_IZIN_KODLARI
//     kategori.ts           — IZIN_KATEGORI, IZIN_ALT_KATEGORI, başlıklar
//     tanimlar-proje.ts     — IZIN_TANIMLARI: PROJE + LISTE
//     tanimlar-kart.ts      — IZIN_TANIMLARI: KART (alt-grup'lar dahil)
//     tanimlar-dosya.ts     — IZIN_TANIMLARI: DOSYA (ADR-0028)
//     tanimlar-sistem.ts    — IZIN_TANIMLARI: KULLANICI/BIRIM/ROL/AUDIT/AYAR
//     varsayilan-roller.ts  — VARSAYILAN_ROL_IZINLERI matrisi
//
// Bu dosya barrel olarak çağıran kodu etkilemeden tüm public API'i
// re-export eder + IZIN_TANIMLARI'nı 4 parçadan birleştirir.

import type { IzinKodu } from "./permissions-katalog/kodlar";
import { TANIMLAR_PROJE_LISTE } from "./permissions-katalog/tanimlar-proje";
import { TANIMLAR_KART } from "./permissions-katalog/tanimlar-kart";
import { TANIMLAR_DOSYA } from "./permissions-katalog/tanimlar-dosya";
import { TANIMLAR_SISTEM } from "./permissions-katalog/tanimlar-sistem";

export {
  IZIN_KODLARI,
  type IzinKodu,
  TUM_IZIN_KODLARI,
} from "./permissions-katalog/kodlar";

export {
  IZIN_KATEGORI,
  IZIN_ALT_KATEGORI,
  KATEGORI_BASLIKLARI,
  ALT_KATEGORI_BASLIKLARI,
} from "./permissions-katalog/kategori";

export { VARSAYILAN_ROL_IZINLERI } from "./permissions-katalog/varsayilan-roller";

// ============================================================
// İzin tanımları — 4 parça dosyadan birleştirilmiş
// (ad + açıklama Türkçe; UI tooltip + accordion için).
// ============================================================
export const IZIN_TANIMLARI: Partial<
  Record<IzinKodu, { ad: string; aciklama: string }>
> = {
  ...TANIMLAR_PROJE_LISTE,
  ...TANIMLAR_KART,
  ...TANIMLAR_DOSYA,
  ...TANIMLAR_SISTEM,
};
