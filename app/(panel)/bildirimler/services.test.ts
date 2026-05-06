import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  bildirimleriListele,
  bildirimOkuduIsaretle,
  bildirimUret,
  okunmamisSayisi,
  tumunuOkuduIsaretle,
} from "./services";
import {
  mentionParse,
  tetikleEklentiYuklendi,
  tetikleKartYetkiliAtama,
  tetikleMaddeAtama,
  tetikleYorumEklendi,
  tetikleYorumMention,
} from "./tetikleyiciler";
import {
  ortamKur,
  projeOlusturFiks,
  listeOlusturFiks,
  kartOlusturFiks,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;
let projeId: string;
let kart: { id: string };

async function sahipliProjeOlustur(birimId: string, sahipId: string) {
  const p = await projeOlusturFiks(adminDb, { birimId, olusturanId: sahipId });
  await adminDb.projeYetkilisi.create({
    data: { proje_id: p.id, kullanici_id: sahipId },
  });
  return { id: p.id };
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
  const proje = await sahipliProjeOlustur(ortam.birim.id, ortam.superAdmin.id);
  projeId = proje.id;
  const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
  kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
});

// =====================================================================
// CRUD: bildirim üret + listele + okudu işaretle
// =====================================================================

describe("bildirimUret", () => {
  it("birden fazla alıcıya tek tek bildirim üretir, üreteni dışlar", async () => {
    await adminDb.projeYetkilisi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id },
    });

    const r = await bildirimUret({
      alici_idler: [ortam.personel.id, ortam.superAdmin.id],
      ureten_id: ortam.superAdmin.id,
      tip: "KART_YETKILI_ATAMA",
      baslik: "Bir karta eklendiniz",
      kart_id: kart.id,
    });
    // SuperAdmin üreten — kendine bildirim atılmaz
    expect(r).toHaveLength(1);
    expect(r[0]!.alici_id).toBe(ortam.personel.id);
  });

  it("aynı alıcı listede iki kez varsa tek bildirim", async () => {
    const r = await bildirimUret({
      alici_idler: [ortam.personel.id, ortam.personel.id],
      ureten_id: ortam.superAdmin.id,
      tip: "KART_YETKILI_ATAMA",
      baslik: "X",
    });
    // personel + makam (superAdmin) — üreten superAdmin dışlanır → 1
    expect(r).toHaveLength(1);
  });

  // ADR-0022 — Makam (SUPER_ADMIN/KAYMAKAM) tüm bildirim akışına otomatik dahil
  it("SUPER_ADMIN ve KAYMAKAM alıcı listesinde olmasa bile otomatik eklenir", async () => {
    const kaymakamRol = await adminDb.rol.findUniqueOrThrow({
      where: { kod: "KAYMAKAM" },
    });
    const kaymakam = await adminDb.kullanici.create({
      data: {
        birim_id: ortam.birim.id,
        email: "kaymakam.test@pusula.local",
        parola_hash: "x",
        ad: "Kay",
        soyad: "Makam",
        aktif: true,
        onay_durumu: "ONAYLANDI",
        roller: { create: { rol_id: kaymakamRol.id } },
      },
      select: { id: true },
    });

    // Alıcı sadece personel; üreten digerKullanici (makam değil).
    const r = await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: ortam.digerKullanici.id,
      tip: "YORUM_EKLENDI",
      baslik: "Test",
    });
    const aliciIdler = r.map((x) => x.alici_id).sort();
    expect(aliciIdler).toEqual(
      [ortam.personel.id, ortam.superAdmin.id, kaymakam.id].sort(),
    );
  });

  it("üreten makam ise kendine bildirim atılmaz", async () => {
    const r = await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: ortam.superAdmin.id,
      tip: "YORUM_EKLENDI",
      baslik: "Test",
    });
    // SuperAdmin üreten → dışlanır. Sadece personel kalır.
    expect(r.map((x) => x.alici_id)).toEqual([ortam.personel.id]);
  });

  it("makam in_app tercihini kapatırsa otomatik dahil edilmez", async () => {
    await adminDb.bildirimTercih.create({
      data: {
        kullanici_id: ortam.superAdmin.id,
        tip: "YORUM_EKLENDI",
        in_app_acik: false,
        email_acik: false,
      },
    });
    const r = await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: ortam.digerKullanici.id,
      tip: "YORUM_EKLENDI",
      baslik: "Test",
    });
    // SuperAdmin tercihi kapalı → tercih süzgecinden eler. Personel kalır.
    expect(r.map((x) => x.alici_id)).toEqual([ortam.personel.id]);
  });
});

