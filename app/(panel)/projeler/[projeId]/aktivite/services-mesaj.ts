// Sprint 3 / S3-1 — Aktivite servisi parça dosyası: TR mesaj üreticileri.
// ADR-0032 mega dosya bölmesi.
//
// İçerik: kaynak_tip + islem → kullanıcıya gösterilen TR mesaj üretimi.
// 14 mesaj fonksiyonu: proje, liste, kart, yorum, eklenti, dosya sürüm,
// dosya bağlantı, kontrol listesi/maddesi, kart etiket, kart yetkilisi,
// hedef birim, etiket tanım, proje yetkilisi, proje birimi, liste yetkilisi,
// liste birimi.

import type { MentionKisiMap } from "@/lib/mention-format";
import { mentionliMetniGorunurYap } from "@/lib/mention-server";
import {
  type AktiviteOzeti,
  type HamAktivite,
  jsonAlan,
  kisalt,
} from "./services-ortak";

// =====================================================================
// Kart alan etiketleri — kart UPDATE mesajında "ne değiştirdi" özeti
// =====================================================================

// Why: silindi_mi/arsiv_mi diff'in başında özel mesajlara ayrıştırılır
// (çöp kutusuna taşıdı / geri yükledi / arşivledi / arşivden çıkardı), bu
// yüzden bu eşlemenin içinde yer almazlar — aksi halde generic "değiştirdi"
// fallback'ine düşme riski olur.
export const KART_ALAN_ETIKETI: Record<string, string> = {
  baslik: "kartın başlığı",
  // ADR-0023 — Tiptap doc + denormalize plaintext. Audit mesajında plaintext
  // değişikliğini referans alıyoruz; doc her edit'te değişir ama "anlamlı"
  // değişim metnin kendisi (ikisi tutarlı: services tek bir transaction'da
  // her ikisini birden yazar). aciklama_dokuman değişimi mesajdan çıkarıldı
  // (her keypress audit gibi gürültü olur).
  aciklama_metin: "kartın açıklaması",
  bitis: "kartın bitiş tarihi",
  baslangic: "kartın başlangıç tarihi",
  kapak_renk: "kartın kapak rengi",
  kapak_dosya_id: "kartın kapak görseli",
};

// =====================================================================
// İşlem adı — generic fallback için
// =====================================================================

export function islemAdi(i: "CREATE" | "UPDATE" | "DELETE"): string {
  return i === "CREATE" ? "ekledi" : i === "UPDATE" ? "güncelledi" : "sildi";
}

// =====================================================================
// Proje kendisinin CRUD'u — proje aktivite logu kapsamında.
// =====================================================================

export function projeMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "proje", mesaj: "projeyi oluşturdu", detay: ad };
  }
  if (islem === "DELETE") {
    return { kategori: "proje", mesaj: "projeyi sildi", detay: ad };
  }
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  const yeniArsiv = jsonAlan<boolean>(a.yeni_veri, "arsiv_mi");
  if (diff?.silindi_mi) {
    const yeni = diff.silindi_mi.yeni;
    return {
      kategori: "proje",
      mesaj: yeni ? "projeyi çöp kutusuna taşıdı" : "projeyi geri yükledi",
      detay: ad,
    };
  }
  if (diff === null && yeniSilindi === true) {
    return {
      kategori: "proje",
      mesaj: "projeyi çöp kutusuna taşıdı",
      detay: ad,
    };
  }
  if (diff?.arsiv_mi) {
    const yeni = diff.arsiv_mi.yeni;
    return {
      kategori: "proje",
      mesaj: yeni ? "projeyi arşivledi" : "projeyi arşivden çıkardı",
      detay: ad,
    };
  }
  if (diff === null && yeniArsiv === true) {
    return { kategori: "proje", mesaj: "projeyi arşivledi", detay: ad };
  }
  if (diff?.ad) {
    return {
      kategori: "proje",
      mesaj: "projenin adını değiştirdi",
      detay: ad,
    };
  }
  if (diff?.aciklama) {
    return {
      kategori: "proje",
      mesaj: "projenin açıklamasını değiştirdi",
      detay: ad,
    };
  }
  if (diff?.yildiz_mi) {
    const yeni = diff.yildiz_mi.yeni;
    return {
      kategori: "proje",
      mesaj: yeni ? "projeyi yıldızladı" : "projenin yıldızını kaldırdı",
      detay: ad,
    };
  }
  if (diff?.kapak_renk || diff?.simge) {
    return {
      kategori: "proje",
      mesaj: "projenin görünümünü değiştirdi",
      detay: ad,
    };
  }
  return { kategori: "proje", mesaj: "projeyi güncelledi", detay: ad };
}

