// ADR-0014: Granüler izin kataloğu — saf veri, server/client/test ortak.
// Bu modül `@/auth` veya Prisma client (runtime) yüklemez; sadece
// `@prisma/client`'tan enum import eder. Server-only iş mantığı
// `lib/permissions.ts`'tedir.

import { IzinKategorisi } from "@prisma/client";
import { ROL_KODLARI } from "./roller";

// ============================================================
// İzin kodları — modül × alt-kategori × aksiyon
// Konvansiyon: <modul>:<aksiyon> veya <modul>.<altkategori>:<aksiyon>
// ============================================================

export const IZIN_KODLARI = {
  // ─────────── PROJE ───────────
  PROJE_OLUSTUR: "proje:olustur",
  PROJE_AD_DUZENLE: "proje:duzenle-ad",
  PROJE_ACIKLAMA_DUZENLE: "proje:duzenle-aciklama",
  PROJE_KAPAK_RENK: "proje:duzenle-kapak-renk",
  PROJE_KAPAK_IKON: "proje:duzenle-kapak-ikon",
  PROJE_YILDIZLA: "proje:yildizla",
  PROJE_ARSIVLE: "proje:arsivle",
  PROJE_SIL: "proje:sil",
  PROJE_GERI_YUKLE: "proje:geri-yukle",
  PROJE_SIRALA: "proje:sirala",

  // ─────────── PROJE / Yetkili ───────────
  PROJE_YETKILI_LISTELE: "proje.yetkili:listele",
  PROJE_YETKILI_KISI_ATA: "proje.yetkili:kisi-ata",
  PROJE_YETKILI_KISI_CIKAR: "proje.yetkili:kisi-cikar",
  PROJE_YETKILI_BIRIM_ATA: "proje.yetkili:birim-ata",
  PROJE_YETKILI_BIRIM_CIKAR: "proje.yetkili:birim-cikar",
  PROJE_YETKILI_DAVET_GONDER: "proje.yetkili:davet-gonder",

  // ─────────── LİSTE ───────────
  LISTE_OLUSTUR: "liste:olustur",
  LISTE_AD_DUZENLE: "liste:duzenle-ad",
  LISTE_SIRALA: "liste:sirala",
  LISTE_ARSIVLE: "liste:arsivle",
  LISTE_SIL: "liste:sil",
  LISTE_GERI_YUKLE: "liste:geri-yukle",

  // ─────────── LİSTE / Yetkili ───────────
  LISTE_YETKILI_LISTELE: "liste.yetkili:listele",
  LISTE_YETKILI_KISI_ATA: "liste.yetkili:kisi-ata",
  LISTE_YETKILI_KISI_CIKAR: "liste.yetkili:kisi-cikar",
  LISTE_YETKILI_BIRIM_ATA: "liste.yetkili:birim-ata",
  LISTE_YETKILI_BIRIM_CIKAR: "liste.yetkili:birim-cikar",

  // ─────────── KART (temel) ───────────
  KART_OLUSTUR: "kart:olustur",
  KART_BASLIK_DUZENLE: "kart:duzenle-baslik",
  KART_ACIKLAMA_DUZENLE: "kart:duzenle-aciklama",
  KART_TASI: "kart:tasi",
  KART_KOPYALA: "kart:kopyala",
  KART_ARSIVLE: "kart:arsivle",
  KART_SIL: "kart:sil",
  KART_GERI_YUKLE: "kart:geri-yukle",

  // ─────────── KART / Kapak ───────────
  KART_KAPAK_RENK: "kart.kapak:renk",
  KART_KAPAK_GORSEL: "kart.kapak:gorsel",

  // ─────────── KART / Tarih ───────────
  KART_TARIH_BASLANGIC: "kart.tarih:baslangic",
  KART_TARIH_BITIS: "kart.tarih:bitis",
  KART_TARIH_TAMAMLANDI: "kart.tarih:tamamlandi",

  // ─────────── KART / Etiket ───────────
  KART_ETIKET_OLUSTUR: "kart.etiket:olustur",
  KART_ETIKET_DUZENLE: "kart.etiket:duzenle",
  KART_ETIKET_SIL: "kart.etiket:sil",
  KART_ETIKET_ATA: "kart.etiket:ata",
  KART_ETIKET_CIKAR: "kart.etiket:cikar",

  // ─────────── KART / Yorum ───────────
  KART_YORUM_OKU: "kart.yorum:oku",
  KART_YORUM_YAZ: "kart.yorum:yaz",
  KART_YORUM_KENDI_DUZENLE: "kart.yorum:kendi-duzenle",
  KART_YORUM_KENDI_SIL: "kart.yorum:kendi-sil",
  KART_YORUM_BASKA_SIL: "kart.yorum:baska-sil",

  // ─────────── KART / Eklenti ───────────
  KART_EKLENTI_OKU: "kart.eklenti:oku",
  KART_EKLENTI_YUKLE: "kart.eklenti:yukle",
  KART_EKLENTI_INDIR: "kart.eklenti:indir",
  KART_EKLENTI_KENDI_SIL: "kart.eklenti:kendi-sil",
  KART_EKLENTI_BASKA_SIL: "kart.eklenti:baska-sil",

  // ─────────── KART / Kontrol Listesi ───────────
  KART_KONTROL_OLUSTUR: "kart.kontrol:olustur",
  KART_KONTROL_DUZENLE: "kart.kontrol:duzenle",
  KART_KONTROL_SIL: "kart.kontrol:sil",
  KART_KONTROL_MADDE_OLUSTUR: "kart.kontrol-madde:olustur",
  KART_KONTROL_MADDE_DUZENLE: "kart.kontrol-madde:duzenle",
  KART_KONTROL_MADDE_ISARETLE: "kart.kontrol-madde:isaretle",
  KART_KONTROL_MADDE_SIL: "kart.kontrol-madde:sil",

  // ─────────── KART / İlişki ───────────
  KART_ILISKI_KUR: "kart.iliski:kur",
  KART_ILISKI_KALDIR: "kart.iliski:kaldir",

  // ─────────── KART / Yetkili ───────────
  KART_YETKILI_LISTELE: "kart.yetkili:listele",
  KART_YETKILI_KISI_ATA: "kart.yetkili:kisi-ata",
  KART_YETKILI_KISI_CIKAR: "kart.yetkili:kisi-cikar",
  KART_YETKILI_BIRIM_ATA: "kart.yetkili:birim-ata",
  KART_YETKILI_BIRIM_CIKAR: "kart.yetkili:birim-cikar",

  // ─────────── KULLANICI ───────────
  KULLANICI_DAVET_GONDER: "kullanici.davet:gonder",
  KULLANICI_DAVET_IPTAL: "kullanici.davet:iptal",
  KULLANICI_DAVET_YENIDEN: "kullanici.davet:yeniden-gonder",
  KULLANICI_ONAYLA: "kullanici.onay:onayla",
  KULLANICI_REDDET: "kullanici.onay:reddet",
  KULLANICI_DUZENLE: "kullanici.yonetim:duzenle",
  KULLANICI_SIL: "kullanici.yonetim:sil",
  KULLANICI_GERI_YUKLE: "kullanici.yonetim:geri-yukle",
  KULLANICI_PAROLA_SIFIRLA: "kullanici.yonetim:parola-sifirla",

  // ─────────── BİRİM ───────────
  BIRIM_OLUSTUR: "birim:olustur",
  BIRIM_DUZENLE: "birim:duzenle",
  BIRIM_HIYERARSI: "birim:hiyerarsi",
  BIRIM_SIL: "birim:sil",
  BIRIM_GERI_YUKLE: "birim:geri-yukle",

  // ─────────── ROL & İZİN ───────────
  ROL_OLUSTUR: "rol:olustur",
  ROL_DUZENLE: "rol:duzenle",
  ROL_IZIN_ATA: "rol:izin-ata",
  ROL_COGALT: "rol:cogalt",
  ROL_SIL: "rol:sil",
  ROL_KULLANICIYA_ATA: "rol:kullaniciya-ata",

  // ─────────── DENETİM ───────────
  DENETIM_OKU: "audit:oku",
  DENETIM_DISA_AKTAR: "audit:disa-aktar",
  HATA_LOGU_OKU: "hata-logu:oku",
  HATA_LOGU_COZULDU_ISARETLE: "hata-logu:cozuldu-isaretle",

  // ─────────── AYAR (sistem) ───────────
  AYAR_KURUM_DUZENLE: "ayar:kurum-duzenle",
  AYAR_SISTEM_DUZENLE: "ayar:sistem-duzenle",

  // ─────────── ESKI KOD ALIAS'LARI (ADR-0014 geri uyum) ───────────
  // Bu isimler mevcut server action'larda hâlâ çağrılıyor. Değerleri
  // eski geniş izin string'i; runtime'da `izinKoduGenislet` (lib/permissions-eslesme)
  // üzerinden granüler izin kümesine açılır. Yeni kod yazarken doğrudan
  // granüler izin kullan (ör. KART_BASLIK_DUZENLE), bu alias'ları seçme.
  PROJE_DUZENLE: "proje:edit",
  PROJE_YETKILI_YONET: "proje:authorize",
  LISTE_DUZENLE: "liste:edit",
  KART_DUZENLE: "kart:edit",
  KULLANICI_DAVET: "user:invite",
  AYAR_DUZENLE: "settings:edit",
  BIRIM_YONET: "birim:manage",
  ROL_YONET: "rol:manage",
} as const;

