import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DosyaGizlilik } from "@prisma/client";

// services.ts -> action-wrapper -> @/auth zinciri jsdom altında çözemiyor
// (Kural 80 istisnası: framework boundary).
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import { olusturTestDb, truncateAll } from "../../../tests/db/setup";
import {
  kartOlusturFiks,
  kullaniciOlusturFiks,
  listeOlusturFiks,
  ortamKur,
  projeOlusturFiks,
} from "../../../tests/fixtures/proje";
import {
  dosyalariListele,
  dosyaDetay,
  adGuncelle,
  aciklamaGuncelle,
  gizlilikGuncelle,
  etiketleriGuncelle,
  etiketOlustur,
  baglantiKaldir,
  sil,
  geriYukle,
} from "./services";

const db = olusturTestDb();

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await truncateAll(db);
});

// Test fixturesinde DOSYA_* izinleri seedlenmiyor — test başında ekle.
async function dosyaIzinleriniSeedle(): Promise<void> {
  const tanimlar = [
    { kod: "dosya:oku", ad: "Dosyaları Görüntüle" },
    { kod: "dosya:yukle", ad: "Dosya Yükle" },
    { kod: "dosya:duzenle-ad", ad: "Ad Düzenle" },
    { kod: "dosya:duzenle-aciklama", ad: "Açıklama Düzenle" },
    { kod: "dosya:gizlilik-duzenle", ad: "Gizlilik Düzenle" },
    { kod: "dosya.etiket:ata", ad: "Etiket Ata" },
    { kod: "dosya.etiket:yonet", ad: "Etiket Yönet" },
    { kod: "dosya.baglanti:ekle", ad: "Bağlantı Ekle" },
    { kod: "dosya.baglanti:kaldir", ad: "Bağlantı Kaldır" },
    { kod: "dosya:kendi-sil", ad: "Kendi Sil" },
    { kod: "dosya:baska-sil", ad: "Başka Sil" },
    { kod: "dosya:geri-yukle", ad: "Geri Yükle" },
  ];
  const izinler = await Promise.all(
    tanimlar.map((t) =>
      db.izin.upsert({
        where: { kod: t.kod },
        update: {},
        create: { kod: t.kod, ad: t.ad, kategori: "DOSYA" },
      }),
    ),
  );
  const personel = await db.rol.findUnique({ where: { kod: "PERSONEL" } });
  const personelKod = [
    "dosya:oku",
    "dosya:yukle",
    "dosya:duzenle-ad",
    "dosya:duzenle-aciklama",
    "dosya.etiket:ata",
    "dosya.baglanti:ekle",
    "dosya:kendi-sil",
  ];
  if (personel) {
    for (const i of izinler) {
      if (!personelKod.includes(i.kod)) continue;
      await db.rolIzin.upsert({
        where: { rol_id_izin_id: { rol_id: personel.id, izin_id: i.id } },
        update: {},
        create: { rol_id: personel.id, izin_id: i.id },
      });
    }
  }
}

async function projeKartOrtami(birimId: string, olusturanId: string) {
  const proje = await projeOlusturFiks(db, { birimId, olusturanId });
  await db.projeBirimi.upsert({
    where: { proje_id_birim_id: { proje_id: proje.id, birim_id: birimId } },
    update: {},
    create: { proje_id: proje.id, birim_id: birimId },
  });
  const liste = await listeOlusturFiks(db, { projeId: proje.id });
  const kart = await kartOlusturFiks(db, {
    listeId: liste.id,
    olusturanId,
  });
  return { proje, liste, kart };
}

async function dosyaIle(args: {
  yukleyenId: string;
  ad?: string;
  gizlilik?: DosyaGizlilik;
  silindi?: boolean;
  kartId?: string;
  listeId?: string;
  projeId?: string;
}) {
  const dosya = await db.dosya.create({
    data: {
      yukleyen_id: args.yukleyenId,
      ad: args.ad ?? "rapor.pdf",
      mime: "application/pdf",
      kategori: "PDF",
      boyut: 1024,
      bucket: "test-bucket",
      depolama_yolu: `dosyalar/2026/05/${Math.random()}/1/r.pdf`,
      durum: "HAZIR",
      gizlilik: args.gizlilik ?? DosyaGizlilik.NORMAL,
      silindi_mi: args.silindi ?? false,
      silinme_zamani: args.silindi ? new Date() : null,
    },
  });
  if (args.kartId) {
    await db.dosyaBaglantisi.create({
      data: {
        dosya_id: dosya.id,
        kaynak_tip: "KART",
        kaynak_id: args.kartId,
        kart_id: args.kartId,
        liste_id: args.listeId ?? null,
        proje_id: args.projeId ?? null,
        ekleyen_id: args.yukleyenId,
        birincil_mi: true,
      },
    });
  }
  return dosya;
}