// =====================================================================
// Liste — proje altındaki kanban listesi.
// =====================================================================

export function listeMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "liste", mesaj: "liste ekledi", detay: ad };
  }
  if (islem === "DELETE") {
    return { kategori: "liste", mesaj: "listeyi sildi", detay: ad };
  }
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  const yeniArsiv = jsonAlan<boolean>(a.yeni_veri, "arsiv_mi");
  if (diff?.silindi_mi) {
    const yeni = diff.silindi_mi.yeni;
    return {
      kategori: "liste",
      mesaj: yeni ? "listeyi çöp kutusuna taşıdı" : "listeyi geri yükledi",
      detay: ad,
    };
  }
  if (diff === null && yeniSilindi === true) {
    return {
      kategori: "liste",
      mesaj: "listeyi çöp kutusuna taşıdı",
      detay: ad,
    };
  }
  if (diff?.arsiv_mi) {
    const yeni = diff.arsiv_mi.yeni;
    return {
      kategori: "liste",
      mesaj: yeni ? "listeyi arşivledi" : "listeyi arşivden çıkardı",
      detay: ad,
    };
  }
  if (diff === null && yeniArsiv === true) {
    return { kategori: "liste", mesaj: "listeyi arşivledi", detay: ad };
  }
  // Sıra-only güncelleme — drag-drop gürültüsünü temiz mesaja çevir.
  const alanlar = diff ? Object.keys(diff) : [];
  const yardimciAlanlar = new Set(["sira", "guncelleme_zamani"]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return {
        kategori: "liste",
        mesaj: "listeyi yeniden sıraladı",
        detay: ad,
      };
    }
  }
  if (diff?.ad) {
    return { kategori: "liste", mesaj: "listenin adını değiştirdi", detay: ad };
  }
  return { kategori: "liste", mesaj: "listeyi güncelledi", detay: ad };
}

// =====================================================================
// Etiket tanımı (proje düzeyi)
// =====================================================================

export function etiketTanimMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return { kategori: "etiket", mesaj: "etiket tanımı ekledi", detay: ad };
  }
  if (islem === "DELETE") {
    return { kategori: "etiket", mesaj: "etiket tanımını sildi", detay: ad };
  }
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  if (diff?.ad) {
    return {
      kategori: "etiket",
      mesaj: "etiketin adını değiştirdi",
      detay: ad,
    };
  }
  if (diff?.renk) {
    return {
      kategori: "etiket",
      mesaj: "etiketin rengini değiştirdi",
      detay: ad,
    };
  }
  return { kategori: "etiket", mesaj: "etiketi güncelledi", detay: ad };
}

// =====================================================================
// Proje yetkilisi (kullanıcı) — KartYetkilisi'yle aynı görsel kategori.
// =====================================================================

export function projeYetkilisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "kullanici_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "kullanici_id");
  const uId = yeniId ?? eskiId ?? null;
  const u = uId ? atananMap.get(uId) : null;
  const ad = u ? `${u.ad} ${u.soyad}` : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return {
      kategori: "yetkili",
      mesaj: "projeye kullanıcı yetkilisi ekledi",
      detay: ad,
    };
  }
  return {
    kategori: "yetkili",
    mesaj: "projeden kullanıcı yetkilisini kaldırdı",
    detay: ad,
  };
}

// =====================================================================
// Proje birimi — KartBirimi'yle aynı görsel kategori (hedef-birim).
// =====================================================================