export type IzinKodu = (typeof IZIN_KODLARI)[keyof typeof IZIN_KODLARI];

// Eski geri-uyum alias'ları — DB'ye seed edilmemeli, UI'da gösterilmemeli.
// `TUM_IZIN_KODLARI` bu set'tekileri hariç tutar.
const ESKI_ALIAS_KODLARI: ReadonlySet<string> = new Set([
  IZIN_KODLARI.PROJE_DUZENLE,
  IZIN_KODLARI.PROJE_YETKILI_YONET,
  IZIN_KODLARI.LISTE_DUZENLE,
  IZIN_KODLARI.KART_DUZENLE,
  IZIN_KODLARI.KULLANICI_DAVET,
  IZIN_KODLARI.AYAR_DUZENLE,
  IZIN_KODLARI.BIRIM_YONET,
  IZIN_KODLARI.ROL_YONET,
]);

export const TUM_IZIN_KODLARI: IzinKodu[] = Object.values(IZIN_KODLARI).filter(
  (k): k is IzinKodu => !ESKI_ALIAS_KODLARI.has(k),
);

// ============================================================
// Kategori → izin (DB enum) — UI üst-seviye accordion grup
// ============================================================

// Not: alias'lar (proje:edit vb.) bu haritada yok — sadece yeni granüler kodlar.
// `TUM_IZIN_KODLARI` üzerinden iterasyon yapan kodlar güvenli; alias kodları
// `izinKoduGenislet` ile granülere açıldığı için doğrudan kategori sorgusuna
// girmez.
export const IZIN_KATEGORI: Partial<Record<IzinKodu, IzinKategorisi>> = {
  // PROJE
  [IZIN_KODLARI.PROJE_OLUSTUR]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_AD_DUZENLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_ACIKLAMA_DUZENLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_KAPAK_RENK]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_KAPAK_IKON]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YILDIZLA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_ARSIVLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_SIL]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_GERI_YUKLE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_SIRALA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_LISTELE]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_KISI_ATA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR]: IzinKategorisi.PROJE,
  [IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER]: IzinKategorisi.PROJE,

  // LISTE
  [IZIN_KODLARI.LISTE_OLUSTUR]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_AD_DUZENLE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_SIRALA]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_ARSIVLE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_SIL]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_GERI_YUKLE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_LISTELE]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_KISI_ATA]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA]: IzinKategorisi.LISTE,
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR]: IzinKategorisi.LISTE,

  // KART (tüm alt-kategoriler)
  [IZIN_KODLARI.KART_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_BASLIK_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ACIKLAMA_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TASI]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KOPYALA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ARSIVLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_GERI_YUKLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KAPAK_RENK]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KAPAK_GORSEL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TARIH_BASLANGIC]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TARIH_BITIS]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_TARIH_TAMAMLANDI]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_ATA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ETIKET_CIKAR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_OKU]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_YAZ]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_KENDI_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YORUM_BASKA_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_OKU]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_YUKLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_INDIR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_KENDI_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_EKLENTI_BASKA_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_DUZENLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_KONTROL_MADDE_SIL]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ILISKI_KUR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_ILISKI_KALDIR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_LISTELE]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_KISI_ATA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_KISI_CIKAR]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_BIRIM_ATA]: IzinKategorisi.KART,
  [IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR]: IzinKategorisi.KART,

  // KULLANICI
  [IZIN_KODLARI.KULLANICI_DAVET_GONDER]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_DAVET_IPTAL]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_DAVET_YENIDEN]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_ONAYLA]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_REDDET]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_DUZENLE]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_SIL]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_GERI_YUKLE]: IzinKategorisi.KULLANICI,
  [IZIN_KODLARI.KULLANICI_PAROLA_SIFIRLA]: IzinKategorisi.KULLANICI,

  // BIRIM
  [IZIN_KODLARI.BIRIM_OLUSTUR]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_DUZENLE]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_HIYERARSI]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_SIL]: IzinKategorisi.BIRIM,
  [IZIN_KODLARI.BIRIM_GERI_YUKLE]: IzinKategorisi.BIRIM,

  // ROL
  [IZIN_KODLARI.ROL_OLUSTUR]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_DUZENLE]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_IZIN_ATA]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_COGALT]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_SIL]: IzinKategorisi.ROL,
  [IZIN_KODLARI.ROL_KULLANICIYA_ATA]: IzinKategorisi.ROL,

  // AUDIT
  [IZIN_KODLARI.DENETIM_OKU]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.DENETIM_DISA_AKTAR]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.HATA_LOGU_OKU]: IzinKategorisi.AUDIT,
  [IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE]: IzinKategorisi.AUDIT,

  // AYAR
  [IZIN_KODLARI.AYAR_KURUM_DUZENLE]: IzinKategorisi.AYAR,
  [IZIN_KODLARI.AYAR_SISTEM_DUZENLE]: IzinKategorisi.AYAR,
};

