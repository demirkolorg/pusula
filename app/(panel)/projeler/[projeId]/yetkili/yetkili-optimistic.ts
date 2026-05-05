import type { ProjeYetkiSeviyesi } from "./schemas";
import type {
  YetkiliBirimOzeti,
  YetkiliKisiAdayi,
  YetkiliKisiOzeti,
} from "./yetkili-tipler";

// ---------------------------------------------------------------------------
// Optimistic update saf yardımcıları — UI'dan ve action'lardan bağımsız.
//
// Why ayrı dosya: `yetkili-adaptor` server-only action'ları import ettiğinden
// (next-auth zinciri vs.) saf testlerde import edilemiyor. Bu modül sıfır
// side-effect, sıfır framework içerir → unit test'e uygun.
// ---------------------------------------------------------------------------

export function optimistikBirimEkle(
  eski: YetkiliBirimOzeti[] | undefined,
  secenek: { id: string; ad: string | null; tip: YetkiliBirimOzeti["tip"] },
): YetkiliBirimOzeti[] {
  const liste = eski ?? [];
  if (liste.some((b) => b.birim_id === secenek.id)) return liste;
  return [
    ...liste,
    {
      birim_id: secenek.id,
      ad: secenek.ad,
      tip: secenek.tip,
      eklenme_zamani: new Date(),
    },
  ];
}

export function optimistikBirimKaldir(
  eski: YetkiliBirimOzeti[] | undefined,
  birim_id: string,
): YetkiliBirimOzeti[] {
  return (eski ?? []).filter((b) => b.birim_id !== birim_id);
}

export function optimistikKisiEkle(
  eski: YetkiliKisiOzeti[] | undefined,
  aday: YetkiliKisiAdayi,
  seviye: ProjeYetkiSeviyesi | null,
): YetkiliKisiOzeti[] {
  const liste = eski ?? [];
  if (liste.some((k) => k.kullanici_id === aday.id)) return liste;
  return [
    ...liste,
    {
      kullanici_id: aday.id,
      ad: aday.ad,
      soyad: aday.soyad,
      email: aday.email,
      birim_ad: aday.birim_ad,
      seviye,
      eklenme_zamani: new Date(),
    },
  ];
}

export function optimistikKisiKaldir(
  eski: YetkiliKisiOzeti[] | undefined,
  kullanici_id: string,
): YetkiliKisiOzeti[] {
  return (eski ?? []).filter((k) => k.kullanici_id !== kullanici_id);
}

export function optimistikSeviyeGuncelle(
  eski: YetkiliKisiOzeti[] | undefined,
  kullanici_id: string,
  seviye: ProjeYetkiSeviyesi,
): YetkiliKisiOzeti[] {
  return (eski ?? []).map((k) =>
    k.kullanici_id === kullanici_id ? { ...k, seviye } : k,
  );
}
