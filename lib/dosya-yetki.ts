// ADR-0028 — Dosya yönetimi resource-level RBAC.
//
// İki katmanlı yetki (Kural 50 + 146):
//   1. Sistem rolü izinleri (lib/permissions.ts) — kullanıcı bu TIP işlemi
//      yapabilir mi (örn. DOSYA_KENDI_SIL).
//   2. Kaynak erişimi (bu modül) — bu kullanıcı bu DOSYA üzerinde işlem
//      yapabilir mi (bağlantılı kart/proje/liste'ye erişim + gizlilik +
//      yükleyen kontrolü).
//
// Karar mantığı (ADR-0028 K2):
//   - Makam (SUPER_ADMIN / KAYMAKAM): her dosyaya erişir, gizlilik ve
//     bağlantı filtresini aşar.
//   - Diğer roller: dosyanın en az BİR DosyaBaglantisi'nın işaret ettiği
//     kart/proje/liste'ye erişim varsa "oku" geçer.
//   - Yükleyen: kendisi yüklediği dosyayı "kendi-sil" ile silebilir; ek
//     olarak kaynak erişimi gerekir (kaldırılan kaynaktaki dosya sahibi
//     yine erişemez).
//   - Gizlilik:
//       NORMAL → kaynak erişimi olan herkes
//       HASSAS → BIRIM_AMIRI ve üstü (KAYMAKAM/SUPER_ADMIN)
//       GIZLI  → yalnız yükleyen + makam
//
// Bağlantısız dosya (orphan): yalnız yükleyen + makam görür.

import { DosyaGizlilik } from "@prisma/client";
import { db } from "./db";
import { EylemHatasi } from "./action-wrapper";
import { HATA_KODU } from "./sonuc";
import { ROL_KODLARI } from "./roller";
import { izinVarMi } from "./permissions";
import { IZIN_KODLARI } from "./permissions-katalog";
import {
  canKart,
  canListe,
  canProje,
  kullaniciErisimBilgisi,
} from "./yetki";

export type DosyaAksiyon =
  | "dosya:read"
  | "dosya:download"
  | "dosya:preview"
  | "dosya:edit-meta"
  | "dosya:edit-gizlilik"
  | "dosya:tag"
  | "dosya:link-add"
  | "dosya:link-remove"
  | "dosya:version-add"
  | "dosya:delete"
  | "dosya:restore"
  | "dosya:purge";

interface DosyaErisimSatiri {
  yukleyen_id: string;
  silindi_mi: boolean;
  gizlilik: DosyaGizlilik;
  baglantilar: Array<{
    kaynak_tip: string;
    kaynak_id: string;
    proje_id: string | null;
    liste_id: string | null;
    kart_id: string | null;
  }>;
}

async function dosyaErisimSatiriAl(
  dosyaId: string,
): Promise<DosyaErisimSatiri | null> {
  const dosya = await db.dosya.findUnique({
    where: { id: dosyaId },
    select: {
      yukleyen_id: true,
      silindi_mi: true,
      gizlilik: true,
      baglantilar: {
        select: {
          kaynak_tip: true,
          kaynak_id: true,
          proje_id: true,
          liste_id: true,
          kart_id: true,
        },
      },
    },
  });
  return dosya;
}

interface KullaniciRolDurumu {
  roller: ReadonlySet<string>;
  birimAmiriUstu: boolean;
}

async function kullaniciRolDurumu(
  kullaniciId: string,
): Promise<KullaniciRolDurumu> {
  const atamalar = await db.kullaniciRol.findMany({
    where: { kullanici_id: kullaniciId },
    select: { rol: { select: { kod: true } } },
  });
  const roller = new Set(atamalar.map((a) => a.rol.kod));
  const birimAmiriUstu =
    roller.has(ROL_KODLARI.BIRIM_AMIRI) ||
    roller.has(ROL_KODLARI.KAYMAKAM) ||
    roller.has(ROL_KODLARI.SUPER_ADMIN);
  return { roller, birimAmiriUstu };
}

async function herhangiKaynagaErisim(
  kullaniciId: string,
  dosya: DosyaErisimSatiri,
): Promise<boolean> {
  if (dosya.baglantilar.length === 0) return false;
  for (const b of dosya.baglantilar) {
    if (b.kaynak_tip === "KART" && b.kart_id) {
      if (await canKart(kullaniciId, "kart:read", b.kart_id)) return true;
    } else if (b.kaynak_tip === "LISTE" && b.liste_id) {
      if (await canListe(kullaniciId, "liste:read", b.liste_id)) return true;
    } else if (b.kaynak_tip === "PROJE" && b.proje_id) {
      if (await canProje(kullaniciId, "proje:read", b.proje_id)) return true;
    }
    // YORUM/KONTROL_MADDESI/KULLANICI/BIRIM v2 kapsamı — F1'de erişimi
    // bağlı kart/proje/liste üzerinden kuruluyor; v2'de genişletilir.
  }
  return false;
}

async function gizlilikGecerliMi(
  dosya: DosyaErisimSatiri,
  kullaniciId: string,
  rolDurumu: KullaniciRolDurumu,
  makam: boolean,
): Promise<boolean> {
  switch (dosya.gizlilik) {
    case DosyaGizlilik.NORMAL:
      return true;
    case DosyaGizlilik.HASSAS:
      return makam || rolDurumu.birimAmiriUstu;
    case DosyaGizlilik.GIZLI:
      return makam || dosya.yukleyen_id === kullaniciId;
  }
}