// ============================================================
// Alt-kategori (string) — UI accordion alt-grup başlığı
// ============================================================

export const IZIN_ALT_KATEGORI: Partial<Record<IzinKodu, string>> = {
  // PROJE / yetkili
  [IZIN_KODLARI.PROJE_YETKILI_LISTELE]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_KISI_ATA]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR]: "yetkili",
  [IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER]: "yetkili",

  // LISTE / yetkili
  [IZIN_KODLARI.LISTE_YETKILI_LISTELE]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_KISI_ATA]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA]: "yetkili",
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR]: "yetkili",

  // KART / kapak
  [IZIN_KODLARI.KART_KAPAK_RENK]: "kapak",
  [IZIN_KODLARI.KART_KAPAK_GORSEL]: "kapak",

  // KART / tarih
  [IZIN_KODLARI.KART_TARIH_BASLANGIC]: "tarih",
  [IZIN_KODLARI.KART_TARIH_BITIS]: "tarih",
  [IZIN_KODLARI.KART_TARIH_TAMAMLANDI]: "tarih",

  // KART / etiket
  [IZIN_KODLARI.KART_ETIKET_OLUSTUR]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_DUZENLE]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_SIL]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_ATA]: "etiket",
  [IZIN_KODLARI.KART_ETIKET_CIKAR]: "etiket",

  // KART / yorum
  [IZIN_KODLARI.KART_YORUM_OKU]: "yorum",
  [IZIN_KODLARI.KART_YORUM_YAZ]: "yorum",
  [IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE]: "yorum",
  [IZIN_KODLARI.KART_YORUM_KENDI_SIL]: "yorum",
  [IZIN_KODLARI.KART_YORUM_BASKA_SIL]: "yorum",

  // KART / eklenti
  [IZIN_KODLARI.KART_EKLENTI_OKU]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_YUKLE]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_INDIR]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_KENDI_SIL]: "eklenti",
  [IZIN_KODLARI.KART_EKLENTI_BASKA_SIL]: "eklenti",

  // KART / kontrol-listesi
  [IZIN_KODLARI.KART_KONTROL_OLUSTUR]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_DUZENLE]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_SIL]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_DUZENLE]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE]: "kontrol-listesi",
  [IZIN_KODLARI.KART_KONTROL_MADDE_SIL]: "kontrol-listesi",

  // KART / iliski
  [IZIN_KODLARI.KART_ILISKI_KUR]: "iliski",
  [IZIN_KODLARI.KART_ILISKI_KALDIR]: "iliski",

  // KART / yetkili
  [IZIN_KODLARI.KART_YETKILI_LISTELE]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_KISI_ATA]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_KISI_CIKAR]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_BIRIM_ATA]: "yetkili",
  [IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR]: "yetkili",

  // KULLANICI
  [IZIN_KODLARI.KULLANICI_DAVET_GONDER]: "davet",
  [IZIN_KODLARI.KULLANICI_DAVET_IPTAL]: "davet",
  [IZIN_KODLARI.KULLANICI_DAVET_YENIDEN]: "davet",
  [IZIN_KODLARI.KULLANICI_ONAYLA]: "onay",
  [IZIN_KODLARI.KULLANICI_REDDET]: "onay",
  [IZIN_KODLARI.KULLANICI_DUZENLE]: "yonetim",
  [IZIN_KODLARI.KULLANICI_SIL]: "yonetim",
  [IZIN_KODLARI.KULLANICI_GERI_YUKLE]: "yonetim",
  [IZIN_KODLARI.KULLANICI_PAROLA_SIFIRLA]: "yonetim",

  // AUDIT
  [IZIN_KODLARI.HATA_LOGU_OKU]: "hata",
  [IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE]: "hata",
};

// ============================================================
// UI başlıkları
// ============================================================

