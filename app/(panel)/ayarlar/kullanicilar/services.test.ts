import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

// Test ortamında mail tarafını mock'la — Resend gerçek gönderim yapmasın,
// davet flow'u DB tarafında doğrulansın.
vi.mock("@/lib/mail", () => ({
  mailGonder: vi.fn(async () => {}),
  mailHtmlRender: vi.fn(async () => "<html>mock</html>"),
  MailGonderimHatasi: class MailGonderimHatasi extends Error {},
}));

import {
  davetOlustur,
  kullanicilariListele,
  kullaniciyiGuncelle,
  kullaniciyiOnayla,
  kullaniciyiReddet,
} from "./services";
import { truncateAll } from "@/tests/db/setup";
import { ortamKur, type Ortam } from "@/tests/fixtures/proje";
import argon2 from "argon2";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;

async function bekleyenKullaniciOlustur(args: {
  birimId: string;
  email: string;
  ad?: string;
  soyad?: string;
}): Promise<{ id: string; email: string }> {
  const parolaHash = await argon2.hash("Test1234!", { type: argon2.argon2id });
  return adminDb.kullanici.create({
    data: {
      birim_id: args.birimId,
      email: args.email,
      parola_hash: parolaHash,
      ad: args.ad ?? "Bekleyen",
      soyad: args.soyad ?? "Kullanıcı",
      aktif: false,
      onay_durumu: "BEKLIYOR",
    },
    select: { id: true, email: true },
  });
}

async function onayliKullaniciOlustur(args: {
  birimId: string | null;
  email: string;
}): Promise<{ id: string; email: string }> {
  const parolaHash = await argon2.hash("Test1234!", { type: argon2.argon2id });
  return adminDb.kullanici.create({
    data: {
      birim_id: args.birimId,
      email: args.email,
      parola_hash: parolaHash,
      ad: "Onaylı",
      soyad: "Kullanıcı",
      aktif: true,
      onay_durumu: "ONAYLANDI",
      onay_zamani: new Date(),
    },
    select: { id: true, email: true },
  });
}

async function rolIdAl(kod: string): Promise<string> {
  const rol = await adminDb.rol.findUnique({
    where: { kod },
    select: { id: true },
  });
  if (!rol) throw new Error(`${kod} rolü bulunamadı.`);
  return rol.id;
}

async function kaymakamKullaniciOlustur(email: string): Promise<string> {
  const kullanici = await onayliKullaniciOlustur({ birimId: null, email });
  await adminDb.kullaniciRol.create({
    data: { kullanici_id: kullanici.id, rol_id: await rolIdAl("KAYMAKAM") },
  });
  return kullanici.id;
}

beforeAll(async () => {
  await adminDb.$connect();
});

afterAll(async () => {
  await adminDb.$disconnect();
});

beforeEach(async () => {
  await truncateAll(adminDb);
  ortam = await ortamKur(adminDb);
});