export function projeBirimiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  birimMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "birim_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "birim_id");
  const birimId = yeniId ?? eskiId ?? null;
  const ad = birimId ? birimMap.get(birimId) ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return {
      kategori: "hedef-birim",
      mesaj: "projeye birim yetkilisi ekledi",
      detay: ad,
    };
  }
  return {
    kategori: "hedef-birim",
    mesaj: "projeden birim yetkilisini kaldırdı",
    detay: ad,
  };
}

// =====================================================================
// Liste yetkilisi (kullanıcı).
// =====================================================================

export function listeYetkilisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "kullanici_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "kullanici_id");
  const uId = yeniId ?? eskiId ?? null;
  const u = uId ? atananMap.get(uId) : null;
  const ad = u ? `${u.ad} ${u.soyad}` : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return {
      kategori: "yetkili",
      mesaj: "listeye kullanıcı yetkilisi ekledi",
      detay: ad,
    };
  }
  return {
    kategori: "yetkili",
    mesaj: "listeden kullanıcı yetkilisini kaldırdı",
    detay: ad,
  };
}

// =====================================================================
// Liste birimi.
// =====================================================================

export function listeBirimiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  birimMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "birim_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "birim_id");
  const birimId = yeniId ?? eskiId ?? null;
  const ad = birimId ? birimMap.get(birimId) ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return {
      kategori: "hedef-birim",
      mesaj: "listeye birim yetkilisi ekledi",
      detay: ad,
    };
  }
  return {
    kategori: "hedef-birim",
    mesaj: "listeden birim yetkilisini kaldırdı",
    detay: ad,
  };
}

// =====================================================================
// Kart — CRUD + UPDATE diff'inden anlam çıkarma (silme/arşiv/tamamlama/
// liste değişikliği/sıralama/alan-bazlı)
// =====================================================================