describe("bildirimleriListele", () => {
  it("kullanıcı sadece kendi bildirimlerini görür", async () => {
    await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: ortam.superAdmin.id,
      tip: "KART_YETKILI_ATAMA",
      baslik: "Personel bildirimi",
    });
    await bildirimUret({
      alici_idler: [ortam.superAdmin.id],
      ureten_id: null,
      tip: "BITIS_YAKLASIYOR",
      baslik: "SuperAdmin bildirimi",
    });

    const personelList = await bildirimleriListele(ortam.personel.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(personelList).toHaveLength(1);
    expect(personelList[0]!.baslik).toBe("Personel bildirimi");

    const superList = await bildirimleriListele(ortam.superAdmin.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(superList).toHaveLength(1);
    expect(superList[0]!.baslik).toBe("SuperAdmin bildirimi");
  });

  it("mention UUID'lerini bildirim metninde kullanıcı adına çevirir", async () => {
    const kisi = await adminDb.kullanici.findUniqueOrThrow({
      where: { id: ortam.personel.id },
      select: { ad: true, soyad: true },
    });
    const gorunenAd = `${kisi.ad} ${kisi.soyad}`.trim();

    const sonuc = await bildirimUret({
      alici_idler: [ortam.digerKullanici.id],
      ureten_id: ortam.superAdmin.id,
      tip: "YORUM_MENTION",
      baslik: `@${ortam.personel.id} sizden bahsetti`,
      ozet: `Yorum: @${ortam.personel.id}`,
    });

    const dbKaydi = await adminDb.bildirim.findUniqueOrThrow({
      where: { id: BigInt(sonuc[0]!.id) },
      select: { baslik: true, ozet: true },
    });
    expect(dbKaydi.baslik).toContain(`@${gorunenAd}`);
    expect(dbKaydi.ozet).toContain(`@${gorunenAd}`);
    expect(dbKaydi.baslik).not.toContain(ortam.personel.id);

    const liste = await bildirimleriListele(ortam.digerKullanici.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(liste[0]!.baslik).toContain(`@${gorunenAd}`);
    expect(liste[0]!.ozet).toContain(`@${gorunenAd}`);
  });

  it("filtre 'okunmamis' sadece okunmamışları döner", async () => {
    const r = await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: null,
      tip: "BITIS_YAKLASIYOR",
      baslik: "Test",
    });
    await bildirimOkuduIsaretle(ortam.personel.id, { ids: [r[0]!.id] });

    const okunmamis = await bildirimleriListele(ortam.personel.id, {
      filtre: "okunmamis",
      limit: 20,
    });
    expect(okunmamis).toHaveLength(0);

    const okunmus = await bildirimleriListele(ortam.personel.id, {
      filtre: "okunmus",
      limit: 20,
    });
    expect(okunmus).toHaveLength(1);
  });
});

describe("bildirimOkuduIsaretle", () => {
  it("başkasının bildirimini işaretleyemez", async () => {
    const r = await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: null,
      tip: "BITIS_YAKLASIYOR",
      baslik: "Personele",
    });
    await bildirimOkuduIsaretle(ortam.superAdmin.id, { ids: [r[0]!.id] });
    // Yine okunmamış kalmalı
    const okunmamis = await bildirimleriListele(ortam.personel.id, {
      filtre: "okunmamis",
      limit: 20,
    });
    expect(okunmamis).toHaveLength(1);
  });
});

describe("okunmamisSayisi + tumunuOkuduIsaretle", () => {
  it("sayım doğru, tümü işaretleme sıfırlar", async () => {
    await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: null,
      tip: "BITIS_YAKLASIYOR",
      baslik: "1",
    });
    await bildirimUret({
      alici_idler: [ortam.personel.id],
      ureten_id: null,
      tip: "BITIS_YAKLASIYOR",
      baslik: "2",
    });
    expect(await okunmamisSayisi(ortam.personel.id)).toBe(2);
    await tumunuOkuduIsaretle(ortam.personel.id);
    expect(await okunmamisSayisi(ortam.personel.id)).toBe(0);
  });
});

// =====================================================================
// Tetikleyiciler
// =====================================================================

describe("mentionParse", () => {
  it("UUID formatında mention'ları yakalar", () => {
    const ids = mentionParse(
      "Merhaba @00000000-0000-0000-0000-000000000001 ve @00000000-0000-0000-0000-000000000002",
    );
    expect(ids).toEqual([
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ]);
  });

  it("aynı UUID iki kez geçse tek seferdir döner", () => {
    const ids = mentionParse(
      "@00000000-0000-0000-0000-000000000001 @00000000-0000-0000-0000-000000000001",
    );
    expect(ids).toHaveLength(1);
  });

  it("UUID dışı @ler atlanır", () => {
    expect(mentionParse("Merhaba @ahmet")).toEqual([]);
  });
});