export const KATEGORI_BASLIKLARI: Record<IzinKategorisi, string> = {
  [IzinKategorisi.PROJE]: "Proje",
  [IzinKategorisi.LISTE]: "Liste",
  [IzinKategorisi.KART]: "Kart",
  [IzinKategorisi.KULLANICI]: "Kullanıcı",
  [IzinKategorisi.BIRIM]: "Birim",
  [IzinKategorisi.ROL]: "Rol & Yetki",
  [IzinKategorisi.AUDIT]: "Denetim",
  [IzinKategorisi.AYAR]: "Sistem Ayarları",
};

export const ALT_KATEGORI_BASLIKLARI: Record<string, string> = {
  yetkili: "Yetkili Kişi & Birim",
  kapak: "Kapak",
  tarih: "Tarih",
  etiket: "Etiket",
  yorum: "Yorum",
  eklenti: "Eklenti",
  "kontrol-listesi": "Kontrol Listesi",
  iliski: "Bağlantı / İlişki",
  davet: "Davet",
  onay: "Onay",
  yonetim: "Yönetim",
  hata: "Hata Logu",
};

// ============================================================
// İzin tanımları — Pusula jargonuyla, açıklayıcı
// ============================================================

// Not: alias'lar bu haritada yok.
export const IZIN_TANIMLARI: Partial<
  Record<IzinKodu, { ad: string; aciklama: string }>