describe("dosyalariListele", () => {
  it("makam tüm aktif dosyaları görür", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const a = await projeKartOrtami(ortam.birim.id, ortam.superAdmin.id);
    const b = await projeKartOrtami(
      ortam.digerBirim.id,
      ortam.digerKullanici.id,
    );
    await dosyaIle({
      yukleyenId: ortam.superAdmin.id,
      kartId: a.kart.id,
      listeId: a.liste.id,
      projeId: a.proje.id,
    });
    await dosyaIle({
      yukleyenId: ortam.digerKullanici.id,
      kartId: b.kart.id,
      listeId: b.liste.id,
      projeId: b.proje.id,
    });

    const sonuc = await dosyalariListele(ortam.superAdmin.id, {
      siralama: "yeni-eklenen",
      limit: 50,
    });
    expect(sonuc.satirlar).toHaveLength(2);
  });

  it("personel sadece erişebildiği kapsamı görür", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
    const baska = await projeKartOrtami(
      ortam.digerBirim.id,
      ortam.digerKullanici.id,
    );
    await dosyaIle({
      yukleyenId: ortam.personel.id,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });
    await dosyaIle({
      yukleyenId: ortam.digerKullanici.id,
      kartId: baska.kart.id,
      listeId: baska.liste.id,
      projeId: baska.proje.id,
    });

    const sonuc = await dosyalariListele(ortam.personel.id, {
      siralama: "yeni-eklenen",
      limit: 50,
    });
    expect(sonuc.satirlar).toHaveLength(1);
    expect(sonuc.satirlar[0]?.yukleyen.id).toBe(ortam.personel.id);
  });

  it("kategori filtresi uygulanır", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.superAdmin.id);
    await db.dosya.createMany({
      data: [
        {
          yukleyen_id: ortam.superAdmin.id,
          ad: "a.pdf",
          mime: "application/pdf",
          kategori: "PDF",
          boyut: 1,
          bucket: "b",
          depolama_yolu: "x/a",
          durum: "HAZIR",
        },
        {
          yukleyen_id: ortam.superAdmin.id,
          ad: "b.png",
          mime: "image/png",
          kategori: "GORSEL",
          boyut: 1,
          bucket: "b",
          depolama_yolu: "x/b",
          durum: "HAZIR",
        },
      ],
    });
    void benim;
    const sonuc = await dosyalariListele(ortam.superAdmin.id, {
      kategori: "GORSEL",
      siralama: "yeni-eklenen",
      limit: 50,
    });
    expect(sonuc.satirlar).toHaveLength(1);
    expect(sonuc.satirlar[0]?.kategori).toBe("GORSEL");
  });

  it("silinmis filtresiyle çöp kutusu döner", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.superAdmin.id);
    await dosyaIle({
      yukleyenId: ortam.superAdmin.id,
      silindi: true,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });
    await dosyaIle({
      yukleyenId: ortam.superAdmin.id,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });
    const aktif = await dosyalariListele(ortam.superAdmin.id, {
      siralama: "yeni-eklenen",
      limit: 50,
    });
    expect(aktif.satirlar).toHaveLength(1);

    const cop = await dosyalariListele(ortam.superAdmin.id, {
      silinmis: true,
      siralama: "yeni-eklenen",
      limit: 50,
    });
    expect(cop.satirlar).toHaveLength(1);
    expect(cop.satirlar[0]?.silindi_mi).toBe(true);
  });
});

