// ADR-0014 / Sprint 3 S3-5 — IZIN_TANIMLARI: KULLANICI/BIRIM/ROL/AUDIT/AYAR.

import { IZIN_KODLARI, type IzinKodu } from "./kodlar";

export const TANIMLAR_SISTEM: Partial<
  Record<IzinKodu, { ad: string; aciklama: string }>
> = {
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
  [IZIN_KODLARI.AKTIVITE_OKU]: {
    ad: "Aktivite Günlüğünü Görüntüle",
    aciklama:
      "Yetki kapsamındaki operasyon aktivitelerini makam dostu akış olarak okuma",
  },
  [IZIN_KODLARI.AKTIVITE_DISA_AKTAR]: {
    ad: "Aktivite Günlüğünü Dışa Aktar",
    aciklama: "Yetki kapsamındaki aktivite akışını CSV olarak dışa aktarma",
  },
  [IZIN_KODLARI.DENETIM_OKU]: {
    ad: "Forensik Denetim Logu Görüntüle",
    aciklama:
      "Ham audit kaydını IP, request kimliği, HTTP yolu ve JSON diff ile inceleme",
  },
  [IZIN_KODLARI.DENETIM_DISA_AKTAR]: {
    ad: "Forensik Denetim Logunu Dışa Aktar",
    aciklama: "Ham denetim logunu CSV/JSON olarak dışa aktarma",
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