export function kartMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  if (islem === "CREATE") {
    return {
      kategori: "kart",
      mesaj: "kartı oluşturdu",
      detay: jsonAlan<string>(a.yeni_veri, "baslik") ?? null,
    };
  }
  if (islem === "DELETE") {
    return {
      kategori: "kart",
      mesaj: "kartı sildi",
      detay: jsonAlan<string>(a.eski_veri, "baslik") ?? null,
    };
  }
  // UPDATE — diff'e bak, hangi alan değişti
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  // Why: silme/geri yükleme mesajı eski VE yeni değerin birlikte değiştiğini
  // gerektirir. Diff varsa dümdüz oradan oku. Diff yoksa (audit middleware
  // findUnique başarısızlığı, vb.) son çare olarak yeni_veri.silindi_mi=true
  // tek yönlü "silme" tespitine izin ver — `silindi_mi: false` her kartın
  // varsayılan alan değeri olduğundan bu durumdan "geri yükledi" SONUCU
  // ÇIKARILAMAZ ve bu savunma yola uygulanmaz (yanlış pozitif yaratır).
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  const yeniArsiv = jsonAlan<boolean>(a.yeni_veri, "arsiv_mi");
  const yeniTamam = jsonAlan<boolean>(a.yeni_veri, "tamamlandi_mi");
  if (diff?.silindi_mi) {
    const yeni = diff.silindi_mi.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı çöp kutusuna taşıdı" : "kartı geri yükledi",
      detay: null,
    };
  }
  if (diff === null && yeniSilindi === true) {
    return {
      kategori: "kart",
      mesaj: "kartı çöp kutusuna taşıdı",
      detay: null,
    };
  }
  if (diff?.arsiv_mi) {
    const yeni = diff.arsiv_mi.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı arşivledi" : "kartı arşivden çıkardı",
      detay: null,
    };
  }
  if (diff === null && yeniArsiv === true) {
    return { kategori: "kart", mesaj: "kartı arşivledi", detay: null };
  }
  if (diff?.tamamlandi_mi) {
    const yeni = diff.tamamlandi_mi.yeni;
    return {
      kategori: "kart",
      mesaj: yeni ? "kartı tamamladı" : "kartı tekrar açtı",
      detay: null,
    };
  }
  if (diff === null && yeniTamam === true) {
    return { kategori: "kart", mesaj: "kartı tamamladı", detay: null };
  }
  if (!diff) {
    return { kategori: "kart", mesaj: "kartı güncelledi", detay: null };
  }
  const alanlar = Object.keys(diff);
  if (alanlar.includes("liste_id")) {
    return {
      kategori: "kart",
      mesaj: "kartın listesini değiştirdi",
      detay: null,
    };
  }
  // Sıra-only güncelleme — drag-drop gürültüsünü temiz mesaja çevir.
  // tamamlanma_zamani / tamamlayan_id, tamamlandi_mi yan etkisi olarak
  // yazılır — diff'te kalsa bile yardımcı kabul edilir.
  const yardimciAlanlar = new Set([
    "sira",
    "guncelleme_zamani",
    "tamamlanma_zamani",
    "tamamlayan_id",
  ]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return { kategori: "kart", mesaj: "kartı yeniden sıraladı", detay: null };
    }
  }
  // KART_ALAN_ETIKETI'nde tanımlı ilk anlamlı alanı seç. null → değer / değer →
  // null geçişi anlamsal olarak ekleme/kaldırma; daha açık mesaj üret.
  // noUncheckedIndexedAccess: lookup `string | undefined` döndürür → null guard.
  for (const alan of alanlar) {
    const etiket = KART_ALAN_ETIKETI[alan];
    if (!etiket) continue;
    const eski = diff[alan]?.eski;
    const yeni = diff[alan]?.yeni;
    const eskiBos = eski === null || eski === undefined || eski === "";
    const yeniBos = yeni === null || yeni === undefined || yeni === "";
    if (eskiBos && !yeniBos) {
      return { kategori: "kart", mesaj: `${etiket} ekledi`, detay: null };
    }
    if (!eskiBos && yeniBos) {
      return { kategori: "kart", mesaj: `${etiket} kaldırdı`, detay: null };
    }
    return { kategori: "kart", mesaj: `${etiket} değiştirdi`, detay: null };
  }
  return { kategori: "kart", mesaj: "kartı güncelledi", detay: null };
}

// =====================================================================
// Yorum
// =====================================================================

export function yorumMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  mentionKisiMap: MentionKisiMap,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  if (islem === "CREATE") {
    const ic = jsonAlan<string>(a.yeni_veri, "icerik") ?? "";
    return {
      kategori: "yorum",
      mesaj: "yorum yazdı",
      detay: kisalt(mentionliMetniGorunurYap(ic, mentionKisiMap), 80),
    };
  }
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  // Yorum tek yönlü silinir — UI'da geri yükleme yok, bu yüzden silindi_mi
  // değişikliği = silme. Diff null savunması da yeni_veri'den tespit eder.
  if (diff?.silindi_mi?.yeni === true) {
    return { kategori: "yorum", mesaj: "yorumunu sildi", detay: null };
  }
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  if (diff === null && yeniSilindi === true) {
    return { kategori: "yorum", mesaj: "yorumunu sildi", detay: null };
  }
  if (diff?.icerik) {
    return { kategori: "yorum", mesaj: "yorumunu düzenledi", detay: null };
  }
  if (islem === "DELETE") {
    return { kategori: "yorum", mesaj: "yorumunu sildi", detay: null };
  }
  return { kategori: "yorum", mesaj: "yorumunu güncelledi", detay: null };
}

// =====================================================================
// Eklenti / Dosya — ADR-0028 sonrası DosyaSurumu/DosyaBaglantisi de buraya
// =====================================================================

