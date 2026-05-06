// Pusula seed — paylaşılan tipler & sabitler.
// Kontrol kuralı 29: dosya max 400 satır. Tipler buradan re-export edilir.

import type { BirimTipi } from "@prisma/client";

export const IL = "Erzurum";
export const ILCE = "Tekman";
export const PAROLA = "Pusula2026!";
export const REFERANS_TARIH = new Date("2026-05-05T09:00:00+03:00");

export type BirimAnahtar =
  | "kaymakamlik"
  | "ozelKalem"
  | "yaziIsleri"
  | "milliEgitim"
  | "saglik"
  | "emniyet"
  | "jandarma"
  | "jandarmaKarakolu"
  | "mal"
  | "vergi"
  | "sydv"
  | "asdm"
  | "belediye"
  | "nufus"
  | "secimKurulu"
  | "tarim"
  | "muftuluk"
  | "genclikSpor"
  | "afad"
  | "itfaiye"
  | "kizilay"
  | "lise"
  | "ilkokul"
  | "ortaokul"
  | "imamHatip"
  | "halkEgitim"
  | "ramKurumu"
  | "hastane"
  | "asm"
  | "tsm"
  | "eczane"
  | "muhtarlik"
  | "koyMuhtar"
  | "ptt"
  | "askerlik"
  | "karayollari"
  | "tedas"
  | "ziraatBank"
  | "tapuKadastro"
  | "ziraatOdasi"
  | "ormanIsletme"
  | "kutuphane"
  | "kyk";

export type KullaniciAnahtar =
  // sistem & makam
  | "admin"
  | "kaymakam"
  | "yaziIsleriMudur"
  // özel kalem
  | "ozelAmir"
  | "ozelMemur"
  | "ozelMemur2"
  // yazı işleri
  | "yaziAmir"
  | "yaziMemur"
  | "yaziMemur2"
  | "evrakKayit"
  // milli eğitim
  | "milliAmir"
  | "milliMemur"
  | "milliRehber"
  // sağlık
  | "saglikAmir"
  | "saglikMemur"
  | "hastaneBashekim"
  | "asmDoktor"
  // emniyet & asayiş
  | "emniyetAmir"
  | "emniyetMemur"
  | "trafikMemur"
  | "jandarmaAmir"
  | "jandarmaAstsubay"
  // mali & vergi
  | "malAmir"
  | "malMemur"
  | "vergiSef"
  // sosyal hizmet
  | "sydvMemur"
  | "sydvSosyalCalisan"
  | "asdmAmir"
  // belediye
  | "belediyeAmir"
  | "belediyeFenIsleri"
  // nüfus & seçim
  | "nufusMemur"
  | "secimMemuru"
  // tarım & orman
  | "tarimAmir"
  | "ormanSefi"
  // afet & kızılay & itfaiye
  | "afadAmir"
  | "itfaiyeAmir"
  | "kizilayMemur"
  // okullar
  | "liseMudur"
  | "ilkokulMudur"
  | "imamHatipMudur"
  | "halkEgitimMudur"
  // muhtar
  | "muhtar"
  | "koyMuhtar"
  // diğer kurumlar
  | "muftu"
  | "ptmMudur"
  | "askerlikSubeBaskan"
  | "tapuMudur"
  | "tedasSef"
  // onay durumu farklı
  | "bekleyen"
  | "bekleyen2"
  | "reddedilen";

export type BirimSeed = {
  key: BirimAnahtar;
  tip: BirimTipi;
  ad: string;
  kisa_ad: string;
};

export type KullaniciSeed = {
  key: KullaniciAnahtar;
  email: string;
  ad: string;
  soyad: string;
  unvan: string;
  rol: string;
  birim?: BirimAnahtar;
  onay?: "BEKLIYOR" | "ONAYLANDI" | "REDDEDILDI";
  aktif?: boolean;
  red_sebebi?: string;
};