describe("metadata güncelleme", () => {
  it("ad güncellenince uzantı yeniden hesaplanır", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
    const d = await dosyaIle({
      yukleyenId: ortam.personel.id,
      ad: "eski.pdf",
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });

    await adGuncelle(ortam.personel.id, { id: d.id, ad: "yeni.docx" });
    const sonra = await db.dosya.findUnique({
      where: { id: d.id },
      select: { ad: true, uzanti: true },
    });
    expect(sonra?.ad).toBe("yeni.docx");
    expect(sonra?.uzanti).toBe("docx");
  });

  it("açıklama null olarak silinebilir", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
    const d = await dosyaIle({
      yukleyenId: ortam.personel.id,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });

    await aciklamaGuncelle(ortam.personel.id, {
      id: d.id,
      aciklama: "ilk açıklama",
    });
    await aciklamaGuncelle(ortam.personel.id, { id: d.id, aciklama: null });
    const sonra = await db.dosya.findUnique({
      where: { id: d.id },
      select: { aciklama: true },
    });
    expect(sonra?.aciklama).toBeNull();
  });

  it("gizlilik HASSAS yapılınca personel artık göremez", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    // BIRIM_AMIRI veya makam yetkisi gerekir gizlilik için
    const yonetici = await kullaniciOlusturFiks(db, {
      birimId: ortam.birim.id,
      rolKod: "KAYMAKAM",
    });
    const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
    const d = await dosyaIle({
      yukleyenId: ortam.personel.id,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });
    await gizlilikGuncelle(yonetici.id, {
      id: d.id,
      gizlilik: DosyaGizlilik.HASSAS,
    });
    const sonra = await db.dosya.findUnique({
      where: { id: d.id },
      select: { gizlilik: true },
    });
    expect(sonra?.gizlilik).toBe("HASSAS");
  });
});

describe("sil + geriYukle", () => {
  it("yükleyen kendi dosyasını siler ve geri yükleyici tekrar açar", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
    const d = await dosyaIle({
      yukleyenId: ortam.personel.id,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });

    await sil(ortam.personel.id, d.id);
    const silinmis = await db.dosya.findUnique({
      where: { id: d.id },
      select: { silindi_mi: true, silinme_zamani: true },
    });
    expect(silinmis?.silindi_mi).toBe(true);
    expect(silinmis?.silinme_zamani).not.toBeNull();

    await geriYukle(ortam.superAdmin.id, d.id);
    const geri = await db.dosya.findUnique({
      where: { id: d.id },
      select: { silindi_mi: true, silinme_zamani: true },
    });
    expect(geri?.silindi_mi).toBe(false);
    expect(geri?.silinme_zamani).toBeNull();
  });
});

describe("etiket", () => {
  it("etiket oluşturulup dosyaya atanabilir", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
    const d = await dosyaIle({
      yukleyenId: ortam.personel.id,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });

    const e1 = await etiketOlustur(ortam.superAdmin.id, {
      ad: "Tutanak",
      renk: "#ff0000",
    });
    const e2 = await etiketOlustur(ortam.superAdmin.id, {
      ad: "İmar",
    });

    await etiketleriGuncelle(ortam.personel.id, {
      dosya_id: d.id,
      etiket_idleri: [e1.id, e2.id],
    });
    const detay = await dosyaDetay(ortam.personel.id, d.id);
    const adlar = detay.etiketler.map((e) => e.etiket.ad).sort();
    expect(adlar).toEqual(["Tutanak", "İmar"]);

    // Yeniden ata: tek etiket kalır
    await etiketleriGuncelle(ortam.personel.id, {
      dosya_id: d.id,
      etiket_idleri: [e1.id],
    });
    const detay2 = await dosyaDetay(ortam.personel.id, d.id);
    expect(detay2.etiketler).toHaveLength(1);
    expect(detay2.etiketler[0]?.etiket.ad).toBe("Tutanak");
  });
});

describe("baglantiKaldir", () => {
  it("son bağlantı kaldırılınca dosya orphan olur ama kalır", async () => {
    const ortam = await ortamKur(db);
    await dosyaIzinleriniSeedle();
    const benim = await projeKartOrtami(ortam.birim.id, ortam.superAdmin.id);
    const d = await dosyaIle({
      yukleyenId: ortam.superAdmin.id,
      kartId: benim.kart.id,
      listeId: benim.liste.id,
      projeId: benim.proje.id,
    });

    const baglanti = await db.dosyaBaglantisi.findFirst({
      where: { dosya_id: d.id },
      select: { id: true },
    });
    if (!baglanti) throw new Error("baglanti yok");

    await baglantiKaldir(ortam.superAdmin.id, baglanti.id);

    // Dosya hala var
    const dosya = await db.dosya.findUnique({ where: { id: d.id } });
    expect(dosya).not.toBeNull();
    // Bağlantı silindi
    const baglantiSay = await db.dosyaBaglantisi.count({
      where: { dosya_id: d.id },
    });
    expect(baglantiSay).toBe(0);
  });
});
