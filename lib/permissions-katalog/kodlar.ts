// ADR-0014 / Sprint 3 S3-5 — İzin kodları (saf veri).
// Modül × alt-kategori × aksiyon: <modul>:<aksiyon> veya <modul>.<altkategori>:<aksiyon>
//
// Bu dosya `@prisma/client`'tan enum import etmez (kategori map'i ayrı).
// Server/client/test ortak kullanım için saf TypeScript const.

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
  // ADR-0018 — eskiden KART_TARIH_TAMAMLANDI ("kart.tarih:tamamlandi") "tarih"
  // alt-kategorisindeydi; yanlış konum (tamamlama ≠ tarih). "Temel" altına
  // taşındı, kod sadeleşti. RBAC default'ta sadece SUPER_ADMIN + KAYMAKAM
  // (TUM_KART_IZINLERI üzerinden otomatik); BIRIM_AMIRI ve PERSONEL
  // varsayılan'da tamamlayamaz.
  KART_TAMAMLA: "kart:tamamla",

  // ─────────── KART / Kapak ───────────
  KART_KAPAK_RENK: "kart.kapak:renk",
  KART_KAPAK_GORSEL: "kart.kapak:gorsel",

  // ─────────── KART / Tarih ───────────
  KART_TARIH_BASLANGIC: "kart.tarih:baslangic",
  KART_TARIH_BITIS: "kart.tarih:bitis",

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

  // ─────────── DOSYA (ADR-0028) — Çekirdek dosya yönetimi ───────────
  DOSYA_OKU: "dosya:oku",
  DOSYA_YUKLE: "dosya:yukle",
  DOSYA_INDIR: "dosya:indir",
  DOSYA_ONIZLE: "dosya:onizle",

  // ─────────── DOSYA / Düzenle ───────────
  DOSYA_AD_DUZENLE: "dosya:duzenle-ad",
  DOSYA_ACIKLAMA_DUZENLE: "dosya:duzenle-aciklama",
  DOSYA_GIZLILIK_DUZENLE: "dosya:gizlilik-duzenle",

  // ─────────── DOSYA / Etiket ───────────
  DOSYA_ETIKET_ATA: "dosya.etiket:ata",
  DOSYA_ETIKET_YONET: "dosya.etiket:yonet",

  // ─────────── DOSYA / Bağlantı ───────────
  DOSYA_BAGLANTI_EKLE: "dosya.baglanti:ekle",
  DOSYA_BAGLANTI_KALDIR: "dosya.baglanti:kaldir",

  // ─────────── DOSYA / Sürüm ───────────
  DOSYA_SURUM_YUKLE: "dosya.surum:yukle",

  // ─────────── DOSYA / Silme ───────────
  DOSYA_KENDI_SIL: "dosya:kendi-sil",
  DOSYA_BASKA_SIL: "dosya:baska-sil",
  DOSYA_GERI_YUKLE: "dosya:geri-yukle",
  DOSYA_KALICI_SIL: "dosya:kalici-sil",

  // ─────────── DOSYA / Toplu & Güvenlik ───────────
  DOSYA_TOPLU_ISLEM: "dosya:toplu-islem",
  DOSYA_GUVENLIK_YONET: "dosya:guvenlik-yonet",
  DOSYA_DISA_AKTAR: "dosya:disa-aktar",

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
  AKTIVITE_OKU: "aktivite:oku",
  AKTIVITE_DISA_AKTAR: "aktivite:disa-aktar",
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