function aksiyonSistemIznine(
  aksiyon: DosyaAksiyon,
  isYukleyen: boolean,
): string | null {
  switch (aksiyon) {
    case "dosya:read":
      return IZIN_KODLARI.DOSYA_OKU;
    case "dosya:download":
      return IZIN_KODLARI.DOSYA_INDIR;
    case "dosya:preview":
      return IZIN_KODLARI.DOSYA_ONIZLE;
    case "dosya:edit-meta":
      return IZIN_KODLARI.DOSYA_AD_DUZENLE;
    case "dosya:edit-gizlilik":
      return IZIN_KODLARI.DOSYA_GIZLILIK_DUZENLE;
    case "dosya:tag":
      return IZIN_KODLARI.DOSYA_ETIKET_ATA;
    case "dosya:link-add":
      return IZIN_KODLARI.DOSYA_BAGLANTI_EKLE;
    case "dosya:link-remove":
      return IZIN_KODLARI.DOSYA_BAGLANTI_KALDIR;
    case "dosya:version-add":
      return IZIN_KODLARI.DOSYA_SURUM_YUKLE;
    case "dosya:delete":
      return isYukleyen
        ? IZIN_KODLARI.DOSYA_KENDI_SIL
        : IZIN_KODLARI.DOSYA_BASKA_SIL;
    case "dosya:restore":
      return IZIN_KODLARI.DOSYA_GERI_YUKLE;
    case "dosya:purge":
      return IZIN_KODLARI.DOSYA_KALICI_SIL;
  }
}

/**
 * Resource-level RBAC: kullanıcı bu dosya üzerinde aksiyonu uygulayabilir mi?
 * Sistem izni + kaynak erişimi + gizlilik + yükleyen birlikte değerlendirilir.
 *
 * Dönüş `false`: yetki yok. Throw etmez — UI'da koşullu render için.
 */
export async function canDosya(
  kullaniciId: string,
  aksiyon: DosyaAksiyon,
  dosyaId: string,
): Promise<boolean> {
  const dosya = await dosyaErisimSatiriAl(dosyaId);
  if (!dosya) return false;

  const [erisim, rolDurumu] = await Promise.all([
    kullaniciErisimBilgisi(kullaniciId),
    kullaniciRolDurumu(kullaniciId),
  ]);

  const isYukleyen = dosya.yukleyen_id === kullaniciId;
  const izinKodu = aksiyonSistemIznine(aksiyon, isYukleyen);
  if (!izinKodu) return false;

  // Sistem izni katmanı (makam '*' otomatik geçer; izinVarMi onu ele alır).
  // kullaniciIzinleriniAl React cache'li — aynı request içinde tek DB hit.
  if (!(await izinVarMi(kullaniciId, izinKodu))) return false;

  // Kalıcı silme yalnız makam (sistem izni zaten dar; yine de kaynak ve
  // gizlilik filtresinden bağımsız makam zorunluluğu).
  if (aksiyon === "dosya:purge" && !erisim.makam) return false;

  // Makam: kaynak filtresini ve gizliliği aşar.
  if (erisim.makam) return true;

  // Yükleyen YUKLENIYOR durumundaki kendi upload session'ını her zaman görür
  // — burada `dosyaErisimSatiriAl` Dosya tablosundan okur; YUKLENIYOR durumdaki
  // kayıtlar zaten yükleyenin kendi mutasyonu, ek kontrol gerekmez.

  // Soft-deleted dosyaya dokunmak için "restore" veya "purge" gerekir;
  // diğer aksiyonlar reddedilir (çöp kutusu UI'sı bu gate'e girmez).
  if (
    dosya.silindi_mi &&
    aksiyon !== "dosya:restore" &&
    aksiyon !== "dosya:purge" &&
    aksiyon !== "dosya:read"
  ) {
    return false;
  }

  // Kaynak erişimi: en az bir bağlantı erişilebilir olmalı.
  const kaynakErisimi = await herhangiKaynagaErisim(kullaniciId, dosya);

  // Bağlantısız ("orphan") dosyada yalnız yükleyen erişebilir.
  if (dosya.baglantilar.length === 0) {
    if (!isYukleyen) return false;
  } else if (!kaynakErisimi) {
    // Yükleyen olsa bile kaynak erişimi düşmüşse genel erişim kapalı —
    // kendi dosyasını silmek için istisna:
    if (!(aksiyon === "dosya:delete" && isYukleyen)) return false;
  }

  // Gizlilik politikası
  const gizlilikOk = await gizlilikGecerliMi(
    dosya,
    kullaniciId,
    rolDurumu,
    erisim.makam,
  );
  if (!gizlilikOk) return false;

  // Bağlantı ekleme/kaldırma için hedef kaynakta edit yetkisi server action
  // tarafında ayrıca kontrol edilir (`canKart('kart:edit', ...)` vs).
  // Bu helper "dosya tarafı" yetkisini onaylar.

  return true;
}

/**
 * Throw versiyonu — server action'ların başında kullanılır.
 *
 * @throws EylemHatasi(GIRIS_YOK) — kullaniciId yoksa
 * @throws EylemHatasi(YETKISIZ) — yetki yoksa
 */
export async function yetkiZorunluDosya(
  kullaniciId: string | null | undefined,
  aksiyon: DosyaAksiyon,
  dosyaId: string,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await canDosya(kullaniciId, aksiyon, dosyaId))) {
    throw new EylemHatasi(
      "Bu dosyaya erişim yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}
