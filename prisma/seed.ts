import {
  ListeTipi,
  PrismaClient,
  type BirimTipi,
  type IzinKategorisi,
} from "@prisma/client";
import argon2 from "argon2";
import { BIRIM_TIP_KATEGORI } from "../lib/constants/birim";
import {
  IZIN_ALT_KATEGORI,
  IZIN_KATEGORI,
  IZIN_TANIMLARI,
  TUM_IZIN_KODLARI,
  VARSAYILAN_ROL_IZINLERI,
  type IzinKodu,
} from "../lib/permissions-katalog";
import { siraSonuna } from "../lib/sira";

const db = new PrismaClient();

const IL = "Erzurum";
const ILCE = "Tekman";
const PAROLA = "Pusula2026!";
const REFERANS_TARIH = new Date("2026-05-05T09:00:00+03:00");

const ROLLER = [
  { kod: "SUPER_ADMIN", ad: "Süper Yönetici", aciklama: "Sistemin tamamına yetkili" },
  { kod: "KAYMAKAM", ad: "Kaymakam", aciklama: "İlçenin tamamına yetkili" },
  { kod: "BIRIM_AMIRI", ad: "Birim Amiri", aciklama: "Bağlı olduğu birimde yönetici" },
  { kod: "PERSONEL", ad: "Personel", aciklama: "Standart kullanıcı" },
];

// ADR-0013/0014: izin kataloğu lib/permissions-katalog.ts'ten gelir (tek otorite).
// Seed yalnızca DB'ye yansıtır; UI'dan yeni izin oluşturulamaz.
const IZINLER: Array<{
  kod: IzinKodu;
  ad: string;
  aciklama: string;
  kategori: IzinKategorisi;
  alt_kategori: string | null;
}> = TUM_IZIN_KODLARI.map((kod) => {
  const tanim = IZIN_TANIMLARI[kod];
  const kategori = IZIN_KATEGORI[kod];
  if (!tanim || !kategori) {
    throw new Error(`İzin kataloğu eksik: ${kod}`);
  }
  return {
    kod,
    ad: tanim.ad,
    aciklama: tanim.aciklama,
    kategori,
    alt_kategori: IZIN_ALT_KATEGORI[kod] ?? null,
  };
});

const ROL_IZINLERI: Record<string, IzinKodu[]> = VARSAYILAN_ROL_IZINLERI;

type Idli = { id: string };
type KullaniciKayit = Idli & { email: string; ad: string; soyad: string };
type BirimAnahtar =
  | "kaymakamlik"
  | "ozelKalem"
  | "yaziIsleri"
  | "milliEgitim"
  | "saglik"
  | "emniyet"
  | "jandarma"
  | "mal"
  | "sydv"
  | "belediye"
  | "nufus"
  | "tarim"
  | "muftuluk"
  | "genclikSpor"
  | "afad"
  | "lise"
  | "ilkokul"
  | "hastane"
  | "asm"
  | "eczane"
  | "muhtarlik";
type KullaniciAnahtar =
  | "admin"
  | "kaymakam"
  | "ozelAmir"
  | "ozelMemur"
  | "yaziAmir"
  | "yaziMemur"
  | "milliAmir"
  | "milliMemur"
  | "saglikAmir"
  | "saglikMemur"
  | "emniyetAmir"
  | "emniyetMemur"
  | "jandarmaAmir"
  | "malAmir"
  | "sydvMemur"
  | "belediyeAmir"
  | "nufusMemur"
  | "bekleyen"
  | "reddedilen";

