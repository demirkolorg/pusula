// Sprint 3 / S3-1 — Aktivite servisi parça dosyası: aktiviteOzetle (router).
// ADR-0032 mega dosya bölmesi.
//
// İçerik: aktiviteOzetle — bir HamAktivite + ilgili map'lerden AktiviteOzeti
// üretir. kaynak_tip'e göre uygun mesaj fonksiyonuna route eder, baglamCoz
// ile "hangi proje, hangi liste, hangi kart" üretir.

import type { MentionKisiMap } from "@/lib/mention-format";
import { idariMesaj } from "@/lib/aktivite/idari-mesaj";
import {
  type AktiviteOzeti,
  type BaglamMaplari,
  type HamAktivite,
  type IdMaplar,
  KART_ID_ICEREN_TIPLER,
  jsonAlan,
} from "./services-ortak";
import { degisiklikleriHazirla } from "./services-diff";
import {
  dosyaBaglantisiMesaji,
  dosyaSurumuMesaji,
  eklentiMesaji,
  etiketTanimMesaji,
  hedefBirimMesaji,
  islemAdi,
  kartEtiketMesaji,
  kartMesaji,
  kartYetkilisiMesaji,
  kontrolListesiMesaji,
  kontrolMaddesiMesaji,
  listeBirimiMesaji,
  listeMesaji,
  listeYetkilisiMesaji,
  projeBirimiMesaji,
  projeMesaji,
  projeYetkilisiMesaji,
  yorumMesaji,
} from "./services-mesaj";

// =====================================================================
// Liste id'sinden proje özeti çıkar (kart→liste→proje zinciri).
// =====================================================================

function projeOzeti(
  listeId: string | null | undefined,
  baglam: BaglamMaplari,
): { id: string; ad: string | null } | null {
  if (!listeId) return null;
  const l = baglam.liste.get(listeId);
  if (!l) return null;
  const p = baglam.proje.get(l.proje_id);
  return p ? { id: p.id, ad: p.ad } : { id: l.proje_id, ad: null };
}

// =====================================================================
// Bağlam çözümü — aktivite kaydının hangi proje/liste/kart'a ait olduğunu
// kaynak_tip + JSON path eşleşmeleriyle çıkarır.
// =====================================================================

// Composite-PK ilişki tablolarında JSON'dan, Kart/Liste/Proje için kaynak_id
// veya yeni_veri/eski_veri'den okur. Silinmiş kayıt → ad null → UI fallback.
function baglamCoz(
  a: HamAktivite,
  baglam: BaglamMaplari,
): AktiviteOzeti["baglam"] {
  const tip = a.kaynak_tip;

  // Doğrudan Proje kaydı — kaynak_id proje id'si.
  if (tip === "Proje" && a.kaynak_id) {
    const p = baglam.proje.get(a.kaynak_id);
    return {
      proje: p ?? { id: a.kaynak_id, ad: null },
      liste: null,
      kart: null,
    };
  }

  // Diğer proje düzeyi (yetkili/birim/etiket) — JSON'dan proje_id
  if (tip === "ProjeYetkilisi" || tip === "ProjeBirimi" || tip === "Etiket") {
    const projeId =
      jsonAlan<string>(a.yeni_veri, "proje_id") ??
      jsonAlan<string>(a.eski_veri, "proje_id") ??
      null;
    if (!projeId) return null;
    const p = baglam.proje.get(projeId);
    return {
      proje: p ?? { id: projeId, ad: null },
      liste: null,
      kart: null,
    };
  }

  // Doğrudan Kart kaydı — kaynak_id zaten kart id'si.
  if (tip === "Kart" && a.kaynak_id) {
    const k = baglam.kart.get(a.kaynak_id);
    if (k) {
      const l = baglam.liste.get(k.liste_id);
      return {
        proje: projeOzeti(k.liste_id, baglam),
        liste: l ? { id: l.id, ad: l.ad } : null,
        kart: { id: k.id, baslik: k.baslik },
      };
    }
    // Kart silinmişse — id biliniyor ama ad yok
    return {
      proje: null,
      liste: null,
      kart: { id: a.kaynak_id, baslik: null },
    };
  }

  // Doğrudan Liste kaydı — kart bağlamı yok
  if (tip === "Liste" && a.kaynak_id) {
    const l = baglam.liste.get(a.kaynak_id);
    return {
      proje: l ? projeOzeti(a.kaynak_id, baglam) : null,
      liste: l ? { id: l.id, ad: l.ad } : { id: a.kaynak_id, ad: null },
      kart: null,
    };
  }

  // Liste-bağlı ilişkiler — JSON'dan liste_id
  if (tip === "ListeYetkilisi" || tip === "ListeBirimi") {
    const listeId =
      jsonAlan<string>(a.yeni_veri, "liste_id") ??
      jsonAlan<string>(a.eski_veri, "liste_id") ??
      null;
    if (!listeId) return null;
    const l = baglam.liste.get(listeId);
    return {
      proje: l ? projeOzeti(listeId, baglam) : null,
      liste: l ? { id: l.id, ad: l.ad } : { id: listeId, ad: null },
      kart: null,
    };
  }

  // Kart-bağlı kayıtlar (Yorum, Eklenti, KontrolListesi, KartEtiket,
  // KartYetkilisi, KartBirimi) — JSON'dan kart_id
  let kartId: string | null = null;
  if (KART_ID_ICEREN_TIPLER.includes(tip as never)) {
    kartId =
      jsonAlan<string>(a.yeni_veri, "kart_id") ??
      jsonAlan<string>(a.eski_veri, "kart_id") ??
      null;
  } else if (tip === "KontrolMaddesi") {
    // KontrolMaddesi → kontrol_listesi_id → kart_id (dolaylı)
    const klId =
      jsonAlan<string>(a.yeni_veri, "kontrol_listesi_id") ??
      jsonAlan<string>(a.eski_veri, "kontrol_listesi_id") ??
      null;
    if (klId) kartId = baglam.kontrolListesi.get(klId) ?? null;
  }

  if (!kartId) return null;
  const k = baglam.kart.get(kartId);
  if (!k) {
    return {
      proje: null,
      liste: null,
      kart: { id: kartId, baslik: null },
    };
  }
  const l = baglam.liste.get(k.liste_id);
  return {
    proje: projeOzeti(k.liste_id, baglam),
    liste: l ? { id: l.id, ad: l.ad } : null,
    kart: { id: k.id, baslik: k.baslik },
  };
}