describe("makam rol politikası", () => {
  it("Kaymakam rolü kullanıcıyı birimsiz günceller", async () => {
    const hedef = await onayliKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "kaymakam-adayi@test.local",
    });

    await kullaniciyiGuncelle(
      {
        id: hedef.id,
        ad: "Murat",
        soyad: "Aksoy",
        unvan: "Kaymakam",
        telefon: "",
        birim_id: null,
        aktif: true,
        rol_idleri: [await rolIdAl("KAYMAKAM")],
      },
      ortam.superAdmin.id,
    );

    const guncel = await adminDb.kullanici.findUnique({
      where: { id: hedef.id },
      select: {
        birim_id: true,
        roller: { select: { rol: { select: { kod: true } } } },
      },
    });
    expect(guncel?.birim_id).toBeNull();
    expect(guncel?.roller.map((r) => r.rol.kod)).toEqual(["KAYMAKAM"]);
  });

  it("ikinci Kaymakam rolünü reddeder", async () => {
    await kaymakamKullaniciOlustur("kaymakam@test.local");
    const hedef = await onayliKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "ikinci-kaymakam@test.local",
    });

    await expect(
      kullaniciyiGuncelle(
        {
          id: hedef.id,
          ad: "İkinci",
          soyad: "Kaymakam",
          unvan: "",
          telefon: "",
          birim_id: null,
          aktif: true,
          rol_idleri: [await rolIdAl("KAYMAKAM")],
        },
        ortam.superAdmin.id,
      ),
    ).rejects.toThrow("zaten Kaymakam rolüne sahip");
  });

  it("birim rolü birimsiz bırakılırsa reddeder", async () => {
    const hedef = await onayliKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "birimsiz-personel@test.local",
    });

    await expect(
      kullaniciyiGuncelle(
        {
          id: hedef.id,
          ad: "Birim",
          soyad: "Personeli",
          unvan: "",
          telefon: "",
          birim_id: null,
          aktif: true,
          rol_idleri: [await rolIdAl("PERSONEL")],
        },
        ortam.superAdmin.id,
      ),
    ).rejects.toThrow("birim seçimi zorunludur");
  });

  it("Kaymakam daveti birimsiz oluşturulur", async () => {
    const davet = await davetOlustur(ortam.superAdmin.id, {
      email: "davet-kaymakam@test.local",
      rol_id: await rolIdAl("KAYMAKAM"),
      birim_id: null,
      proje_baglamlari: [], liste_baglamlari: [], kart_baglamlari: [],
    });

    const kayit = await adminDb.davetTokeni.findUnique({
      where: { id: davet.id },
      select: { birim_id: true },
    });
    expect(kayit?.birim_id).toBeNull();
  });

  it("Kaymakam rolü için ikinci aktif daveti reddeder", async () => {
    const rolId = await rolIdAl("KAYMAKAM");
    await davetOlustur(ortam.superAdmin.id, {
      email: "ilk-kaymakam-daveti@test.local",
      rol_id: rolId,
      birim_id: null,
      proje_baglamlari: [], liste_baglamlari: [], kart_baglamlari: [],
    });

    await expect(
      davetOlustur(ortam.superAdmin.id, {
        email: "ikinci-kaymakam-daveti@test.local",
        rol_id: rolId,
        birim_id: null,
        proje_baglamlari: [], liste_baglamlari: [], kart_baglamlari: [],
      }),
    ).rejects.toThrow("zaten geçerli bir davet");
  });

  // ADR-0010: davet ile birlikte projeye yetkili tayini
  it("proje_baglamlari ile davet üretildiğinde DavetProjeBaglami kayıtları yazılır", async () => {
    const proje = await adminDb.proje.create({
      data: {
        ad: "Davet Hedef Projesi",
        sira: "M",
        olusturan_id: ortam.superAdmin.id,
      },
      select: { id: true },
    });

    const davet = await davetOlustur(ortam.superAdmin.id, {
      email: "yeni-uye@test.local",
      rol_id: null,
      birim_id: ortam.birim.id,
      proje_baglamlari: [{ proje_id: proje.id }],
      liste_baglamlari: [],
      kart_baglamlari: [],
    });

    const baglamlar = await adminDb.davetProjeBaglami.findMany({
      where: { davet_id: davet.id },
      select: { proje_id: true },
    });
    expect(baglamlar).toEqual([{ proje_id: proje.id }]);
  });

  it("aynı e-posta için aktif davet varken ikinciyi reddeder", async () => {
    await davetOlustur(ortam.superAdmin.id, {
      email: "tek-davet@test.local",
      rol_id: null,
      birim_id: ortam.birim.id,
      proje_baglamlari: [], liste_baglamlari: [], kart_baglamlari: [],
    });

    await expect(
      davetOlustur(ortam.superAdmin.id, {
        email: "tek-davet@test.local",
        rol_id: null,
        birim_id: ortam.birim.id,
        proje_baglamlari: [], liste_baglamlari: [], kart_baglamlari: [],
      }),
    ).rejects.toThrow("aktif bir davet zaten var");
  });

  // ADR-0013: kart davet bağlamı → davet kabul edilince kart yetkilisi olur.
  it("kart davet bağlamı kart_id ile yazılır", async () => {
    const proje = await adminDb.proje.create({
      data: {
        ad: "Kart Davet Projesi",
        sira: "M",
        olusturan_id: ortam.superAdmin.id,
      },
      select: { id: true },
    });
    const liste = await adminDb.liste.create({
      data: { proje_id: proje.id, ad: "L", sira: "M" },
      select: { id: true },
    });
    const kart = await adminDb.kart.create({
      data: { liste_id: liste.id, baslik: "K", sira: "M" },
      select: { id: true },
    });

    const davet = await davetOlustur(ortam.superAdmin.id, {
      email: "kart-davet@test.local",
      rol_id: null,
      birim_id: ortam.birim.id,
      proje_baglamlari: [],
      liste_baglamlari: [],
      kart_baglamlari: [{ kart_id: kart.id }],
    });

    const baglam = await adminDb.davetKartBaglami.findMany({
      where: { davet_id: davet.id },
      select: { kart_id: true },
    });
    expect(baglam).toEqual([{ kart_id: kart.id }]);
    // Proje bağlamı YAZILMAMIŞ olmalı
    const projeBaglam = await adminDb.davetProjeBaglami.findMany({
      where: { davet_id: davet.id },
    });
    expect(projeBaglam).toEqual([]);
  });

  it("silinmiş projeye davet bağlamı reddedilir", async () => {
    const proje = await adminDb.proje.create({
      data: {
        ad: "Silinmiş Proje",
        sira: "M",
        olusturan_id: ortam.superAdmin.id,
        silindi_mi: true,
        silinme_zamani: new Date(),
      },
      select: { id: true },
    });

    await expect(
      davetOlustur(ortam.superAdmin.id, {
        email: "silinmis-proje-davet@test.local",
        rol_id: null,
        birim_id: ortam.birim.id,
        proje_baglamlari: [{ proje_id: proje.id }],
        liste_baglamlari: [],
        kart_baglamlari: [],
      }),
    ).rejects.toThrow("geçerli değil");
  });
});