export function eklentiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  if (islem === "CREATE") {
    return {
      kategori: "eklenti",
      mesaj: "dosya yükledi",
      detay: jsonAlan<string>(a.yeni_veri, "ad") ?? null,
    };
  }
  // soft delete — diff varsa ondan, yoksa yeni_veri'den tespit et (savunma)
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  const yeniSilindi = jsonAlan<boolean>(a.yeni_veri, "silindi_mi");
  if (
    diff?.silindi_mi?.yeni === true ||
    islem === "DELETE" ||
    (diff === null && yeniSilindi === true)
  ) {
    return {
      kategori: "eklenti",
      mesaj: "dosyayı sildi",
      detay:
        jsonAlan<string>(a.eski_veri, "ad") ??
        jsonAlan<string>(a.yeni_veri, "ad") ??
        null,
    };
  }
  // ADR-0028 — diff bazlı zenginleştirilmiş UPDATE mesajları. Aktivite akışı
  // "dosyayı güncelledi" gibi belirsiz cümle yerine ne değiştiğini gösterir.
  const ad = jsonAlan<string>(a.yeni_veri, "ad") ?? null;

  if (diff?.silindi_mi?.yeni === false) {
    return {
      kategori: "eklenti",
      mesaj: "dosyayı geri yükledi",
      detay: ad,
    };
  }
  if (diff?.ad) {
    return {
      kategori: "eklenti",
      mesaj: "dosyanın adını değiştirdi",
      detay: ad,
    };
  }
  if (diff?.aciklama) {
    return {
      kategori: "eklenti",
      mesaj: "dosyanın açıklamasını güncelledi",
      detay: ad,
    };
  }
  if (diff?.gizlilik) {
    const yeniGizlilik = String(diff.gizlilik.yeni ?? "").toUpperCase();
    const gizlilikEtiket =
      yeniGizlilik === "GIZLI"
        ? "Gizli"
        : yeniGizlilik === "HASSAS"
          ? "Hassas"
          : "Normal";
    return {
      kategori: "eklenti",
      mesaj: `dosyanın gizliliğini ${gizlilikEtiket} olarak ayarladı`,
      detay: ad,
    };
  }
  if (diff?.aktif_surum_id) {
    return {
      kategori: "eklenti",
      mesaj: "dosyanın aktif sürümünü değiştirdi",
      detay: ad,
    };
  }
  if (diff?.indirme_sayisi || diff?.son_indirme_zamani) {
    // İndirme sayacı güncellemesi kullanıcı eylemi olarak gürültü; idari mesaj.
    return { kategori: "eklenti", mesaj: "dosyayı indirdi", detay: ad };
  }
  return { kategori: "eklenti", mesaj: "dosyayı güncelledi", detay: ad };
}

// ADR-0028 — Dosya sürüm ve bağlantı aktivite mesajları.
export function dosyaSurumuMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const surumNo = jsonAlan<number>(a.yeni_veri, "surum_no");
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return {
      kategori: "eklenti",
      mesaj: surumNo
        ? `dosyanın yeni sürümünü (v${surumNo}) yükledi`
        : "dosyanın yeni sürümünü yükledi",
      detay: ad,
    };
  }
  return {
    kategori: "eklenti",
    mesaj: "dosya sürümünü güncelledi",
    detay: ad,
  };
}

export function dosyaBaglantisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const kaynakTip =
    jsonAlan<string>(a.yeni_veri, "kaynak_tip") ??
    jsonAlan<string>(a.eski_veri, "kaynak_tip") ??
    null;
  // -e durum ekli (yönelme): "karta", "listeye", "projeye"
  const yonelme =
    kaynakTip === "KART"
      ? "karta"
      : kaynakTip === "LISTE"
        ? "listeye"
        : kaynakTip === "PROJE"
          ? "projeye"
          : "kaynağa";
  // -ın iyelik eki: "kartın", "listenin", "projenin"
  const iyelik =
    kaynakTip === "KART"
      ? "kartın"
      : kaynakTip === "LISTE"
        ? "listenin"
        : kaynakTip === "PROJE"
          ? "projenin"
          : "kaynağın";
  if (islem === "CREATE") {
    return {
      kategori: "eklenti",
      mesaj: `dosyayı ${yonelme} bağladı`,
      detay: null,
    };
  }
  if (islem === "DELETE") {
    return {
      kategori: "eklenti",
      mesaj: `dosyanın ${iyelik} bağlantısını kaldırdı`,
      detay: null,
    };
  }
  return {
    kategori: "eklenti",
    mesaj: "dosya bağlantısını güncelledi",
    detay: null,
  };
}