// =====================================================================
// aktiviteOzetle — kaynak_tip → uygun mesaj üreticisi router'ı
// =====================================================================

export function aktiviteOzetle(
  a: HamAktivite,
  kullaniciMap: Map<string, { id: string; ad: string; soyad: string }>,
  etiketMap: Map<string, { id: string; ad: string; renk: string }>,
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
  birimMap: Map<string, string>,
  idMaplar: IdMaplar,
  baglamMaplari: BaglamMaplari,
  yorumMentionKisiMap: MentionKisiMap,
): AktiviteOzeti {
  const islem = (
    a.islem === "CREATE" || a.islem === "UPDATE" || a.islem === "DELETE"
      ? a.islem
      : "UPDATE"
  ) as AktiviteOzeti["islem"];

  const kullanici = a.kullanici_id
    ? kullaniciMap.get(a.kullanici_id) ?? null
    : null;

  const degisiklikler =
    islem === "UPDATE" ? degisiklikleriHazirla(a, idMaplar) : null;

  const baglam = baglamCoz(a, baglamMaplari);

  const ortak = {
    id: a.id.toString(),
    zaman: a.zaman,
    kullanici,
    islem,
    kaynak_id: a.kaynak_id,
    degisiklikler,
    baglam,
  };

  switch (a.kaynak_tip) {
    case "Proje":
      return { ...ortak, ...projeMesaji(a, islem) };
    case "Liste":
      return { ...ortak, ...listeMesaji(a, islem) };
    case "Kart":
      return { ...ortak, ...kartMesaji(a, islem) };
    case "Yorum":
      return { ...ortak, ...yorumMesaji(a, islem, yorumMentionKisiMap) };
    case "Eklenti":
      return { ...ortak, ...eklentiMesaji(a, islem) };
    case "Dosya":
      // ADR-0028 — yeni Dosya modeli; eklentiMesaji ile aynı kategori/cümle
      // (UI ve translation parite). Backfill sonrası eski Eklenti event'leri
      // de bu üretici akışa düştüğünde aynı görünür.
      return { ...ortak, ...eklentiMesaji(a, islem) };
    case "DosyaSurumu":
      return { ...ortak, ...dosyaSurumuMesaji(a, islem) };
    case "DosyaBaglantisi":
      return { ...ortak, ...dosyaBaglantisiMesaji(a, islem) };
    case "KontrolListesi":
      return { ...ortak, ...kontrolListesiMesaji(a, islem) };
    case "KontrolMaddesi":
      return { ...ortak, ...kontrolMaddesiMesaji(a, islem) };
    case "KartEtiket":
      return { ...ortak, ...kartEtiketMesaji(a, islem, etiketMap) };
    case "KartYetkilisi":
      return { ...ortak, ...kartYetkilisiMesaji(a, islem, atananMap) };
    case "KartBirimi":
      return { ...ortak, ...hedefBirimMesaji(a, islem, birimMap) };
    case "Etiket":
      return { ...ortak, ...etiketTanimMesaji(a, islem) };
    case "ProjeYetkilisi":
      return { ...ortak, ...projeYetkilisiMesaji(a, islem, atananMap) };
    case "ProjeBirimi":
      return { ...ortak, ...projeBirimiMesaji(a, islem, birimMap) };
    case "ListeYetkilisi":
      return { ...ortak, ...listeYetkilisiMesaji(a, islem, atananMap) };
    case "ListeBirimi":
      return { ...ortak, ...listeBirimiMesaji(a, islem, birimMap) };
    default: {
      const idari = idariMesaj(a, islem);
      if (idari) return { ...ortak, ...idari };
      return {
        ...ortak,
        kategori: "diger",
        mesaj: `${a.kaynak_tip} kaydını ${islemAdi(islem)}`,
        detay: null,
      };
    }
  }
}