> = {
  // ─────────── PROJE ───────────
  [IZIN_KODLARI.PROJE_OLUSTUR]: {
    ad: "Yeni Proje Aç",
    aciklama: "Sıfırdan yeni proje oluşturma",
  },
  [IZIN_KODLARI.PROJE_AD_DUZENLE]: {
    ad: "Proje Adı Düzenle",
    aciklama: "Mevcut projenin adını değiştirme",
  },
  [IZIN_KODLARI.PROJE_ACIKLAMA_DUZENLE]: {
    ad: "Proje Açıklaması Düzenle",
    aciklama: "Projenin açıklama metnini değiştirme",
  },
  [IZIN_KODLARI.PROJE_KAPAK_RENK]: {
    ad: "Proje Kapak Rengini Değiştir",
    aciklama: "Proje kartında görünen kapak rengini seçme/değiştirme",
  },
  [IZIN_KODLARI.PROJE_KAPAK_IKON]: {
    ad: "Proje Kapak İkonunu Değiştir",
    aciklama: "Proje kartında görünen ikonu seçme/değiştirme",
  },
  [IZIN_KODLARI.PROJE_YILDIZLA]: {
    ad: "Projeyi Favorile / Yıldızla",
    aciklama: "Projeyi kişisel yıldızlı listesine ekleme/çıkarma",
  },
  [IZIN_KODLARI.PROJE_ARSIVLE]: {
    ad: "Projeyi Arşivle",
    aciklama: "Projeyi arşive alma veya arşivden çıkarma",
  },
  [IZIN_KODLARI.PROJE_SIL]: {
    ad: "Projeyi Sil",
    aciklama: "Projeyi çöp kutusuna taşıma (geri yüklenebilir)",
  },
  [IZIN_KODLARI.PROJE_GERI_YUKLE]: {
    ad: "Silinmiş Projeyi Geri Yükle",
    aciklama: "Çöp kutusundaki projeyi geri yükleme",
  },
  [IZIN_KODLARI.PROJE_SIRALA]: {
    ad: "Proje Sırasını Değiştir",
    aciklama: "Proje listesinde sürükle-bırak ile sıralama",
  },

  // ─────────── PROJE / yetkili ───────────
  [IZIN_KODLARI.PROJE_YETKILI_LISTELE]: {
    ad: "Proje Yetkililerini Görüntüle",
    aciklama: "Projeye atanmış kişi ve birim listesini okuma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_KISI_ATA]: {
    ad: "Projeye Yetkili Kişi Ata",
    aciklama: "Projeye yeni yetkili kişi ekleme",
  },
  [IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR]: {
    ad: "Projeden Yetkili Kişi Çıkar",
    aciklama: "Projeden yetkili kişiyi kaldırma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA]: {
    ad: "Projeye Yetkili Birim Ekle",
    aciklama: "Projeye birim atayarak birim personelinin erişimini açma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR]: {
    ad: "Projeden Yetkili Birim Çıkar",
    aciklama: "Birimin proje erişimini kaldırma",
  },
  [IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER]: {
    ad: "Projeye Davet Gönder",
    aciklama:
      "Sisteme kayıtsız e-posta sahibine proje davetiyesi gönderme",
  },

  // ─────────── LİSTE ───────────
  [IZIN_KODLARI.LISTE_OLUSTUR]: {
    ad: "Liste / Sütun Oluştur",
    aciklama: "Proje içinde yeni liste (kanban sütunu) açma",
  },
  [IZIN_KODLARI.LISTE_AD_DUZENLE]: {
    ad: "Liste Adını Düzenle",
    aciklama: "Listenin başlığını değiştirme",
  },
  [IZIN_KODLARI.LISTE_SIRALA]: {
    ad: "Liste Sırasını Değiştir",
    aciklama: "Sürükle-bırak ile listeyi başka konuma taşıma",
  },
  [IZIN_KODLARI.LISTE_ARSIVLE]: {
    ad: "Listeyi Arşivle",
    aciklama: "Listeyi arşive alma veya arşivden çıkarma",
  },
  [IZIN_KODLARI.LISTE_SIL]: {
    ad: "Listeyi Sil",
    aciklama: "Listeyi çöp kutusuna taşıma (içindeki kartlarla birlikte)",
  },
  [IZIN_KODLARI.LISTE_GERI_YUKLE]: {
    ad: "Silinmiş Listeyi Geri Yükle",
    aciklama: "Çöp kutusundaki listeyi geri yükleme",
  },

  // ─────────── LİSTE / yetkili ───────────
  [IZIN_KODLARI.LISTE_YETKILI_LISTELE]: {
    ad: "Liste Yetkililerini Görüntüle",
    aciklama: "Listeye atanmış kişi ve birim listesini okuma",
  },
  [IZIN_KODLARI.LISTE_YETKILI_KISI_ATA]: {
    ad: "Listeye Yetkili Kişi Ata",
    aciklama: "Listeye yeni yetkili kişi ekleme",
  },
  [IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR]: {
    ad: "Listeden Yetkili Kişi Çıkar",
    aciklama: "Listeden yetkili kişiyi kaldırma",
  },
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA]: {
    ad: "Listeye Yetkili Birim Ekle",
    aciklama: "Listeye birim atayarak birim personelinin erişimini açma",
  },
  [IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR]: {
    ad: "Listeden Yetkili Birim Çıkar",
    aciklama: "Birimin liste erişimini kaldırma",
  },

  // ─────────── KART (temel) ───────────
  [IZIN_KODLARI.KART_OLUSTUR]: {
    ad: "Yeni Kart / Görev Oluştur",
    aciklama: "Liste içinde yeni kart açma",
  },
  [IZIN_KODLARI.KART_BASLIK_DUZENLE]: {
    ad: "Kart Başlığını Düzenle",
    aciklama: "Kartın başlığını değiştirme",
  },
  [IZIN_KODLARI.KART_ACIKLAMA_DUZENLE]: {
    ad: "Kart Açıklamasını Düzenle",
    aciklama: "Kartın markdown destekli açıklama metnini değiştirme",
  },
  [IZIN_KODLARI.KART_TASI]: {
    ad: "Kartı Taşı",
    aciklama: "Kartı liste içinde veya başka listeye sürükle-bırak ile taşıma",
  },
  [IZIN_KODLARI.KART_KOPYALA]: {
    ad: "Kartı Kopyala",
    aciklama: "Kartı içerikleriyle birlikte çoğaltma",
  },
  [IZIN_KODLARI.KART_ARSIVLE]: {
    ad: "Kartı Arşivle",
    aciklama: "Kartı arşive alma veya arşivden çıkarma",
  },
  [IZIN_KODLARI.KART_SIL]: {
    ad: "Kartı Sil",
    aciklama: "Kartı çöp kutusuna taşıma (geri yüklenebilir)",
  },
  [IZIN_KODLARI.KART_GERI_YUKLE]: {
    ad: "Silinmiş Kartı Geri Yükle",
    aciklama: "Çöp kutusundaki kartı geri yükleme",
  },

  // ─────────── KART / kapak ───────────
  [IZIN_KODLARI.KART_KAPAK_RENK]: {
    ad: "Kart Kapak Rengi Seç",
    aciklama: "Kartın görsel kapak rengini ayarlama veya kaldırma",
  },
  [IZIN_KODLARI.KART_KAPAK_GORSEL]: {
    ad: "Kart Kapak Görseli Ata",
    aciklama:
      "Karta yüklenmiş eklentilerden bir görseli kapak olarak seçme/kaldırma",
  },

  // ─────────── KART / tarih ───────────
  [IZIN_KODLARI.KART_TARIH_BASLANGIC]: {
    ad: "Başlangıç Tarihi Belirle",
    aciklama: "Kartın başlangıç tarihini ekleme, değiştirme veya kaldırma",
  },
  [IZIN_KODLARI.KART_TARIH_BITIS]: {
    ad: "Bitiş Tarihi Belirle",
    aciklama:
      "Kartın bitiş (son) tarihini ekleme, değiştirme veya kaldırma",
  },
  [IZIN_KODLARI.KART_TARIH_TAMAMLANDI]: {
    ad: "Kartı Tamamlandı İşaretle",
    aciklama: "Kartı tamamlandı/açık olarak işaretleme",
  },

  // ─────────── KART / etiket ───────────
  [IZIN_KODLARI.KART_ETIKET_OLUSTUR]: {
    ad: "Yeni Etiket Tanımla",
    aciklama: "Proje içinde yeni etiket (renk + ad) tanımlama",
  },
  [IZIN_KODLARI.KART_ETIKET_DUZENLE]: {
    ad: "Etiket Düzenle",
    aciklama: "Mevcut etiketin adını veya rengini değiştirme",
  },
  [IZIN_KODLARI.KART_ETIKET_SIL]: {
    ad: "Etiket Sil",
    aciklama: "Etiket tanımını projeden kaldırma",
  },
  [IZIN_KODLARI.KART_ETIKET_ATA]: {
    ad: "Karta Etiket Ata",
    aciklama: "Mevcut etiketi karta ekleme",
  },
  [IZIN_KODLARI.KART_ETIKET_CIKAR]: {
    ad: "Karttan Etiket Çıkar",
    aciklama: "Karta atanmış etiketi kaldırma",
  },

  // ─────────── KART / yorum ───────────
  [IZIN_KODLARI.KART_YORUM_OKU]: {
    ad: "Yorumları Görüntüle",
    aciklama: "Kart yorum akışını okuma",
  },
  [IZIN_KODLARI.KART_YORUM_YAZ]: {
    ad: "Yorum Yaz",
    aciklama: "Karta yeni yorum ekleme (mention dahil)",
  },
  [IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE]: {
    ad: "Kendi Yorumunu Düzenle",
    aciklama: "Kullanıcının kendi yorumunu düzenleyebilmesi",
  },
  [IZIN_KODLARI.KART_YORUM_KENDI_SIL]: {
    ad: "Kendi Yorumunu Sil",
    aciklama: "Kullanıcının kendi yorumunu silmesi",
  },
  [IZIN_KODLARI.KART_YORUM_BASKA_SIL]: {
    ad: "Başkasının Yorumunu Sil",
    aciklama: "Başka bir kullanıcının yazdığı yorumu silme (moderasyon)",
  },

  // ─────────── KART / eklenti ───────────
  [IZIN_KODLARI.KART_EKLENTI_OKU]: {
    ad: "Eklentileri Görüntüle",
    aciklama: "Karta yüklü dosya/görsel listesini görme",
  },
  [IZIN_KODLARI.KART_EKLENTI_YUKLE]: {
    ad: "Eklenti Yükle",
    aciklama: "Karta dosya veya görsel ekleme",
  },
  [IZIN_KODLARI.KART_EKLENTI_INDIR]: {
    ad: "Eklentiyi İndir",
    aciklama: "Karttaki dosya veya görseli indirme",
  },
  [IZIN_KODLARI.KART_EKLENTI_KENDI_SIL]: {
    ad: "Kendi Eklentini Sil",
    aciklama: "Kullanıcının kendisinin yüklediği eklentiyi silmesi",
  },
  [IZIN_KODLARI.KART_EKLENTI_BASKA_SIL]: {
    ad: "Başkasının Eklentisini Sil",
    aciklama: "Başka bir kullanıcının yüklediği eklentiyi silme (moderasyon)",
  },

  // ─────────── KART / kontrol-listesi ───────────
  [IZIN_KODLARI.KART_KONTROL_OLUSTUR]: {
    ad: "Kontrol Listesi Oluştur",
    aciklama: "Karta yeni kontrol listesi (checklist) ekleme",
  },
  [IZIN_KODLARI.KART_KONTROL_DUZENLE]: {
    ad: "Kontrol Listesini Düzenle",
    aciklama: "Kontrol listesinin başlığını değiştirme",
  },
  [IZIN_KODLARI.KART_KONTROL_SIL]: {
    ad: "Kontrol Listesini Sil",
    aciklama: "Kontrol listesini ve tüm maddelerini silme",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR]: {
    ad: "Kontrol Maddesi Ekle",
    aciklama: "Kontrol listesine yeni madde ekleme (atanan kişi dahil)",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_DUZENLE]: {
    ad: "Kontrol Maddesini Düzenle",
    aciklama: "Madde metnini, atananı veya son tarihi değiştirme",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE]: {
    ad: "Kontrol Maddesini Tikle / Aç",
    aciklama: "Maddeyi tamamlandı veya açık olarak işaretleme",
  },
  [IZIN_KODLARI.KART_KONTROL_MADDE_SIL]: {
    ad: "Kontrol Maddesini Sil",
    aciklama: "Maddeyi kontrol listesinden çıkarma",
  },

  // ─────────── KART / iliski ───────────
  [IZIN_KODLARI.KART_ILISKI_KUR]: {
    ad: "Bağlantılı Kart Ekle",
    aciklama: "İki kart arasında ilişki (bağlı, engelliyor, kopya) tanımlama",
  },
  [IZIN_KODLARI.KART_ILISKI_KALDIR]: {
    ad: "Bağlantılı Kart Kaldır",
    aciklama: "Mevcut kart ilişkisini kaldırma",
  },

  // ─────────── KART / yetkili ───────────
  [IZIN_KODLARI.KART_YETKILI_LISTELE]: {
    ad: "Kart Yetkililerini Görüntüle",
    aciklama: "Karta atanmış kişi ve birim listesini okuma",
  },
  [IZIN_KODLARI.KART_YETKILI_KISI_ATA]: {
    ad: "Karta Yetkili Kişi Ata",
    aciklama: "Karta yeni yetkili kişi ekleme (otomatik bildirim gider)",
  },
  [IZIN_KODLARI.KART_YETKILI_KISI_CIKAR]: {
    ad: "Karttan Yetkili Kişi Çıkar",
    aciklama: "Karttan yetkili kişiyi kaldırma",
  },
  [IZIN_KODLARI.KART_YETKILI_BIRIM_ATA]: {
    ad: "Karta Yetkili Birim Ekle",
    aciklama: "Karta birim atayarak birim personelinin erişimini açma",
  },
  [IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR]: {
    ad: "Karttan Yetkili Birim Çıkar",
    aciklama: "Birimin kart erişimini kaldırma",
  },

  // ─────────── KULLANICI ───────────
  [IZIN_KODLARI.KULLANICI_DAVET_GONDER]: {
    ad: "Sisteme Davet Gönder",
    aciklama: "E-posta adresine kayıt davetiyesi gönderme",
  },
  [IZIN_KODLARI.KULLANICI_DAVET_IPTAL]: {
    ad: "Daveti İptal Et",
    aciklama: "Bekleyen daveti iptal ederek token'ı geçersiz kılma",
  },
  [IZIN_KODLARI.KULLANICI_DAVET_YENIDEN]: {
    ad: "Daveti Yeniden Gönder",
    aciklama: "Bekleyen davete tekrar e-posta gönderme",
  },
  [IZIN_KODLARI.KULLANICI_ONAYLA]: {
    ad: "Kullanıcı Başvurusunu Onayla",
    aciklama: "Kayıt için bekleyen kullanıcıyı onaylayarak sisteme alma",
  },
  [IZIN_KODLARI.KULLANICI_REDDET]: {
    ad: "Kullanıcı Başvurusunu Reddet",
    aciklama: "Kayıt için bekleyen kullanıcıyı reddetme (sebep notuyla)",
  },
  [IZIN_KODLARI.KULLANICI_DUZENLE]: {
    ad: "Kullanıcı Bilgilerini Düzenle",
    aciklama:
      "Kullanıcının ad, soyad, ünvan, telefon, birim, aktiflik durumunu değiştirme",
  },
  [IZIN_KODLARI.KULLANICI_SIL]: {
    ad: "Kullanıcı Sil",
    aciklama: "Kullanıcıyı sistemden silme (soft delete)",
  },
  [IZIN_KODLARI.KULLANICI_GERI_YUKLE]: {
    ad: "Silinmiş Kullanıcıyı Geri Yükle",
    aciklama: "Soft-delete edilmiş kullanıcıyı yeniden aktifleştirme",
  },
  [IZIN_KODLARI.KULLANICI_PAROLA_SIFIRLA]: {
    ad: "Parola Sıfırlama Başlat",
    aciklama:
      "Kullanıcı için parola sıfırlama bağlantısı üretip e-posta gönderme",
  },

  // ─────────── BİRİM ───────────
  [IZIN_KODLARI.BIRIM_OLUSTUR]: {
    ad: "Birim Oluştur",
    aciklama: "Sisteme yeni birim (müdürlük/şube) ekleme",
  },
  [IZIN_KODLARI.BIRIM_DUZENLE]: {
    ad: "Birim Bilgilerini Düzenle",
    aciklama: "Birimin ad, kısa ad, kategori, tip bilgilerini değiştirme",
  },
  [IZIN_KODLARI.BIRIM_HIYERARSI]: {
    ad: "Birim Hiyerarşisini Yönet",
    aciklama: "Birimin üst birimini değiştirme veya bağ kurma/kaldırma",
  },
  [IZIN_KODLARI.BIRIM_SIL]: {
    ad: "Birim Sil",
    aciklama: "Birimi sistemden kaldırma (soft delete)",
  },
  [IZIN_KODLARI.BIRIM_GERI_YUKLE]: {
    ad: "Silinmiş Birimi Geri Yükle",
    aciklama: "Soft-delete edilmiş birimi yeniden aktifleştirme",
  },

  // ─────────── ROL ───────────
  [IZIN_KODLARI.ROL_OLUSTUR]: {
    ad: "Yeni Rol Tanımla",
    aciklama: "Sisteme yeni rol (özelleştirilmiş yetki paketi) ekleme",
  },
  [IZIN_KODLARI.ROL_DUZENLE]: {
    ad: "Rol Bilgilerini Düzenle",
    aciklama: "Rolün adını veya açıklamasını değiştirme",
  },
  [IZIN_KODLARI.ROL_IZIN_ATA]: {
    ad: "Rolün İzinlerini Düzenle",
    aciklama: "Role granüler izin atama veya çıkarma",
  },
  [IZIN_KODLARI.ROL_COGALT]: {
    ad: "Rolü Çoğalt",
    aciklama: "Mevcut rolün izinlerini taşıyan yeni rol oluşturma",
  },
  [IZIN_KODLARI.ROL_SIL]: {
    ad: "Rolü Sil",
    aciklama: "Sistem rolü olmayan rolleri silme",
  },
  [IZIN_KODLARI.ROL_KULLANICIYA_ATA]: {
    ad: "Kullanıcılara Rol Ata",
    aciklama: "Kullanıcıya bir veya birden fazla rolü atama/değiştirme",
  },

  // ─────────── DENETİM ───────────
  [IZIN_KODLARI.DENETIM_OKU]: {
    ad: "Denetim Logu Görüntüle",
    aciklama:
      "Sistem aktivite/değişiklik günlüğünü inceleme (kim/ne/ne zaman)",
  },
  [IZIN_KODLARI.DENETIM_DISA_AKTAR]: {
    ad: "Denetim Logunu Dışa Aktar",
    aciklama: "Denetim logunu CSV/JSON olarak dışa aktarma",
  },
  [IZIN_KODLARI.HATA_LOGU_OKU]: {
    ad: "Hata Logu Görüntüle",
    aciklama: "Frontend ve backend hata raporlarını inceleme",
  },
  [IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE]: {
    ad: "Hata Çözümünü Kayıt Altına Al",
    aciklama: "Hata kaydını çözüldü/incelendi olarak işaretleme + not ekleme",
  },

  // ─────────── AYAR ───────────
  [IZIN_KODLARI.AYAR_KURUM_DUZENLE]: {
    ad: "Kurum Bilgilerini Düzenle",
    aciklama: "Kaymakamlık temel bilgilerini güncelleme",
  },
  [IZIN_KODLARI.AYAR_SISTEM_DUZENLE]: {
    ad: "Sistem Ayarlarını Düzenle",
    aciklama: "Sistem genelindeki konfigürasyonu değiştirme",
  },
};