export type Idli = { id: string };
export type KullaniciKayit = Idli & { email: string; ad: string; soyad: string };
export type EtiketKayit = Idli & { ad: string };

export type SeedCtx = {
  birimler: Map<BirimAnahtar, Idli>;
  kullanicilar: Map<KullaniciAnahtar, KullaniciKayit>;
  kartlar: Map<string, Idli>;
};

// Yorum içeriğinde `@<KullaniciAnahtar>` placeholder kullanılır; seed runtime
// `lib/mention-format.ts` MENTION_UUID_REGEX uyumlu `@<uuid>` formatına
// dönüştürür → UI mention parser'ı doğrudan render eder. Threading için
// `yanit` opsiyonel: aynı kart yorumlar dizisindeki bir önceki yorumun
// 0-tabanlı index'ini referans verir; seed iki pas (önce yorum oluştur, sonra
// yanit_yorum_id güncelle) ile çözer.
//
// ADR-0023 — `aciklama` düz metin seed kolaylığı için kalır; runtime'da
// `metinTiptapDokumana()` ile Tiptap doc'a sarılır. Bazı kartlara zengin
// metin örneği vermek için opsiyonel `aciklamaDokuman` (tam Tiptap doc)
// alanı ekli; bu alan dolu ise `aciklama` plaintext'i sadece denormalize
// `aciklama_metin` kolonu için referans alınır.
import type { TiptapDokuman } from "@/lib/tiptap";

export type KartSeed = {
  key: string;
  baslik: string;
  aciklama: string;
  aciklamaDokuman?: TiptapDokuman;
  etiketler: string[];
  yetkililer?: KullaniciAnahtar[];
  birimler?: BirimAnahtar[];
  bitis?: Date;
  baslangic?: Date;
  tamamlandi?: boolean;
  arsiv?: boolean;
  kontrol?: Array<{
    ad: string;
    maddeler: Array<{
      metin: string;
      atanan?: KullaniciAnahtar;
      tamam?: boolean;
      // tamamlanma zamanını gun cinsinden REFERANS_TARIH'e göre belirler.
      // Çeşitlendirme için: -7, -3, -1, 0 gibi.
      tamamlanmaGun?: number;
    }>;
  }>;
  yorumlar?: Array<{
    yazan: KullaniciAnahtar;
    icerik: string;
    gunFarki?: number;
    saat?: number;
    // Bu yorumun, aynı array'deki kaçıncı yoruma yanıt verdiği (0-tabanlı).
    yanit?: number;
    duzenlendi?: boolean;
  }>;
  ekler?: Array<{ ad: string; mime: string; boyut: number; yukleyen?: KullaniciAnahtar }>;
};

export type ListeSeed = {
  ad: string;
  yetkililer?: KullaniciAnahtar[];
  birimler?: BirimAnahtar[];
  kartlar: KartSeed[];
};

export type ProjeSeed = {
  key: string;
  ad: string;
  aciklama: string;
  olusturan: KullaniciAnahtar;
  yetkililer: KullaniciAnahtar[];
  birimler: BirimAnahtar[];
  kapakRenk?: string;
  kapakIkon?: string;
  yildizli?: boolean;
  arsiv?: boolean;
  etiketler?: Array<{ ad: string; renk: string }>;
  listeler: ListeSeed[];
};

export const VARSAYILAN_ETIKETLER: Array<{ ad: string; renk: string }> = [
  { ad: "Acil", renk: "#ef4444" },
  { ad: "Kaymakamlık", renk: "#2563eb" },
  { ad: "Saha", renk: "#16a34a" },
  { ad: "Eğitim", renk: "#7c3aed" },
  { ad: "Sağlık", renk: "#0891b2" },
  { ad: "Yazışma", renk: "#f59e0b" },
  { ad: "Beklemede", renk: "#64748b" },
  { ad: "Sosyal Yardım", renk: "#db2777" },
  { ad: "Güvenlik", renk: "#475569" },
  { ad: "Kurumsal", renk: "#1e40af" },
];