describe("tetikleYorumMention", () => {
  it("sadece karta erişimi olan yetkililere bildirim gönderir", async () => {
    await adminDb.projeYetkilisi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id },
    });

    await tetikleYorumMention({
      yorumId: "00000000-0000-0000-0000-000000000010",
      kartId: kart.id,
      yazanId: ortam.superAdmin.id,
      icerik: `Selam @${ortam.personel.id} ve @${ortam.digerKullanici.id}`,
    });

    // Personel proje yetkilisi olduğu için karta erişir → bildirim alır
    const personel = await bildirimleriListele(ortam.personel.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(personel).toHaveLength(1);
    expect(personel[0]!.tip).toBe("YORUM_MENTION");

    // diger kullanıcı karta erişmez → bildirim almamalı
    const yabanci = await bildirimleriListele(ortam.digerKullanici.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(yabanci).toHaveLength(0);
  });
});

describe("tetikleKartYetkiliAtama", () => {
  it("atayanın kendine bildirim atmaz", async () => {
    await tetikleKartYetkiliAtama({
      kartId: kart.id,
      atananId: ortam.superAdmin.id,
      atayanId: ortam.superAdmin.id,
    });
    const list = await bildirimleriListele(ortam.superAdmin.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(list).toHaveLength(0);
  });

  it("atanana bildirim üretir", async () => {
    await adminDb.projeYetkilisi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id },
    });
    await tetikleKartYetkiliAtama({
      kartId: kart.id,
      atananId: ortam.personel.id,
      atayanId: ortam.superAdmin.id,
    });
    const list = await bildirimleriListele(ortam.personel.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(list).toHaveLength(1);
    expect(list[0]!.tip).toBe("KART_YETKILI_ATAMA");
    expect(list[0]!.kart_id).toBe(kart.id);
  });
});

describe("tetikleYorumEklendi", () => {
  it("kart yetkililerine bildirim, yazan hariç", async () => {
    await adminDb.projeYetkilisi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id },
    });
    // Personeli karta yetkili yap, ayrıca superAdmin de proje yetkilisi
    await adminDb.kartYetkilisi.create({
      data: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });
    await adminDb.kartYetkilisi.create({
      data: { kart_id: kart.id, kullanici_id: ortam.superAdmin.id },
    });

    await tetikleYorumEklendi({
      yorumId: "00000000-0000-0000-0000-000000000020",
      kartId: kart.id,
      yazanId: ortam.superAdmin.id,
      icerik: "Test yorumu",
    });

    // Personel kart yetkilisi (yazan değil) → bildirim alır
    const personel = await bildirimleriListele(ortam.personel.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(personel).toHaveLength(1);
    expect(personel[0]!.tip).toBe("YORUM_EKLENDI");

    // Yazan superAdmin → bildirim almamalı
    const yazan = await bildirimleriListele(ortam.superAdmin.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(yazan).toHaveLength(0);
  });

  it("mention edilmiş kullanıcıya YORUM_EKLENDI atmaz (çift bildirim önleme)", async () => {
    await adminDb.projeYetkilisi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id },
    });
    await adminDb.kartYetkilisi.create({
      data: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });

    await tetikleYorumEklendi({
      yorumId: "00000000-0000-0000-0000-000000000030",
      kartId: kart.id,
      yazanId: ortam.superAdmin.id,
      icerik: `Hey @${ortam.personel.id} bak`,
    });

    // Personel mention edildi — YORUM_EKLENDI almamalı
    const list = await bildirimleriListele(ortam.personel.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(list).toHaveLength(0);
  });
});

describe("tetikleEklentiYuklendi", () => {
  it("kart yetkililerine bildirim, yükleyen hariç", async () => {
    await adminDb.projeYetkilisi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id },
    });
    await adminDb.kartYetkilisi.create({
      data: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });

    await tetikleEklentiYuklendi({
      eklentiId: "00000000-0000-0000-0000-000000000040",
      kartId: kart.id,
      yukleyenId: ortam.superAdmin.id,
      ad: "rapor.pdf",
    });

    const list = await bildirimleriListele(ortam.personel.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(list).toHaveLength(1);
    expect(list[0]!.tip).toBe("EKLENTI_YUKLENDI");
  });
});

describe("tetikleMaddeAtama", () => {
  it("madde atan değişince atanan kullanıcıya bildirim", async () => {
    await adminDb.projeYetkilisi.create({
      data: { proje_id: projeId, kullanici_id: ortam.personel.id },
    });
    const kl = await adminDb.kontrolListesi.create({
      data: { kart_id: kart.id, ad: "Liste", sira: "M" },
    });
    const m = await adminDb.kontrolMaddesi.create({
      data: {
        kontrol_listesi_id: kl.id,
        metin: "Yapılacak iş",
        sira: "M",
      },
      select: { id: true },
    });

    await tetikleMaddeAtama({
      maddeId: m.id,
      metin: "Yapılacak iş",
      atananId: ortam.personel.id,
      atayanId: ortam.superAdmin.id,
    });

    const list = await bildirimleriListele(ortam.personel.id, {
      filtre: "hepsi",
      limit: 20,
    });
    expect(list).toHaveLength(1);
    expect(list[0]!.tip).toBe("MADDE_ATAMA");
  });
});