// ============================================================
// Sistem rolleri için varsayılan izin paketi
// Seed bu matrisi DB'ye uygular. UI'da kullanıcı bunları değiştirebilir.
// ============================================================

const TUM_PROJE_IZINLERI: IzinKodu[] = [
  IZIN_KODLARI.PROJE_OLUSTUR,
  IZIN_KODLARI.PROJE_AD_DUZENLE,
  IZIN_KODLARI.PROJE_ACIKLAMA_DUZENLE,
  IZIN_KODLARI.PROJE_KAPAK_RENK,
  IZIN_KODLARI.PROJE_KAPAK_IKON,
  IZIN_KODLARI.PROJE_YILDIZLA,
  IZIN_KODLARI.PROJE_ARSIVLE,
  IZIN_KODLARI.PROJE_SIL,
  IZIN_KODLARI.PROJE_GERI_YUKLE,
  IZIN_KODLARI.PROJE_SIRALA,
  IZIN_KODLARI.PROJE_YETKILI_LISTELE,
  IZIN_KODLARI.PROJE_YETKILI_KISI_ATA,
  IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR,
  IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA,
  IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR,
  IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER,
];

const TUM_LISTE_IZINLERI: IzinKodu[] = [
  IZIN_KODLARI.LISTE_OLUSTUR,
  IZIN_KODLARI.LISTE_AD_DUZENLE,
  IZIN_KODLARI.LISTE_SIRALA,
  IZIN_KODLARI.LISTE_ARSIVLE,
  IZIN_KODLARI.LISTE_SIL,
  IZIN_KODLARI.LISTE_GERI_YUKLE,
  IZIN_KODLARI.LISTE_YETKILI_LISTELE,
  IZIN_KODLARI.LISTE_YETKILI_KISI_ATA,
  IZIN_KODLARI.LISTE_YETKILI_KISI_CIKAR,
  IZIN_KODLARI.LISTE_YETKILI_BIRIM_ATA,
  IZIN_KODLARI.LISTE_YETKILI_BIRIM_CIKAR,
];

