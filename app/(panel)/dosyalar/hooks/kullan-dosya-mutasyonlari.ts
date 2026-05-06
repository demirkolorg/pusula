"use client";

import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import {
  dosyaAciklamaGuncelleEylem,
  dosyaAdGuncelleEylem,
  dosyaGeriYukleEylem,
  dosyaGizlilikGuncelleEylem,
  dosyaKaliciSilEylem,
  dosyaSilEylem,
} from "../actions";
import type {
  DosyaAciklamaGuncelleGirdi,
  DosyaAdGuncelleGirdi,
  DosyaGeriYukleGirdi,
  DosyaGizlilikGuncelleGirdi,
  DosyaKaliciSilGirdi,
  DosyaSilGirdi,
} from "../schemas";
import {
  DOSYA_DETAY_KEY,
  dosyaDetayKey,
} from "./kullan-dosya-detay";
import { DOSYA_LISTESI_KEY } from "./kullan-dosya-listesi";

// Liste optimistic update için cursor-pagination yapısı (InfiniteData) ile
// uyumlu yardımcı: tüm sayfaların satırlarını filtreler.
type Sayfa = { satirlar: Array<{ id: string }>; sonraki_cursor: string | null };
type SayfaliVeri = { pages: Sayfa[]; pageParams: unknown[] };

function listeyiSatirIleSil(
  eski: unknown,
  vars: { id: string },
): unknown {
  const v = eski as SayfaliVeri | undefined;
  if (!v?.pages) return eski;
  return {
    ...v,
    pages: v.pages.map((s) => ({
      ...s,
      satirlar: s.satirlar.filter((r) => r.id !== vars.id),
    })),
  };
}

function detayiAdIleGuncelle(
  eski: unknown,
  vars: DosyaAdGuncelleGirdi,
): unknown {
  if (!eski) return eski;
  return { ...(eski as { ad?: string }), ad: vars.ad };
}

function detayiAciklamaIleGuncelle(
  eski: unknown,
  vars: DosyaAciklamaGuncelleGirdi,
): unknown {
  if (!eski) return eski;
  return { ...(eski as { aciklama?: string | null }), aciklama: vars.aciklama };
}

function detayiGizlilikIleGuncelle(
  eski: unknown,
  vars: DosyaGizlilikGuncelleGirdi,
): unknown {
  if (!eski) return eski;
  return { ...(eski as { gizlilik?: string }), gizlilik: vars.gizlilik };
}

export function useDosyaSil() {
  return useOptimisticMutation<DosyaSilGirdi, { id: string }>({
    queryKey: [DOSYA_LISTESI_KEY],
    mutationFn: eylemMutasyonu(dosyaSilEylem),
    optimistic: listeyiSatirIleSil,
    hataMesaji: "Dosya silinemedi",
  });
}

export function useDosyaGeriYukle() {
  return useOptimisticMutation<DosyaGeriYukleGirdi, { id: string }>({
    queryKey: [DOSYA_LISTESI_KEY],
    mutationFn: eylemMutasyonu(dosyaGeriYukleEylem),
    optimistic: listeyiSatirIleSil, // çöp kutusundan ayrılır → liste'den çıkar
    hataMesaji: "Dosya geri yüklenemedi",
  });
}

export function useDosyaKaliciSil() {
  return useOptimisticMutation<DosyaKaliciSilGirdi, { id: string }>({
    queryKey: [DOSYA_LISTESI_KEY],
    mutationFn: eylemMutasyonu(dosyaKaliciSilEylem),
    optimistic: listeyiSatirIleSil,
    hataMesaji: "Dosya kalıcı olarak silinemedi",
  });
}

export function useDosyaAdGuncelle(dosyaId: string) {
  return useOptimisticMutation<DosyaAdGuncelleGirdi, { id: string }>({
    queryKey: dosyaDetayKey(dosyaId),
    mutationFn: eylemMutasyonu(dosyaAdGuncelleEylem),
    optimistic: detayiAdIleGuncelle,
    ekInvalidate: [[DOSYA_LISTESI_KEY], [DOSYA_DETAY_KEY, dosyaId]],
    hataMesaji: "Ad güncellenemedi",
  });
}

export function useDosyaAciklamaGuncelle(dosyaId: string) {
  return useOptimisticMutation<DosyaAciklamaGuncelleGirdi, { id: string }>({
    queryKey: dosyaDetayKey(dosyaId),
    mutationFn: eylemMutasyonu(dosyaAciklamaGuncelleEylem),
    optimistic: detayiAciklamaIleGuncelle,
    ekInvalidate: [[DOSYA_DETAY_KEY, dosyaId]],
    hataMesaji: "Açıklama güncellenemedi",
  });
}

export function useDosyaGizlilikGuncelle(dosyaId: string) {
  return useOptimisticMutation<DosyaGizlilikGuncelleGirdi, { id: string }>({
    queryKey: dosyaDetayKey(dosyaId),
    mutationFn: eylemMutasyonu(dosyaGizlilikGuncelleEylem),
    optimistic: detayiGizlilikIleGuncelle,
    ekInvalidate: [[DOSYA_LISTESI_KEY], [DOSYA_DETAY_KEY, dosyaId]],
    hataMesaji: "Gizlilik güncellenemedi",
  });
}
