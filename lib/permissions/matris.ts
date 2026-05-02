import type { IzinAnahtari } from './izinler'

// 🔶 Kapsam-kısıtlı izinler rol matrisinde ✅ olarak gösterilir.
// Kapsam denetimi hizmet katmanında (bağlam kontrolüyle) yapılır.

const YONETICI_IZINLERI: IzinAnahtari[] = [
  'dizge.ayarlar', 'dizge.denetim', 'dizge.izin_yonet', 'dizge.istisna_yonet',
  'dizge.tatil_yonet', 'dizge.kalip_yonet', 'dizge.atama_kurali_yonet',
  'rapor.oku.tumu', 'rapor.oku.birim',
  'birim.olustur', 'birim.duzenle', 'birim.sil', 'birim.uye.oku',
  'kullanici.olustur', 'kullanici.duzenle', 'kullanici.sil', 'kullanici.devre_disi_birak',
  'proje.olustur', 'proje.duzenle', 'proje.uye_ekle', 'proje.uye_onayla',
  'proje.kapatma_iste', 'proje.kapat', 'proje.arsivle',
  'proje.oku.tumu', 'proje.oku.uye_oldugu',
  'gorev.olustur', 'gorev.olustur.ozel',
  'gorev.duzenle.kendi', 'gorev.duzenle.tumu',
  'gorev.ata', 'gorev.yeniden_ata', 'gorev.iptal', 'gorev.sil',
  'gorev.onaya_sun', 'gorev.onayla', 'gorev.reddet',
  'gorev.altgorev.olustur', 'gorev.baglilik.duzenle',
  'gorev.izle', 'gorev.toplu.islem',
  'yorum.olustur', 'yorum.duzenle.kendi', 'yorum.sil.kendi', 'yorum.sil.tumu',
  'derkenar.olustur', 'derkenar.duzenle.kendi', 'derkenar.duzenle.tumu',
  'derkenar.sabitle', 'derkenar.surum.oku',
  'vekalet.olustur', 'vekalet.geri_al.kendi', 'vekalet.geri_al.tumu', 'vekalet.oku.tumu',
  'bildirim.tercih.duzenle', 'bildirim.oku.kendi',
  'dosya.yukle', 'dosya.indir', 'dosya.sil.kendi', 'dosya.sil.tumu',
  'arama.kullan',
]

const BIRIM_MUDURU_IZINLERI: IzinAnahtari[] = [
  'rapor.oku.birim',                                          // 🔶 kendi birimi
  'birim.duzenle', 'birim.uye.oku',                          // 🔶 kendi birimi
  'kullanici.duzenle',                                        // 🔶 kendi birimi
  'proje.olustur', 'proje.duzenle',                          // 🔶 kendi birimi
  'proje.uye_ekle', 'proje.uye_onayla', 'proje.kapatma_iste',
  'proje.kapat', 'proje.arsivle',                            // 🔶 kendi birimi
  'proje.oku.uye_oldugu',
  'gorev.olustur', 'gorev.olustur.ozel',
  'gorev.duzenle.kendi', 'gorev.duzenle.tumu',               // 🔶 kendi birimi
  'gorev.ata', 'gorev.yeniden_ata',
  'gorev.iptal', 'gorev.sil',                                // 🔶 kendi birimi
  'gorev.onaya_sun', 'gorev.onayla', 'gorev.reddet',
  'gorev.altgorev.olustur', 'gorev.baglilik.duzenle',
  'gorev.izle', 'gorev.toplu.islem',
  'yorum.olustur', 'yorum.duzenle.kendi', 'yorum.sil.kendi',
  'derkenar.olustur', 'derkenar.duzenle.kendi',
  'derkenar.sabitle', 'derkenar.surum.oku',
  'vekalet.olustur', 'vekalet.geri_al.kendi',
  'vekalet.oku.tumu',                                        // 🔶 kendi birimi
  'bildirim.tercih.duzenle', 'bildirim.oku.kendi',
  'dosya.yukle', 'dosya.indir', 'dosya.sil.kendi',
  'dosya.sil.tumu',                                          // 🔶 kendi birimi
  'dizge.denetim',                                           // 🔶 kendi birimi
  'dizge.kalip_yonet', 'dizge.atama_kurali_yonet',          // 🔶 kendi birimi
  'arama.kullan',
]

const PERSONEL_IZINLERI: IzinAnahtari[] = [
  'birim.uye.oku',                                           // 🔶 kendi birimi
  'kullanici.duzenle',                                       // 🔶 yalnızca kendi profili
  'proje.oku.uye_oldugu',
  'gorev.olustur', 'gorev.olustur.ozel',
  'gorev.duzenle.kendi',
  'gorev.iptal',                                             // 🔶 kendi oluşturduğu
  'gorev.onaya_sun',
  'gorev.altgorev.olustur',
  'gorev.baglilik.duzenle',                                  // 🔶 kendi atandığı
  'gorev.izle',
  'yorum.olustur', 'yorum.duzenle.kendi', 'yorum.sil.kendi',
  'derkenar.olustur', 'derkenar.duzenle.kendi', 'derkenar.surum.oku',
  'bildirim.tercih.duzenle', 'bildirim.oku.kendi',
  'dosya.yukle', 'dosya.indir', 'dosya.sil.kendi',
  'arama.kullan',
]

export const ROL_IZIN_MATRISI = {
  YONETICI: new Set<IzinAnahtari>(YONETICI_IZINLERI),
  BIRIM_MUDURU: new Set<IzinAnahtari>(BIRIM_MUDURU_IZINLERI),
  PERSONEL: new Set<IzinAnahtari>(PERSONEL_IZINLERI),
} as const