const TUM_KART_IZINLERI: IzinKodu[] = TUM_IZIN_KODLARI.filter(
  (k) => IZIN_KATEGORI[k] === IzinKategorisi.KART,
);

// PERSONEL için "iş yapan" minimum: kart yaz + yorum + eklenti + checklist madde işaretle
const PERSONEL_KART: IzinKodu[] = [
  IZIN_KODLARI.KART_OLUSTUR,
  IZIN_KODLARI.KART_BASLIK_DUZENLE,
  IZIN_KODLARI.KART_ACIKLAMA_DUZENLE,
  IZIN_KODLARI.KART_TASI,
  IZIN_KODLARI.KART_KAPAK_RENK,
  IZIN_KODLARI.KART_TARIH_BASLANGIC,
  IZIN_KODLARI.KART_TARIH_BITIS,
  IZIN_KODLARI.KART_TARIH_TAMAMLANDI,
  IZIN_KODLARI.KART_ETIKET_ATA,
  IZIN_KODLARI.KART_ETIKET_CIKAR,
  IZIN_KODLARI.KART_YORUM_OKU,
  IZIN_KODLARI.KART_YORUM_YAZ,
  IZIN_KODLARI.KART_YORUM_KENDI_DUZENLE,
  IZIN_KODLARI.KART_YORUM_KENDI_SIL,
  IZIN_KODLARI.KART_EKLENTI_OKU,
  IZIN_KODLARI.KART_EKLENTI_YUKLE,
  IZIN_KODLARI.KART_EKLENTI_INDIR,
  IZIN_KODLARI.KART_EKLENTI_KENDI_SIL,
  IZIN_KODLARI.KART_KONTROL_MADDE_ISARETLE,
];