type BirimSeed = {
  key: BirimAnahtar;
  tip: BirimTipi;
  ad: string;
  kisa_ad: string;
};
type KullaniciSeed = {
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
type EtiketKayit = Idli & { ad: string };
type SeedCtx = {
  birimler: Map<BirimAnahtar, Idli>;
  kullanicilar: Map<KullaniciAnahtar, KullaniciKayit>;
  kartlar: Map<string, Idli>;
};
type KartSeed = {
  key: string;
  baslik: string;
  aciklama: string;
  etiketler: string[];
  yetkililer?: KullaniciAnahtar[];
  birimler?: BirimAnahtar[];
  bitis?: Date;
  tamamlandi?: boolean;
  kontrol?: Array<{ ad: string; maddeler: Array<{ metin: string; atanan?: KullaniciAnahtar; tamam?: boolean }> }>;
  yorumlar?: Array<{ yazan: KullaniciAnahtar; icerik: string }>;
  ekler?: Array<{ ad: string; mime: string; boyut: number }>;
};

const BIRIMLER: BirimSeed[] = [
  { key: "kaymakamlik", tip: "KAYMAKAMLIK", ad: "Tekman Kaymakamlığı", kisa_ad: "Kaymakamlık" },
  { key: "ozelKalem", tip: "OZEL_KALEM", ad: "Özel Kalem", kisa_ad: "Özel Kalem" },
  { key: "yaziIsleri", tip: "YAZI_ISLERI_MUDURLUGU", ad: "Yazı İşleri Müdürlüğü", kisa_ad: "Yazı İşleri" },
  { key: "milliEgitim", tip: "ILCE_MILLI_EGITIM_MUDURLUGU", ad: "İlçe Milli Eğitim Müdürlüğü", kisa_ad: "Milli Eğitim" },
  { key: "saglik", tip: "ILCE_SAGLIK_MUDURLUGU", ad: "İlçe Sağlık Müdürlüğü", kisa_ad: "Sağlık" },
  { key: "emniyet", tip: "ILCE_EMNIYET_MUDURLUGU", ad: "İlçe Emniyet Amirliği", kisa_ad: "Emniyet" },
  { key: "jandarma", tip: "ILCE_JANDARMA_KOMUTANLIGI", ad: "İlçe Jandarma Komutanlığı", kisa_ad: "Jandarma" },
  { key: "mal", tip: "ILCE_MAL_MUDURLUGU", ad: "İlçe Mal Müdürlüğü", kisa_ad: "Mal Müdürlüğü" },
  { key: "sydv", tip: "SOSYAL_YARDIMLASMA_DAYANISMA_VAKFI", ad: "Sosyal Yardımlaşma ve Dayanışma Vakfı", kisa_ad: "SYDV" },
  { key: "belediye", tip: "BELEDIYE_BASKANLIGI", ad: "Tekman Belediyesi", kisa_ad: "Belediye" },
  { key: "nufus", tip: "ILCE_NUFUS_MUDURLUGU", ad: "İlçe Nüfus Müdürlüğü", kisa_ad: "Nüfus" },
  { key: "tarim", tip: "ILCE_TARIM_ORMAN_MUDURLUGU", ad: "İlçe Tarım ve Orman Müdürlüğü", kisa_ad: "Tarım" },
  { key: "muftuluk", tip: "ILCE_MUFTULUGU", ad: "İlçe Müftülüğü", kisa_ad: "Müftülük" },
  { key: "genclikSpor", tip: "ILCE_GENCLIK_SPOR_MUDURLUGU", ad: "Gençlik ve Spor İlçe Müdürlüğü", kisa_ad: "Gençlik Spor" },
  { key: "afad", tip: "AFAD_ILCE_BIRIMI", ad: "AFAD Tekman İlçe Birimi", kisa_ad: "AFAD" },
  { key: "lise", tip: "ANADOLU_LISESI", ad: "Tekman Anadolu Lisesi", kisa_ad: "Anadolu Lisesi" },
  { key: "ilkokul", tip: "ILKOKUL", ad: "Cumhuriyet İlkokulu", kisa_ad: "Cumhuriyet İlkokulu" },
  { key: "hastane", tip: "DEVLET_HASTANESI", ad: "Tekman Devlet Hastanesi", kisa_ad: "Devlet Hastanesi" },
  { key: "asm", tip: "AILE_SAGLIGI_MERKEZI", ad: "Merkez Aile Sağlığı Merkezi", kisa_ad: "Merkez ASM" },
  { key: "eczane", tip: "ECZANE", ad: "Kardelen Eczanesi", kisa_ad: "Kardelen Eczanesi" },
  { key: "muhtarlik", tip: "MAHALLE_MUHTARLIGI", ad: "Vatan Mahallesi Muhtarlığı", kisa_ad: "Vatan Muhtarlığı" },
];

const KULLANICILAR: KullaniciSeed[] = [
  { key: "admin", email: "admin@pusula.local", ad: "Sistem", soyad: "Yöneticisi", unvan: "Süper Admin", rol: "SUPER_ADMIN" },
  { key: "kaymakam", email: "kaymakam@tekman.gov.tr", ad: "Murat", soyad: "Aksoy", unvan: "Kaymakam", rol: "KAYMAKAM" },
  { key: "ozelAmir", email: "ozelkalem.amir@tekman.gov.tr", ad: "Mehmet", soyad: "Yıldız", unvan: "Özel Kalem Müdürü", rol: "BIRIM_AMIRI", birim: "ozelKalem" },
  { key: "ozelMemur", email: "ozelkalem.memur@tekman.gov.tr", ad: "Elif", soyad: "Kaya", unvan: "Özel Kalem Memuru", rol: "PERSONEL", birim: "ozelKalem" },
  { key: "yaziAmir", email: "yaziisleri.amir@tekman.gov.tr", ad: "Selim", soyad: "Demir", unvan: "Yazı İşleri Müdürü", rol: "BIRIM_AMIRI", birim: "yaziIsleri" },
  { key: "yaziMemur", email: "yaziisleri.memur@tekman.gov.tr", ad: "Derya", soyad: "Şahin", unvan: "Veri Hazırlama Memuru", rol: "PERSONEL", birim: "yaziIsleri" },
  { key: "milliAmir", email: "mem.amir@tekman.gov.tr", ad: "Ayşe", soyad: "Çelik", unvan: "Milli Eğitim Müdürü", rol: "BIRIM_AMIRI", birim: "milliEgitim" },
  { key: "milliMemur", email: "mem.personel@tekman.gov.tr", ad: "Yusuf", soyad: "Arslan", unvan: "Şube Personeli", rol: "PERSONEL", birim: "milliEgitim" },
  { key: "saglikAmir", email: "saglik.amir@tekman.gov.tr", ad: "Zeynep", soyad: "Aydın", unvan: "İlçe Sağlık Müdürü", rol: "BIRIM_AMIRI", birim: "saglik" },
  { key: "saglikMemur", email: "saglik.personel@tekman.gov.tr", ad: "Kerem", soyad: "Koç", unvan: "Sağlık Memuru", rol: "PERSONEL", birim: "saglik" },
  { key: "emniyetAmir", email: "emniyet.amir@tekman.gov.tr", ad: "Hakan", soyad: "Polat", unvan: "Emniyet Amiri", rol: "BIRIM_AMIRI", birim: "emniyet" },
  { key: "emniyetMemur", email: "emniyet.personel@tekman.gov.tr", ad: "Burcu", soyad: "Kurt", unvan: "Polis Memuru", rol: "PERSONEL", birim: "emniyet" },
  { key: "jandarmaAmir", email: "jandarma.amir@tekman.gov.tr", ad: "İbrahim", soyad: "Eren", unvan: "Jandarma Komutanı", rol: "BIRIM_AMIRI", birim: "jandarma" },
  { key: "malAmir", email: "malmudurlugu.amir@tekman.gov.tr", ad: "Nesrin", soyad: "Güneş", unvan: "Mal Müdürü", rol: "BIRIM_AMIRI", birim: "mal" },
  { key: "sydvMemur", email: "sydv.personel@tekman.gov.tr", ad: "Fatma", soyad: "Öztürk", unvan: "Sosyal Yardım İnceleme Görevlisi", rol: "PERSONEL", birim: "sydv" },
  { key: "belediyeAmir", email: "belediye.amir@tekman.bel.tr", ad: "Cem", soyad: "Kaplan", unvan: "Fen İşleri Sorumlusu", rol: "BIRIM_AMIRI", birim: "belediye" },
  { key: "nufusMemur", email: "nufus.personel@tekman.gov.tr", ad: "Merve", soyad: "Uçar", unvan: "Nüfus Memuru", rol: "PERSONEL", birim: "nufus" },
  { key: "bekleyen", email: "bekleyen@tekman.gov.tr", ad: "Onur", soyad: "Sarı", unvan: "Aday Personel", rol: "PERSONEL", birim: "tarim", onay: "BEKLIYOR" },
  { key: "reddedilen", email: "reddedilen@tekman.gov.tr", ad: "Pelin", soyad: "Acar", unvan: "Eski Başvuru", rol: "PERSONEL", birim: "muftuluk", onay: "REDDEDILDI", aktif: false, red_sebebi: "Seed örneği: eksik başvuru bilgisi." },
];

function gunEkle(gun: number, saat = 9): Date {
  return new Date(REFERANS_TARIH.getTime() + gun * 86_400_000 + (saat - 9) * 3_600_000);
}

function al<T>(map: Map<string, T>, key: string, ad: string): T {
  const deger = map.get(key);
  if (!deger) throw new Error(`${ad} bulunamadı: ${key}`);
  return deger;
}

function siraUretici(): () => string {
  let son: string | null = null;
  return () => {
    son = siraSonuna(son);
    return son;
  };
}

async function temizle(): Promise<void> {
  await db.yorum.updateMany({ data: { yanit_yorum_id: null } });
  await db.$transaction([
    db.bildirim.deleteMany(),
    db.aktiviteLogu.deleteMany(),
    db.hataLogu.deleteMany(),
    db.sifirlamaTokeni.deleteMany(),
    db.davetTokeni.deleteMany(),
    db.yorum.deleteMany(),
    db.eklenti.deleteMany(),
    db.kontrolMaddesi.deleteMany(),
    db.kontrolListesi.deleteMany(),
    db.kartEtiket.deleteMany(),
    db.kartYetkilisi.deleteMany(),
    db.kartBirimi.deleteMany(),
    db.kart.deleteMany(),
    db.etiket.deleteMany(),
    db.listeYetkilisi.deleteMany(),
    db.listeBirimi.deleteMany(),
    db.liste.deleteMany(),
    db.projeYetkilisi.deleteMany(),
    db.projeBirimi.deleteMany(),
    db.proje.deleteMany(),
    db.kullaniciRol.deleteMany(),
    db.rolIzin.deleteMany(),
    db.kullanici.deleteMany(),
    db.rol.deleteMany(),
    db.izin.deleteMany(),
    db.birim.deleteMany(),
  ]);
}

async function rolVeIzinleriYukle(): Promise<Map<string, Idli>> {
  await db.izin.createMany({ data: IZINLER });
  await db.rol.createMany({
    data: ROLLER.map((rol) => ({ ...rol, sistem_rolu: true })),
  });
  const izinler = new Map((await db.izin.findMany()).map((izin) => [izin.kod, izin]));
  const roller = new Map((await db.rol.findMany()).map((rol) => [rol.kod, rol]));
  await db.rolIzin.createMany({
    data: Object.entries(ROL_IZINLERI).flatMap(([rolKod, izinKodlari]) => {
      const rol = al(roller, rolKod, "Rol");
      return izinKodlari.map((izinKod) => ({
        rol_id: rol.id,
        izin_id: al(izinler, izinKod, "İzin").id,
      }));
    }),
  });
  return roller;
}

async function birimleriYukle(): Promise<Map<BirimAnahtar, Idli>> {
  const birimler = new Map<BirimAnahtar, Idli>();
  for (const birim of BIRIMLER) {
    const kayit = await db.birim.create({
      data: {
        tip: birim.tip,
        kategori: BIRIM_TIP_KATEGORI[birim.tip],
        ad: birim.ad,
        kisa_ad: birim.kisa_ad,
        il: IL,
        ilce: ILCE,
      },
      select: { id: true },
    });
    birimler.set(birim.key, kayit);
  }
  return birimler;
}

async function kullanicilariYukle(
  roller: Map<string, Idli>,
  birimler: Map<BirimAnahtar, Idli>,
): Promise<Map<KullaniciAnahtar, KullaniciKayit>> {
  const parolaHash = await argon2.hash(PAROLA, { type: argon2.argon2id });
  const kullanicilar = new Map<KullaniciAnahtar, KullaniciKayit>();
  for (const seed of KULLANICILAR) {
    const onay = seed.onay ?? "ONAYLANDI";
    const kullanici = await db.kullanici.create({
      data: {
        birim_id: seed.birim ? al(birimler, seed.birim, "Birim").id : null,
        email: seed.email,
        parola_hash: parolaHash,
        ad: seed.ad,
        soyad: seed.soyad,
        unvan: seed.unvan,
        aktif: seed.aktif ?? true,
        onay_durumu: onay,
        onay_zamani: onay === "ONAYLANDI" ? gunEkle(-45) : null,
        red_sebebi: seed.red_sebebi ?? null,
        email_dogrulandi: onay === "ONAYLANDI" ? gunEkle(-45) : null,
      },
      select: { id: true, email: true, ad: true, soyad: true },
    });
    await db.kullaniciRol.create({
      data: {
        kullanici_id: kullanici.id,
        rol_id: al(roller, seed.rol, "Rol").id,
        atayan_id: null,
      },
    });
    kullanicilar.set(seed.key, kullanici);
  }
  return kullanicilar;
}

async function etiketleriYukle(
  projeId: string,
  etiketler: Array<{ ad: string; renk: string }>,
): Promise<Map<string, EtiketKayit>> {
  await db.etiket.createMany({ data: etiketler.map((etiket) => ({ ...etiket, proje_id: projeId })) });
  return new Map((await db.etiket.findMany({ where: { proje_id: projeId } })).map((e) => [e.ad, e]));
}

async function listeOlustur(
  projeId: string,
  ad: string,
  sira: string,
  yetkililer: KullaniciAnahtar[],
  birimler: BirimAnahtar[],
  ctx: SeedCtx,
) {
  const liste = await db.liste.create({ data: { proje_id: projeId, ad, sira }, select: { id: true } });
  if (yetkililer.length) {
    await db.listeYetkilisi.createMany({
      data: yetkililer.map((k) => ({ liste_id: liste.id, kullanici_id: al(ctx.kullanicilar, k, "Kullanıcı").id })),
    });
  }
  if (birimler.length) {
    await db.listeBirimi.createMany({
      data: birimler.map((b) => ({ liste_id: liste.id, birim_id: al(ctx.birimler, b, "Birim").id })),
    });
  }
  return liste;
}

async function kartOlustur(
  listeId: string,
  sira: string,
  seed: KartSeed,
  ctx: SeedCtx,
  etiketler: Map<string, EtiketKayit>,
): Promise<Idli> {
  const kart = await db.kart.create({
    data: {
      liste_id: listeId,
      baslik: seed.baslik,
      aciklama: seed.aciklama,
      sira,
      bitis: seed.bitis ?? null,
      kapak_renk: seed.tamamlandi ? "secondary" : "primary",
      olusturan_id: al(ctx.kullanicilar, "ozelAmir", "Kullanıcı").id,
    },
    select: { id: true },
  });
  ctx.kartlar.set(seed.key, kart);
  if (seed.etiketler.length) {
    await db.kartEtiket.createMany({
      data: seed.etiketler.map((ad) => ({ kart_id: kart.id, etiket_id: al(etiketler, ad, "Etiket").id })),
    });
  }
  if (seed.yetkililer?.length) {
    await db.kartYetkilisi.createMany({
      data: seed.yetkililer.map((k) => ({ kart_id: kart.id, kullanici_id: al(ctx.kullanicilar, k, "Kullanıcı").id })),
    });
  }
  if (seed.birimler?.length) {
    await db.kartBirimi.createMany({
      data: seed.birimler.map((b) => ({ kart_id: kart.id, birim_id: al(ctx.birimler, b, "Birim").id })),
    });
  }
  for (const kontrol of seed.kontrol ?? []) {
    const kontrolSira = siraUretici();
    const kl = await db.kontrolListesi.create({
      data: { kart_id: kart.id, ad: kontrol.ad, sira: kontrolSira() },
      select: { id: true },
    });
    const maddeSira = siraUretici();
    await db.kontrolMaddesi.createMany({
      data: kontrol.maddeler.map((madde) => ({
        kontrol_listesi_id: kl.id,
        metin: madde.metin,
        sira: maddeSira(),
        atanan_id: madde.atanan ? al(ctx.kullanicilar, madde.atanan, "Kullanıcı").id : null,
        tamamlandi_mi: madde.tamam ?? false,
        tamamlama_zamani: madde.tamam ? gunEkle(-1, 16) : null,
      })),
    });
  }
  await db.yorum.createMany({
    data: (seed.yorumlar ?? []).map((yorum, i) => ({
      kart_id: kart.id,
      yazan_id: al(ctx.kullanicilar, yorum.yazan, "Kullanıcı").id,
      icerik: yorum.icerik,
      olusturma_zamani: gunEkle(-3 + i, 11),
    })),
  });
  await db.eklenti.createMany({
    data: (seed.ekler ?? []).map((ek) => ({
      kart_id: kart.id,
      yukleyen_id: al(ctx.kullanicilar, "yaziMemur", "Kullanıcı").id,
      ad: ek.ad,
      mime: ek.mime,
      boyut: ek.boyut,
      depolama_yolu: `seed/${kart.id}/${ek.ad}`,
    })),
  });
  return kart;
}

async function projeOlustur(args: {
  key: string;
  ad: string;
  aciklama: string;
  olusturan: KullaniciAnahtar;
  yetkililer: Array<{ kullanici: KullaniciAnahtar }>;
  birimler: BirimAnahtar[];
  listeler: Array<{ ad: string; yetkililer?: KullaniciAnahtar[]; birimler?: BirimAnahtar[]; kartlar: KartSeed[] }>;
  ctx: SeedCtx;
  // Kapak görsel kimliği (ADR-0010): renk token'ı + lucide ikon ismi.
  kapakRenk?: string;
  kapakIkon?: string;
}): Promise<Idli> {
  const proje = await db.proje.create({
    data: {
      ad: args.ad,
      aciklama: args.aciklama,
      kapak_renk: args.kapakRenk ?? null,
      kapak_ikon: args.kapakIkon ?? null,
      sira: siraSonuna(null),
      yildizli_mi: true,
      olusturan_id: al(args.ctx.kullanicilar, args.olusturan, "Kullanıcı").id,
    },
    select: { id: true },
  });
  // ADR-0009 — her projede otomatik Arşiv sistem listesi (sira=ZZZZ, en sağda)
  await db.liste.create({
    data: {
      proje_id: proje.id,
      ad: "Arşiv",
      sira: "ZZZZ",
      tip: ListeTipi.ARSIV,
    },
  });
  await db.projeYetkilisi.createMany({
    data: args.yetkililer.map((y) => ({
      proje_id: proje.id,
      kullanici_id: al(args.ctx.kullanicilar, y.kullanici, "Kullanıcı").id,
    })),
  });
  await db.projeBirimi.createMany({
    data: args.birimler.map((b) => ({ proje_id: proje.id, birim_id: al(args.ctx.birimler, b, "Birim").id })),
  });
  const etiketler = await etiketleriYukle(proje.id, [
    { ad: "Acil", renk: "#ef4444" },
    { ad: "Kaymakamlık", renk: "#2563eb" },
    { ad: "Saha", renk: "#16a34a" },
    { ad: "Eğitim", renk: "#7c3aed" },
    { ad: "Sağlık", renk: "#0891b2" },
    { ad: "Yazışma", renk: "#f59e0b" },
    { ad: "Beklemede", renk: "#64748b" },
  ]);
  const listeSira = siraUretici();
  for (const listeSeed of args.listeler) {
    const liste = await listeOlustur(
      proje.id,
      listeSeed.ad,
      listeSira(),
      listeSeed.yetkililer ?? [],
      listeSeed.birimler ?? [],
      args.ctx,
    );
    const kartSira = siraUretici();
    for (const kartSeed of listeSeed.kartlar) {
      await kartOlustur(liste.id, kartSira(), kartSeed, args.ctx, etiketler);
    }
  }
  return proje;
}

async function projeleriYukle(ctx: SeedCtx): Promise<void> {
  await projeOlustur({
    key: "kis",
    ad: "2026 Kış Tedbirleri ve Acil Müdahale Koordinasyonu",
    aciklama: "Tekman genelinde kış şartları, yol, sağlık ve güvenlik koordinasyonu.",
    olusturan: "ozelAmir",
    kapakRenk: "lacivert",
    kapakIkon: "snowflake",
    ctx,
    yetkililer: [
      { kullanici: "kaymakam" },
      { kullanici: "ozelAmir" },
      { kullanici: "yaziAmir" },
    ],
    birimler: ["ozelKalem", "emniyet", "jandarma", "saglik", "belediye", "afad"],
    listeler: [
      {
        ad: "Planlama",
        kartlar: [
          {
            key: "kis-kriz-masasi",
            baslik: "Kış kriz masası görev dağılımını onayla",
            aciklama: "Nöbet listeleri, iletişim zinciri ve ilk müdahale sorumluları netleştirilecek.",
            etiketler: ["Acil", "Kaymakamlık"],
            yetkililer: ["ozelMemur"],
            bitis: gunEkle(2, 17),
            kontrol: [{ ad: "Onay adımları", maddeler: [
              { metin: "Birim temsilcilerini kesinleştir", atanan: "ozelAmir", tamam: true },
              { metin: "Kaymakam onayına sun", atanan: "ozelMemur" },
            ] }],
            yorumlar: [{ yazan: "ozelAmir", icerik: "Taslak dağılım hazır. @emniyetAmir trafik nöbetlerini ekleyebilir mi?" }],
            ekler: [{ ad: "kriz-masasi-gorev-dagilimi.pdf", mime: "application/pdf", boyut: 184_320 }],
          },
          {
            key: "kis-yol-durumu",
            baslik: "Kırsal mahalle yol durumunu günlük takip et",
            aciklama: "Belediye, jandarma ve muhtar bildirimleri tek kartta toplanacak.",
            etiketler: ["Saha", "Beklemede"],
            birimler: ["jandarma", "belediye", "muhtarlik"],
            bitis: gunEkle(5, 18),
          },
        ],
      },
      {
        ad: "Saha Koordinasyonu",
        birimler: ["saglik"],
        kartlar: [
          {
            key: "kis-saglik-nobet",
            baslik: "Acil sağlık nöbet çizelgesini yayınla",
            aciklama: "ASM, hastane ve ambulans ekiplerinin haftalık nöbet planı paylaşılacak.",
            etiketler: ["Sağlık", "Acil"],
            yetkililer: ["saglikMemur"],
            bitis: gunEkle(1, 15),
            yorumlar: [{ yazan: "saglikAmir", icerik: "Hastane ve ASM planı birleştirildi; nöbetçi eczane ayrıca eklenecek." }],
          },
        ],
      },
      {
        ad: "Tamamlananlar",
        kartlar: [
          {
            key: "kis-stok",
            baslik: "Kumanya ve yakıt stok listesi güncellendi",
            aciklama: "KÖYDES ve belediye stok teyitleri alındı.",
            etiketler: ["Saha"],
            tamamlandi: true,
          },
        ],
      },
    ],
  });

  await projeOlustur({
    key: "okul",
    ad: "Okul Güvenliği ve Devamsızlık İzleme",
    aciklama: "Okul çevresi güvenliği, devamsızlık ve rehberlik takip süreci.",
    olusturan: "milliAmir",
    kapakRenk: "mor",
    kapakIkon: "graduation-cap",
    ctx,
    yetkililer: [
      { kullanici: "milliAmir" },
      { kullanici: "milliMemur" },
      { kullanici: "ozelAmir" },
    ],
    birimler: ["milliEgitim", "emniyet", "jandarma"],
    listeler: [
      {
        ad: "Okul Güvenliği",
        kartlar: [
          {
            key: "okul-servis",
            baslik: "Servis güzergahı risk noktalarını işaretle",
            aciklama: "Taşımalı eğitim güzergahlarındaki durak ve kavşak riskleri raporlanacak.",
            etiketler: ["Eğitim", "Saha"],
            birimler: ["emniyet", "jandarma"],
            bitis: gunEkle(7, 16),
          },
        ],
      },
      {
        ad: "Rehberlik ve Sosyal Destek",
        yetkililer: ["sydvMemur"],
        birimler: ["sydv"],
        kartlar: [
          {
            key: "okul-devamsizlik",
            baslik: "Kronik devamsızlık dosyalarını hane ziyaretiyle doğrula",
            aciklama: "Rehberlik servisi ve SYDV birlikte saha notlarını ekleyecek.",
            etiketler: ["Eğitim", "Beklemede"],
            yetkililer: ["sydvMemur"],
            bitis: gunEkle(10, 17),
            kontrol: [{ ad: "Dosya takibi", maddeler: [
              { metin: "Öğrenci listesi alınacak", atanan: "milliMemur", tamam: true },
              { metin: "İlk hane ziyareti planlanacak", atanan: "sydvMemur" },
            ] }],
          },
        ],
      },
    ],
  });

  await projeOlustur({
    key: "evrak",
    ad: "Vatandaş Talepleri ve Kurum Yazışmaları",
    aciklama: "Kaymakamlık makamına gelen taleplerin kurumlar arası yazışma takibi.",
    olusturan: "yaziAmir",
    kapakRenk: "kahve",
    kapakIkon: "file-text",
    ctx,
    yetkililer: [
      { kullanici: "yaziAmir" },
      { kullanici: "yaziMemur" },
      { kullanici: "kaymakam" },
    ],
    birimler: ["yaziIsleri", "mal", "nufus", "belediye"],
    listeler: [
      {
        ad: "Gelen Evrak",
        yetkililer: ["nufusMemur"],
        kartlar: [
          {
            key: "evrak-yardim-talebi",
            baslik: "Isınma yardımı başvurusu kurum görüşleri",
            aciklama: "SYDV incelemesi ve mal müdürlüğü uygunluk yazısı birlikte değerlendirilecek.",
            etiketler: ["Yazışma", "Beklemede"],
            yetkililer: ["malAmir"],
            birimler: ["sydv"],
            bitis: gunEkle(4, 16),
          },
          {
            key: "evrak-yol-talebi",
            baslik: "Mahalle içi yol bakım talebine cevap yazısı",
            aciklama: "Belediye keşif notu geldikten sonra nihai cevap hazırlanacak.",
            etiketler: ["Yazışma", "Saha"],
            yetkililer: ["belediyeAmir"],
          },
        ],
      },
      {
        ad: "Kapanan",
        kartlar: [
          {
            key: "evrak-nufus",
            baslik: "Nüfus kayıt örneği yönlendirmesi tamamlandı",
            aciklama: "Başvuru sahibi Nüfus Müdürlüğü işlem masasına yönlendirildi.",
            etiketler: ["Yazışma"],
            tamamlandi: true,
          },
        ],
      },
    ],
  });
}

async function destekVerileriniYukle(ctx: SeedCtx): Promise<void> {
  const admin = al(ctx.kullanicilar, "admin", "Kullanıcı");
  const ozel = al(ctx.kullanicilar, "ozelMemur", "Kullanıcı");
  const kart = al(ctx.kartlar, "kis-kriz-masasi", "Kart");
  await db.bildirim.createMany({
    data: [
      { alici_id: ozel.id, ureten_id: admin.id, tip: "KART_YETKILI_ATAMA", baslik: "Sistem Yöneticisi sizi bir kartta yetkilendirdi", ozet: "Kış kriz masası görev dağılımını onayla", kart_id: kart.id },
      { alici_id: ozel.id, ureten_id: null, tip: "BITIS_YAKLASIYOR", baslik: "Kart bitiş tarihi yaklaşıyor", ozet: "Kış kriz masası görev dağılımını onayla", kart_id: kart.id, meta: { bitis: gunEkle(2, 17).toISOString() } },
      { alici_id: al(ctx.kullanicilar, "emniyetAmir", "Kullanıcı").id, ureten_id: al(ctx.kullanicilar, "ozelAmir", "Kullanıcı").id, tip: "YORUM_MENTION", baslik: "Mehmet Yıldız sizden bahsetti", ozet: "Trafik nöbetleri eklenecek.", kart_id: kart.id },
    ],
  });
  await db.davetTokeni.create({
    data: {
      token: "seed-davet-muhtar-2026",
      email: "muhtar.adayi@tekman.gov.tr",
      birim_id: al(ctx.birimler, "muhtarlik", "Birim").id,
      rol_id: (await db.rol.findUnique({ where: { kod: "PERSONEL" } }))?.id,
      davet_eden_id: admin.id,
      son_kullanma: gunEkle(14),
    },
  });
  await db.sifirlamaTokeni.create({
    data: {
      token: "seed-sifirlama-yazi-2026",
      kullanici_id: al(ctx.kullanicilar, "yaziMemur", "Kullanıcı").id,
      son_kullanma: gunEkle(1),
    },
  });
  await db.hataLogu.createMany({
    data: [
      { seviye: "ERROR", taraf: "server", kullanici_id: admin.id, url: "/projeler", mesaj: "Seed örneği: geçici entegrasyon hatası", hata_tipi: "SeedDemoError", http_metod: "GET", http_durum: 500 },
      { seviye: "WARN", taraf: "client", kullanici_id: ozel.id, url: "/bildirimler", mesaj: "Seed örneği: bildirim gecikmesi", cozuldu_mu: true, cozum_notu: "Yeniden denendi." },
    ],
  });
  await db.aktiviteLogu.createMany({
    data: [
      { kullanici_id: admin.id, islem: "CREATE", kaynak_tip: "Proje", kaynak_id: kart.id, yeni_veri: { seed: true }, zaman: gunEkle(-6, 10) },
      { kullanici_id: ozel.id, islem: "UPDATE", kaynak_tip: "Kart", kaynak_id: kart.id, diff: { bitis: { eski: null, yeni: gunEkle(2, 17).toISOString() } }, zaman: gunEkle(-2, 14) },
      { kullanici_id: al(ctx.kullanicilar, "yaziAmir", "Kullanıcı").id, islem: "CREATE", kaynak_tip: "KartYetkilisi", kaynak_id: kart.id, yeni_veri: { kart_id: kart.id, kullanici_id: ozel.id }, zaman: gunEkle(-1, 12) },
    ],
  });
}

async function main(): Promise<void> {
  console.log("Seed başlıyor: mevcut veri temizlenecek.");
  await temizle();
  const roller = await rolVeIzinleriYukle();
  const birimler = await birimleriYukle();
  const kullanicilar = await kullanicilariYukle(roller, birimler);
  const ctx: SeedCtx = { birimler, kullanicilar, kartlar: new Map() };
  await projeleriYukle(ctx);
  await destekVerileriniYukle(ctx);
  console.log("Seed tamamlandı.");
  console.log(`Giriş parolası tüm seed kullanıcılarında: ${PAROLA}`);
  console.log("Örnek hesaplar: admin@pusula.local, kaymakam@tekman.gov.tr, ozelkalem.amir@tekman.gov.tr");
}

main()
  .catch((hata) => {
    console.error(hata);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