describe("kullanicilariListele — onay alanları", () => {
  it("BEKLIYOR durumundaki kullanıcı listede onay_durumu+red_sebebi ile döner", async () => {
    const k = await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "bekleyen-liste@test.local",
      ad: "Aday",
      soyad: "Personel",
    });

    const sonuc = await kullanicilariListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "bekleyen-liste",
    });

    const satir = sonuc.kayitlar.find((x) => x.id === k.id);
    expect(satir).toBeDefined();
    expect(satir?.onay_durumu).toBe("BEKLIYOR");
    expect(satir?.aktif).toBe(false);
    expect(satir?.red_sebebi).toBeNull();
  });

  it("REDDEDILDI kullanıcı red_sebebi ve onay_zamani ile döner", async () => {
    const k = await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "reddedilmis-liste@test.local",
    });
    await kullaniciyiReddet(k.id, ortam.superAdmin.id, "Sahte e-posta.");

    const sonuc = await kullanicilariListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "reddedilmis-liste",
    });

    const satir = sonuc.kayitlar.find((x) => x.id === k.id);
    expect(satir?.onay_durumu).toBe("REDDEDILDI");
    expect(satir?.red_sebebi).toBe("Sahte e-posta.");
    expect(satir?.onay_zamani).toBeInstanceOf(Date);
    expect(satir?.aktif).toBe(false);
  });

  it("ONAYLANDI + aktif=true kullanıcı normal şekilde listelenir", async () => {
    const k = await onayliKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "aktif-liste@test.local",
    });

    const sonuc = await kullanicilariListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "aktif-liste",
    });

    const satir = sonuc.kayitlar.find((x) => x.id === k.id);
    expect(satir?.onay_durumu).toBe("ONAYLANDI");
    expect(satir?.aktif).toBe(true);
    expect(satir?.red_sebebi).toBeNull();
  });

  it("BEKLIYOR kullanıcılar listenin başında sıralanır (ADR-0025)", async () => {
    // Aynı arama prefix'iyle hem ONAYLANDI hem BEKLIYOR kullanıcı oluştur,
    // BEKLIYOR olan listenin başında olmalı (Prisma enum ASC: BEKLIYOR < ONAYLANDI).
    await onayliKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "siralama-onayli@test.local",
    });
    const bekleyen = await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "siralama-bekleyen@test.local",
      ad: "Zeki",
      soyad: "Yılmaz",
    });

    const sonuc = await kullanicilariListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "siralama-",
    });

    expect(sonuc.kayitlar.length).toBeGreaterThanOrEqual(2);
    // BEKLIYOR kayıt "Zeki" alfabetik olarak en sona düşeceği halde,
    // onay_durumu ASC sıralaması onu başa taşıdı.
    expect(sonuc.kayitlar[0]?.id).toBe(bekleyen.id);
    expect(sonuc.kayitlar[0]?.onay_durumu).toBe("BEKLIYOR");
  });

  it("onay_durumu filtresi sadece o durumu döner", async () => {
    await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "filtre-bekleyen@test.local",
    });
    await onayliKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "filtre-onayli@test.local",
    });

    const sadeceBekleyen = await kullanicilariListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      onay_durumu: "BEKLIYOR",
      arama: "filtre-",
    });

    expect(sadeceBekleyen.kayitlar.length).toBeGreaterThanOrEqual(1);
    for (const s of sadeceBekleyen.kayitlar) {
      expect(s.onay_durumu).toBe("BEKLIYOR");
    }
  });

  it("bekleyenSayisi filtreden bağımsız toplam bekleyen sayısını döner", async () => {
    await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "sayac-1@test.local",
    });
    await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "sayac-2@test.local",
    });
    await onayliKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "sayac-onayli@test.local",
    });

    // Sayfa 'onayli' filtreli olsa bile bekleyenSayisi tüm bekleyenleri sayar.
    const sonuc = await kullanicilariListele({
      sayfa: 1,
      sayfaBoyutu: 20,
      arama: "sayac-onayli",
    });

    expect(sonuc.bekleyenSayisi).toBe(2);
  });
});