const BIRIM_AMIRI_KART: IzinKodu[] = [
  ...PERSONEL_KART,
  IZIN_KODLARI.KART_KOPYALA,
  IZIN_KODLARI.KART_ARSIVLE,
  IZIN_KODLARI.KART_SIL,
  IZIN_KODLARI.KART_GERI_YUKLE,
  IZIN_KODLARI.KART_KAPAK_GORSEL,
  IZIN_KODLARI.KART_ETIKET_OLUSTUR,
  IZIN_KODLARI.KART_ETIKET_DUZENLE,
  IZIN_KODLARI.KART_ETIKET_SIL,
  IZIN_KODLARI.KART_YORUM_BASKA_SIL,
  IZIN_KODLARI.KART_EKLENTI_BASKA_SIL,
  IZIN_KODLARI.KART_KONTROL_OLUSTUR,
  IZIN_KODLARI.KART_KONTROL_DUZENLE,
  IZIN_KODLARI.KART_KONTROL_SIL,
  IZIN_KODLARI.KART_KONTROL_MADDE_OLUSTUR,
  IZIN_KODLARI.KART_KONTROL_MADDE_DUZENLE,
  IZIN_KODLARI.KART_KONTROL_MADDE_SIL,
  IZIN_KODLARI.KART_ILISKI_KUR,
  IZIN_KODLARI.KART_ILISKI_KALDIR,
  IZIN_KODLARI.KART_YETKILI_LISTELE,
  IZIN_KODLARI.KART_YETKILI_KISI_ATA,
  IZIN_KODLARI.KART_YETKILI_KISI_CIKAR,
  IZIN_KODLARI.KART_YETKILI_BIRIM_ATA,
  IZIN_KODLARI.KART_YETKILI_BIRIM_CIKAR,
];

export const VARSAYILAN_ROL_IZINLERI: Record<string, IzinKodu[]> = {
  [ROL_KODLARI.SUPER_ADMIN]: TUM_IZIN_KODLARI,
  [ROL_KODLARI.KAYMAKAM]: [
    ...TUM_PROJE_IZINLERI,
    ...TUM_LISTE_IZINLERI,
    ...TUM_KART_IZINLERI,
    IZIN_KODLARI.KULLANICI_DAVET_GONDER,
    IZIN_KODLARI.KULLANICI_DAVET_IPTAL,
    IZIN_KODLARI.KULLANICI_DAVET_YENIDEN,
    IZIN_KODLARI.KULLANICI_ONAYLA,
    IZIN_KODLARI.KULLANICI_REDDET,
    IZIN_KODLARI.KULLANICI_DUZENLE,
    IZIN_KODLARI.KULLANICI_PAROLA_SIFIRLA,
    IZIN_KODLARI.BIRIM_OLUSTUR,
    IZIN_KODLARI.BIRIM_DUZENLE,
    IZIN_KODLARI.BIRIM_HIYERARSI,
    IZIN_KODLARI.BIRIM_SIL,
    IZIN_KODLARI.BIRIM_GERI_YUKLE,
    IZIN_KODLARI.ROL_OLUSTUR,
    IZIN_KODLARI.ROL_DUZENLE,
    IZIN_KODLARI.ROL_IZIN_ATA,
    IZIN_KODLARI.ROL_COGALT,
    IZIN_KODLARI.ROL_SIL,
    IZIN_KODLARI.ROL_KULLANICIYA_ATA,
    IZIN_KODLARI.DENETIM_OKU,
    IZIN_KODLARI.DENETIM_DISA_AKTAR,
    IZIN_KODLARI.HATA_LOGU_OKU,
    IZIN_KODLARI.HATA_LOGU_COZULDU_ISARETLE,
  ],
  [ROL_KODLARI.BIRIM_AMIRI]: [
    IZIN_KODLARI.PROJE_OLUSTUR,
    IZIN_KODLARI.PROJE_AD_DUZENLE,
    IZIN_KODLARI.PROJE_ACIKLAMA_DUZENLE,
    IZIN_KODLARI.PROJE_KAPAK_RENK,
    IZIN_KODLARI.PROJE_KAPAK_IKON,
    IZIN_KODLARI.PROJE_YILDIZLA,
    IZIN_KODLARI.PROJE_ARSIVLE,
    IZIN_KODLARI.PROJE_SIRALA,
    IZIN_KODLARI.PROJE_YETKILI_LISTELE,
    IZIN_KODLARI.PROJE_YETKILI_KISI_ATA,
    IZIN_KODLARI.PROJE_YETKILI_KISI_CIKAR,
    IZIN_KODLARI.PROJE_YETKILI_BIRIM_ATA,
    IZIN_KODLARI.PROJE_YETKILI_BIRIM_CIKAR,
    IZIN_KODLARI.PROJE_YETKILI_DAVET_GONDER,
    ...TUM_LISTE_IZINLERI,
    ...BIRIM_AMIRI_KART,
    IZIN_KODLARI.KULLANICI_DAVET_GONDER,
    IZIN_KODLARI.KULLANICI_DAVET_IPTAL,
    IZIN_KODLARI.KULLANICI_DAVET_YENIDEN,
  ],
  [ROL_KODLARI.PERSONEL]: PERSONEL_KART,
};