// =====================================================================
// Kontrol listesi / maddesi
// =====================================================================

export function kontrolListesiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const ad =
    jsonAlan<string>(a.yeni_veri, "ad") ??
    jsonAlan<string>(a.eski_veri, "ad") ??
    null;
  if (islem === "CREATE") {
    return {
      kategori: "kontrol-listesi",
      mesaj: "kontrol listesi ekledi",
      detay: ad,
    };
  }
  if (islem === "DELETE") {
    return {
      kategori: "kontrol-listesi",
      mesaj: "kontrol listesini sildi",
      detay: ad,
    };
  }
  // Why: drag-drop sıralama her hareket için audit UPDATE üretir; "düzenledi"
  // mesajı yanıltıcı. Sıra-only diff ayrı mesaj alır; tamamlanma /
  // ad değişikliği için ayrı spesifik mesajlar.
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  const yeniTamam = jsonAlan<boolean>(a.yeni_veri, "tamamlandi_mi");
  if (diff?.tamamlandi_mi) {
    const yeni = diff.tamamlandi_mi.yeni;
    return {
      kategori: "kontrol-listesi",
      mesaj: yeni
        ? "kontrol listesini tamamladı"
        : "kontrol listesini tekrar açtı",
      detay: ad,
    };
  }
  if (diff === null && yeniTamam === true) {
    return {
      kategori: "kontrol-listesi",
      mesaj: "kontrol listesini tamamladı",
      detay: ad,
    };
  }
  const alanlar = diff ? Object.keys(diff) : [];
  const yardimciAlanlar = new Set([
    "sira",
    "guncelleme_zamani",
    "tamamlanma_zamani",
    "tamamlayan_id",
  ]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return {
        kategori: "kontrol-listesi",
        mesaj: "kontrol listesini yeniden sıraladı",
        detay: ad,
      };
    }
  }
  if (diff?.ad) {
    return {
      kategori: "kontrol-listesi",
      mesaj: "kontrol listesinin adını değiştirdi",
      detay: ad,
    };
  }
  return {
    kategori: "kontrol-listesi",
    mesaj: "kontrol listesini düzenledi",
    detay: ad,
  };
}

export function kontrolMaddesiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const metin =
    jsonAlan<string>(a.yeni_veri, "metin") ??
    jsonAlan<string>(a.eski_veri, "metin") ??
    null;
  if (islem === "CREATE") {
    return {
      kategori: "kontrol-maddesi",
      mesaj: "kontrol maddesi ekledi",
      detay: metin,
    };
  }
  if (islem === "DELETE") {
    return {
      kategori: "kontrol-maddesi",
      mesaj: "kontrol maddesini sildi",
      detay: metin,
    };
  }
  // UPDATE — tamamlandi_mi'ye özel mesaj (en güçlü sinyal, önce gelir)
  const diff = a.diff as Record<
    string,
    { eski: unknown; yeni: unknown }
  > | null;
  if (diff?.tamamlandi_mi) {
    const yeni = diff.tamamlandi_mi.yeni === true;
    return {
      kategori: "kontrol-maddesi",
      mesaj: yeni
        ? "kontrol maddesini tamamladı"
        : "kontrol maddesini geri açtı",
      detay: metin,
    };
  }
  // Why: drag-drop ile sıra her hareketinde UPDATE üretir; "güncelledi" mesajı
  // yanıltıcı. Sıra-only diff için ayrı mesaj.
  const alanlar = diff ? Object.keys(diff) : [];
  const yardimciAlanlar = new Set([
    "sira",
    "guncelleme_zamani",
    "tamamlama_zamani",
    "tamamlayan_id",
  ]);
  if (alanlar.length > 0 && alanlar.every((k) => yardimciAlanlar.has(k))) {
    if (alanlar.includes("sira")) {
      return {
        kategori: "kontrol-maddesi",
        mesaj: "kontrol maddesini yeniden sıraladı",
        detay: metin,
      };
    }
  }
  if (diff?.metin) {
    return {
      kategori: "kontrol-maddesi",
      mesaj: "kontrol maddesinin metnini değiştirdi",
      detay: metin,
    };
  }
  if (diff?.atanan_id) {
    const yeni = diff.atanan_id.yeni;
    if (yeni === null || yeni === undefined) {
      return {
        kategori: "kontrol-maddesi",
        mesaj: "kontrol maddesinin sorumlusunu kaldırdı",
        detay: metin,
      };
    }
    return {
      kategori: "kontrol-maddesi",
      mesaj: "kontrol maddesinin sorumlusunu değiştirdi",
      detay: metin,
    };
  }
  if (diff?.bitis) {
    const yeni = diff.bitis.yeni;
    if (yeni === null || yeni === undefined) {
      return {
        kategori: "kontrol-maddesi",
        mesaj: "kontrol maddesinin bitiş tarihini kaldırdı",
        detay: metin,
      };
    }
    return {
      kategori: "kontrol-maddesi",
      mesaj: "kontrol maddesinin bitiş tarihini değiştirdi",
      detay: metin,
    };
  }
  return {
    kategori: "kontrol-maddesi",
    mesaj: "kontrol maddesini güncelledi",
    detay: metin,
  };
}