describe("kullaniciyiOnayla", () => {
  it("onay_durumu=ONAYLANDI, aktif=true, onaylayan_id ve onay_zamani set", async () => {
    const k = await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "y@test.local",
    });
    const onceki = Date.now();
    await kullaniciyiOnayla(k.id, ortam.superAdmin.id);
    const guncel = await adminDb.kullanici.findUnique({ where: { id: k.id } });
    expect(guncel?.onay_durumu).toBe("ONAYLANDI");
    expect(guncel?.aktif).toBe(true);
    expect(guncel?.onaylayan_id).toBe(ortam.superAdmin.id);
    expect(guncel?.onay_zamani?.getTime()).toBeGreaterThanOrEqual(onceki);
    expect(guncel?.red_sebebi).toBeNull();
  });
});

describe("kullaniciyiReddet", () => {
  it("onay_durumu=REDDEDILDI, aktif=false, red_sebebi set", async () => {
    const k = await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "z@test.local",
    });
    await kullaniciyiReddet(
      k.id,
      ortam.superAdmin.id,
      "Sahte e-posta adresi",
    );
    const guncel = await adminDb.kullanici.findUnique({ where: { id: k.id } });
    expect(guncel?.onay_durumu).toBe("REDDEDILDI");
    expect(guncel?.aktif).toBe(false);
    expect(guncel?.red_sebebi).toBe("Sahte e-posta adresi");
    expect(guncel?.onaylayan_id).toBe(ortam.superAdmin.id);
  });
});
