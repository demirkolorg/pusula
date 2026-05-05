// Tekman ilçesinde aktif personel — sistemin kullanıcı kazandıkça
// gerçek bir kaymakamlık panelinde görüleceği yoğunlukta hesap.

import type { KullaniciSeed } from "./tipler";

export const KULLANICILAR: KullaniciSeed[] = [
  // ===== Sistem & Makam =====
  { key: "admin", email: "admin@pusula.local", ad: "Sistem", soyad: "Yöneticisi", unvan: "Süper Admin", rol: "SUPER_ADMIN" },
  { key: "kaymakam", email: "kaymakam@tekman.gov.tr", ad: "Murat", soyad: "Aksoy", unvan: "Kaymakam", rol: "KAYMAKAM" },
  { key: "yaziIsleriMudur", email: "yaziisleri.mudur@tekman.gov.tr", ad: "Tuba", soyad: "Bayrak", unvan: "Yazı İşleri Müdürü (V.)", rol: "BIRIM_AMIRI", birim: "yaziIsleri" },

  // ===== Özel Kalem =====
  { key: "ozelAmir", email: "ozelkalem.amir@tekman.gov.tr", ad: "Mehmet", soyad: "Yıldız", unvan: "Özel Kalem Müdürü", rol: "BIRIM_AMIRI", birim: "ozelKalem" },
  { key: "ozelMemur", email: "ozelkalem.memur@tekman.gov.tr", ad: "Elif", soyad: "Kaya", unvan: "Özel Kalem Memuru", rol: "PERSONEL", birim: "ozelKalem" },
  { key: "ozelMemur2", email: "ozelkalem.sekreter@tekman.gov.tr", ad: "Aslı", soyad: "Bilgin", unvan: "Makam Sekreteri", rol: "PERSONEL", birim: "ozelKalem" },

  // ===== Yazı İşleri =====
  { key: "yaziAmir", email: "yaziisleri.amir@tekman.gov.tr", ad: "Selim", soyad: "Demir", unvan: "Yazı İşleri Şefi", rol: "BIRIM_AMIRI", birim: "yaziIsleri" },
  { key: "yaziMemur", email: "yaziisleri.memur@tekman.gov.tr", ad: "Derya", soyad: "Şahin", unvan: "Veri Hazırlama Memuru", rol: "PERSONEL", birim: "yaziIsleri" },
  { key: "yaziMemur2", email: "yaziisleri.evrak@tekman.gov.tr", ad: "Hasan", soyad: "Tunç", unvan: "Evrak Memuru", rol: "PERSONEL", birim: "yaziIsleri" },
  { key: "evrakKayit", email: "evrak.kayit@tekman.gov.tr", ad: "Sevda", soyad: "Karaca", unvan: "Gelen-Giden Evrak Sorumlusu", rol: "PERSONEL", birim: "yaziIsleri" },

  // ===== Milli Eğitim =====
  { key: "milliAmir", email: "mem.amir@tekman.gov.tr", ad: "Ayşe", soyad: "Çelik", unvan: "İlçe Milli Eğitim Müdürü", rol: "BIRIM_AMIRI", birim: "milliEgitim" },
  { key: "milliMemur", email: "mem.personel@tekman.gov.tr", ad: "Yusuf", soyad: "Arslan", unvan: "Şube Müdürü", rol: "PERSONEL", birim: "milliEgitim" },
  { key: "milliRehber", email: "mem.rehber@tekman.gov.tr", ad: "Beste", soyad: "Akın", unvan: "Rehberlik Şube Sorumlusu", rol: "PERSONEL", birim: "milliEgitim" },

  // ===== Sağlık =====
  { key: "saglikAmir", email: "saglik.amir@tekman.gov.tr", ad: "Zeynep", soyad: "Aydın", unvan: "İlçe Sağlık Müdürü", rol: "BIRIM_AMIRI", birim: "saglik" },
  { key: "saglikMemur", email: "saglik.personel@tekman.gov.tr", ad: "Kerem", soyad: "Koç", unvan: "Sağlık Memuru", rol: "PERSONEL", birim: "saglik" },
  { key: "hastaneBashekim", email: "bashekim@tekmanhastane.gov.tr", ad: "Doç. Dr. Cenk", soyad: "Erol", unvan: "Başhekim", rol: "BIRIM_AMIRI", birim: "hastane" },
  { key: "asmDoktor", email: "asm.hekim@tekman.gov.tr", ad: "Dr. Sema", soyad: "Yalçın", unvan: "Aile Hekimi", rol: "PERSONEL", birim: "asm" },

  // ===== Emniyet & Asayiş =====
  { key: "emniyetAmir", email: "emniyet.amir@tekman.gov.tr", ad: "Hakan", soyad: "Polat", unvan: "İlçe Emniyet Amiri", rol: "BIRIM_AMIRI", birim: "emniyet" },
  { key: "emniyetMemur", email: "emniyet.personel@tekman.gov.tr", ad: "Burcu", soyad: "Kurt", unvan: "Polis Memuru", rol: "PERSONEL", birim: "emniyet" },
  { key: "trafikMemur", email: "emniyet.trafik@tekman.gov.tr", ad: "Erdem", soyad: "Sönmez", unvan: "Trafik Tescil Memuru", rol: "PERSONEL", birim: "emniyet" },
  { key: "jandarmaAmir", email: "jandarma.amir@tekman.gov.tr", ad: "Bnb. İbrahim", soyad: "Eren", unvan: "İlçe Jandarma Komutanı", rol: "BIRIM_AMIRI", birim: "jandarma" },
  { key: "jandarmaAstsubay", email: "jandarma.kara@tekman.gov.tr", ad: "Astsb. Onur", soyad: "Yıldırım", unvan: "Karakol Komutan Yardımcısı", rol: "PERSONEL", birim: "jandarmaKarakolu" },

  // ===== Mali & Vergi =====
  { key: "malAmir", email: "malmudurlugu.amir@tekman.gov.tr", ad: "Nesrin", soyad: "Güneş", unvan: "Mal Müdürü", rol: "BIRIM_AMIRI", birim: "mal" },
  { key: "malMemur", email: "malmudurlugu.memur@tekman.gov.tr", ad: "Hilal", soyad: "Doğan", unvan: "Veznedar", rol: "PERSONEL", birim: "mal" },
  { key: "vergiSef", email: "vergi.sef@tekman.gov.tr", ad: "Reyhan", soyad: "Tek", unvan: "Vergi Dairesi Şefi", rol: "BIRIM_AMIRI", birim: "vergi" },

  // ===== Sosyal Hizmet =====
  { key: "sydvMemur", email: "sydv.personel@tekman.gov.tr", ad: "Fatma", soyad: "Öztürk", unvan: "Sosyal Yardım İnceleme Görevlisi", rol: "PERSONEL", birim: "sydv" },
  { key: "sydvSosyalCalisan", email: "sydv.sosyal@tekman.gov.tr", ad: "Damla", soyad: "Yılmaz", unvan: "Sosyal Çalışmacı", rol: "PERSONEL", birim: "sydv" },
  { key: "asdmAmir", email: "asdm.amir@tekman.gov.tr", ad: "Gül", soyad: "Aksoy", unvan: "Aile ve Sosyal Hizmetler İlçe Müdürü", rol: "BIRIM_AMIRI", birim: "asdm" },

  // ===== Belediye =====
  { key: "belediyeAmir", email: "belediye.amir@tekman.bel.tr", ad: "Cem", soyad: "Kaplan", unvan: "Fen İşleri Sorumlusu", rol: "BIRIM_AMIRI", birim: "belediye" },
  { key: "belediyeFenIsleri", email: "belediye.fen@tekman.bel.tr", ad: "Berk", soyad: "Şener", unvan: "Yol Bakım Sorumlusu", rol: "PERSONEL", birim: "belediye" },

  // ===== Nüfus & Seçim =====
  { key: "nufusMemur", email: "nufus.personel@tekman.gov.tr", ad: "Merve", soyad: "Uçar", unvan: "Nüfus Memuru", rol: "PERSONEL", birim: "nufus" },
  { key: "secimMemuru", email: "secim.kurul@tekman.gov.tr", ad: "Hatice", soyad: "Çakır", unvan: "Seçim Kurulu Yazı İşleri Md.", rol: "BIRIM_AMIRI", birim: "secimKurulu" },

  // ===== Tarım & Orman =====
  { key: "tarimAmir", email: "tarim.amir@tekman.gov.tr", ad: "Faruk", soyad: "Can", unvan: "İlçe Tarım Müdürü", rol: "BIRIM_AMIRI", birim: "tarim" },
  { key: "ormanSefi", email: "orman.sef@tekman.gov.tr", ad: "Tarık", soyad: "Aydoğdu", unvan: "Orman İşletme Şefi", rol: "BIRIM_AMIRI", birim: "ormanIsletme" },

  // ===== Afet & Kızılay & İtfaiye =====
  { key: "afadAmir", email: "afad.amir@tekman.gov.tr", ad: "Engin", soyad: "Aksu", unvan: "AFAD İlçe Sorumlusu", rol: "BIRIM_AMIRI", birim: "afad" },
  { key: "itfaiyeAmir", email: "itfaiye.amir@tekman.bel.tr", ad: "Bahadır", soyad: "Kılıç", unvan: "İtfaiye Çavuşu", rol: "BIRIM_AMIRI", birim: "itfaiye" },
  { key: "kizilayMemur", email: "kizilay.sube@tekman.gov.tr", ad: "Sevim", soyad: "Aktaş", unvan: "Şube Sorumlusu", rol: "PERSONEL", birim: "kizilay" },

  // ===== Okullar =====
  { key: "liseMudur", email: "lise.mudur@tekman.k12.tr", ad: "Levent", soyad: "Özdemir", unvan: "Anadolu Lisesi Müdürü", rol: "BIRIM_AMIRI", birim: "lise" },
  { key: "ilkokulMudur", email: "ilkokul.mudur@tekman.k12.tr", ad: "Nurten", soyad: "Aksu", unvan: "İlkokul Müdürü", rol: "BIRIM_AMIRI", birim: "ilkokul" },
  { key: "imamHatipMudur", email: "imamhatip.mudur@tekman.k12.tr", ad: "Yakup", soyad: "Sezer", unvan: "İmam Hatip Lisesi Müdürü", rol: "BIRIM_AMIRI", birim: "imamHatip" },
  { key: "halkEgitimMudur", email: "hem.mudur@tekman.gov.tr", ad: "Sibel", soyad: "Soylu", unvan: "Halk Eğitim Merkezi Müdürü", rol: "BIRIM_AMIRI", birim: "halkEgitim" },

  // ===== Muhtarlık =====
  { key: "muhtar", email: "vatan.muhtar@tekman.gov.tr", ad: "Hüseyin", soyad: "Bal", unvan: "Vatan Mahallesi Muhtarı", rol: "PERSONEL", birim: "muhtarlik" },
  { key: "koyMuhtar", email: "karaagac.muhtar@tekman.gov.tr", ad: "Recep", soyad: "Tan", unvan: "Karaağaç Köyü Muhtarı", rol: "PERSONEL", birim: "koyMuhtar" },

  // ===== Diğer kurumlar =====
  { key: "muftu", email: "muftu@tekman.gov.tr", ad: "İhsan", soyad: "Akkaya", unvan: "İlçe Müftüsü", rol: "BIRIM_AMIRI", birim: "muftuluk" },
  { key: "ptmMudur", email: "ptt.mudur@tekman.gov.tr", ad: "Tolga", soyad: "Kuş", unvan: "PTT Şube Müdürü", rol: "BIRIM_AMIRI", birim: "ptt" },
  { key: "askerlikSubeBaskan", email: "askerlik.baskan@tekman.gov.tr", ad: "Yzb. Mete", soyad: "Erkan", unvan: "Askerlik Şubesi Başkanı", rol: "BIRIM_AMIRI", birim: "askerlik" },
  { key: "tapuMudur", email: "tapu.mudur@tekman.gov.tr", ad: "Pınar", soyad: "Solmaz", unvan: "Tapu Müdürü", rol: "BIRIM_AMIRI", birim: "tapuKadastro" },
  { key: "tedasSef", email: "tedas.sef@tekman.gov.tr", ad: "Murat", soyad: "Bektaş", unvan: "İşletme Şefi", rol: "BIRIM_AMIRI", birim: "tedas" },

  // ===== Onay sürecindekiler =====
  { key: "bekleyen", email: "bekleyen@tekman.gov.tr", ad: "Onur", soyad: "Sarı", unvan: "Aday Personel", rol: "PERSONEL", birim: "tarim", onay: "BEKLIYOR" },
  { key: "bekleyen2", email: "stajyer@tekman.gov.tr", ad: "İrem", soyad: "Akman", unvan: "Stajyer", rol: "PERSONEL", birim: "halkEgitim", onay: "BEKLIYOR" },
  { key: "reddedilen", email: "reddedilen@tekman.gov.tr", ad: "Pelin", soyad: "Acar", unvan: "Eski Başvuru", rol: "PERSONEL", birim: "muftuluk", onay: "REDDEDILDI", aktif: false, red_sebebi: "Seed örneği: eksik başvuru bilgisi." },
];
