// Tekman ilçesindeki örnek birim envanteri.
// Sistem boş bir ilçeden değil, kullanılır halde — ~30+ aktif birim.

import type { BirimSeed } from "./tipler";

export const BIRIMLER: BirimSeed[] = [
  // Mülki idare
  { key: "kaymakamlik", tip: "KAYMAKAMLIK", ad: "Tekman Kaymakamlığı", kisa_ad: "Kaymakamlık" },
  { key: "ozelKalem", tip: "OZEL_KALEM", ad: "Özel Kalem", kisa_ad: "Özel Kalem" },
  { key: "yaziIsleri", tip: "YAZI_ISLERI_MUDURLUGU", ad: "Yazı İşleri Müdürlüğü", kisa_ad: "Yazı İşleri" },

  // Yerel yönetim & muhtarlık
  { key: "belediye", tip: "BELEDIYE_BASKANLIGI", ad: "Tekman Belediyesi", kisa_ad: "Belediye" },
  { key: "muhtarlik", tip: "MAHALLE_MUHTARLIGI", ad: "Vatan Mahallesi Muhtarlığı", kisa_ad: "Vatan Muhtarlığı" },
  { key: "koyMuhtar", tip: "KOY_MUHTARLIGI", ad: "Karaağaç Köyü Muhtarlığı", kisa_ad: "Karaağaç Muhtarlığı" },

  // Emniyet & asayiş
  { key: "emniyet", tip: "ILCE_EMNIYET_MUDURLUGU", ad: "İlçe Emniyet Amirliği", kisa_ad: "Emniyet" },
  { key: "jandarma", tip: "ILCE_JANDARMA_KOMUTANLIGI", ad: "İlçe Jandarma Komutanlığı", kisa_ad: "Jandarma" },
  { key: "jandarmaKarakolu", tip: "JANDARMA_KARAKOLU", ad: "Karaçoban Jandarma Karakolu", kisa_ad: "Karaçoban Karakolu" },

  // Eğitim
  { key: "milliEgitim", tip: "ILCE_MILLI_EGITIM_MUDURLUGU", ad: "İlçe Milli Eğitim Müdürlüğü", kisa_ad: "Milli Eğitim" },
  { key: "lise", tip: "ANADOLU_LISESI", ad: "Tekman Anadolu Lisesi", kisa_ad: "Anadolu Lisesi" },
  { key: "ilkokul", tip: "ILKOKUL", ad: "Cumhuriyet İlkokulu", kisa_ad: "Cumhuriyet İlkokulu" },
  { key: "ortaokul", tip: "ORTAOKUL", ad: "Atatürk Ortaokulu", kisa_ad: "Atatürk Ortaokulu" },
  { key: "imamHatip", tip: "IMAM_HATIP_LISESI", ad: "Tekman İmam Hatip Lisesi", kisa_ad: "İmam Hatip" },
  { key: "halkEgitim", tip: "HALK_EGITIM_MERKEZI", ad: "Tekman Halk Eğitim Merkezi", kisa_ad: "Halk Eğitim" },
  { key: "ramKurumu", tip: "REHBERLIK_ARASTIRMA_MERKEZI", ad: "Rehberlik ve Araştırma Merkezi", kisa_ad: "RAM" },
  { key: "kyk", tip: "KYK_YURDU", ad: "Tekman KYK Öğrenci Yurdu", kisa_ad: "KYK Yurdu" },

  // Sağlık
  { key: "saglik", tip: "ILCE_SAGLIK_MUDURLUGU", ad: "İlçe Sağlık Müdürlüğü", kisa_ad: "Sağlık" },
  { key: "hastane", tip: "DEVLET_HASTANESI", ad: "Tekman Devlet Hastanesi", kisa_ad: "Devlet Hastanesi" },
  { key: "asm", tip: "AILE_SAGLIGI_MERKEZI", ad: "Merkez Aile Sağlığı Merkezi", kisa_ad: "Merkez ASM" },
  { key: "tsm", tip: "TOPLUM_SAGLIGI_MERKEZI", ad: "Tekman Toplum Sağlığı Merkezi", kisa_ad: "TSM" },
  { key: "eczane", tip: "ECZANE", ad: "Kardelen Eczanesi", kisa_ad: "Kardelen Eczanesi" },

  // Maliye & vergi
  { key: "mal", tip: "ILCE_MAL_MUDURLUGU", ad: "İlçe Mal Müdürlüğü", kisa_ad: "Mal Müdürlüğü" },
  { key: "vergi", tip: "VERGI_DAIRESI", ad: "Tekman Vergi Dairesi", kisa_ad: "Vergi Dairesi" },

  // Sosyal hizmetler
  { key: "sydv", tip: "SOSYAL_YARDIMLASMA_DAYANISMA_VAKFI", ad: "Sosyal Yardımlaşma ve Dayanışma Vakfı", kisa_ad: "SYDV" },
  { key: "asdm", tip: "AILE_SOSYAL_HIZMETLER_ILCE_MUDURLUGU", ad: "İlçe Aile ve Sosyal Hizmetler Müdürlüğü", kisa_ad: "ASHB İlçe" },

  // Nüfus & seçim
  { key: "nufus", tip: "ILCE_NUFUS_MUDURLUGU", ad: "İlçe Nüfus Müdürlüğü", kisa_ad: "Nüfus" },
  { key: "secimKurulu", tip: "ILCE_SECIM_KURULU", ad: "İlçe Seçim Kurulu Başkanlığı", kisa_ad: "Seçim Kurulu" },

  // Tarım & orman
  { key: "tarim", tip: "ILCE_TARIM_ORMAN_MUDURLUGU", ad: "İlçe Tarım ve Orman Müdürlüğü", kisa_ad: "Tarım" },
  { key: "ormanIsletme", tip: "ORMAN_ISLETME_SEFLIGI", ad: "Tekman Orman İşletme Şefliği", kisa_ad: "Orman İşletme" },
  { key: "ziraatOdasi", tip: "ZIRAAT_ODASI", ad: "Tekman Ziraat Odası", kisa_ad: "Ziraat Odası" },

  // Afet & acil durum
  { key: "afad", tip: "AFAD_ILCE_BIRIMI", ad: "AFAD Tekman İlçe Birimi", kisa_ad: "AFAD" },
  { key: "itfaiye", tip: "ITFAIYE", ad: "Tekman Belediye İtfaiyesi", kisa_ad: "İtfaiye" },
  { key: "kizilay", tip: "KIZILAY_SUBESI", ad: "Türk Kızılay Tekman Şubesi", kisa_ad: "Kızılay" },

  // Ulaştırma & altyapı
  { key: "karayollari", tip: "KARAYOLLARI_SUBE_SEFLIGI", ad: "Karayolları 14. Şube Şefliği (Tekman)", kisa_ad: "Karayolları" },
  { key: "ptt", tip: "PTT_MUDURLUGU", ad: "PTT Tekman Şube Müdürlüğü", kisa_ad: "PTT" },
  { key: "tedas", tip: "TEDAS", ad: "TEDAŞ Tekman İşletme Şefliği", kisa_ad: "TEDAŞ" },

  // Banka
  { key: "ziraatBank", tip: "ZIRAAT_BANKASI", ad: "Ziraat Bankası Tekman Şubesi", kisa_ad: "Ziraat Bankası" },

  // Tapu kadastro
  { key: "tapuKadastro", tip: "TAPU_MUDURLUGU", ad: "Tekman Tapu Müdürlüğü", kisa_ad: "Tapu" },

  // Din hizmetleri
  { key: "muftuluk", tip: "ILCE_MUFTULUGU", ad: "İlçe Müftülüğü", kisa_ad: "Müftülük" },

  // Kültür spor gençlik
  { key: "genclikSpor", tip: "ILCE_GENCLIK_SPOR_MUDURLUGU", ad: "Gençlik ve Spor İlçe Müdürlüğü", kisa_ad: "Gençlik Spor" },
  { key: "kutuphane", tip: "HALK_KUTUPHANESI", ad: "Tekman Halk Kütüphanesi", kisa_ad: "Halk Kütüphanesi" },

  // Askerlik
  { key: "askerlik", tip: "ASKERLIK_SUBESI", ad: "Tekman Askerlik Şubesi Başkanlığı", kisa_ad: "Askerlik Şubesi" },
];