// =====================================================================
// Composite-PK ilişki tabloları (KartEtiket / KartYetkilisi / KartBirimi)
// =====================================================================

// Why: Composite-PK ilişki tablolarında (KartYetkilisi/KartEtiket/KartBirimi)
// idempotent ekleme için `upsert` kullanılıyor. Audit middleware geçmişte
// upsert'i UPDATE olarak loglardı; bu yüzden yeni ekleme bile "kaldırıldı"
// görünüyordu. Bu fonksiyonlar artık islem yerine veri varlığına bakar:
// yeni_veri'de kayıt id'si varsa ekleme, yalnız eski_veri'de varsa kaldırma.
// Audit middleware artık doğru CREATE yazıyor (lib/audit-middleware.ts), ama
// bu kontrol geçmiş yanlış kayıtları da otomatik düzeltir.
export function kartEtiketMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  etiketMap: Map<string, { id: string; ad: string; renk: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "etiket_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "etiket_id");
  const etiketId = yeniId ?? eskiId ?? null;
  const ad = etiketId ? etiketMap.get(etiketId)?.ad ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "etiket", mesaj: "etiket ekledi", detay: ad };
  }
  return { kategori: "etiket", mesaj: "etiketi kaldırdı", detay: ad };
}

export function kartYetkilisiMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  atananMap: Map<string, { id: string; ad: string; soyad: string }>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "kullanici_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "kullanici_id");
  const uId = yeniId ?? eskiId ?? null;
  const u = uId ? atananMap.get(uId) : null;
  const ad = u ? `${u.ad} ${u.soyad}` : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "yetkili", mesaj: "yetki verdi", detay: ad };
  }
  return { kategori: "yetkili", mesaj: "yetkiyi kaldırdı", detay: ad };
}

export function hedefBirimMesaji(
  a: HamAktivite,
  islem: AktiviteOzeti["islem"],
  birimMap: Map<string, string>,
): Pick<AktiviteOzeti, "kategori" | "mesaj" | "detay"> {
  const yeniId = jsonAlan<string>(a.yeni_veri, "birim_id");
  const eskiId = jsonAlan<string>(a.eski_veri, "birim_id");
  const birimId = yeniId ?? eskiId ?? null;
  const ad = birimId ? birimMap.get(birimId) ?? null : null;
  const eklendi = yeniId ? true : islem === "CREATE";
  if (eklendi) {
    return { kategori: "hedef-birim", mesaj: "birim ekledi", detay: ad };
  }
  return { kategori: "hedef-birim", mesaj: "birimi kaldırdı", detay: ad };
}
