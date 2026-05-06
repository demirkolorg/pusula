import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DosyaGizlilik } from "@prisma/client";

// dosya-yetki.ts -> action-wrapper.ts -> @/auth -> next-auth zinciri jsdom
// altında `next/server` çözemiyor. Diğer services testlerinin (Kural 80
// istisnası: framework boundary) deseniyle aynı: auth boundary'sini mock'la.
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import { olusturTestDb, truncateAll } from "../tests/db/setup";
import {
  birimOlusturFiks,
  kartOlusturFiks,
  kullaniciOlusturFiks,
  listeOlusturFiks,
  ortamKur,
  projeOlusturFiks,
} from "../tests/fixtures/proje";
import { canDosya } from "./dosya-yetki";

const db = olusturTestDb();

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await truncateAll(db);
});

// Test fixture'ı (tests/fixtures/proje.ts) eski izinleri seed eder; dosya
// modülü için PERSONEL ve BIRIM_AMIRI'ye temel izinleri elle ekleyelim.
async function dosyaIzinleriniSeedle(): Promise<void> {
  const izinTanimlari = [
    { kod: "dosya:oku", ad: "Dosyaları Görüntüle" },
    { kod: "dosya:kendi-sil", ad: "Kendi Dosyanı Sil" },
    { kod: "dosya:baska-sil", ad: "Başkasının Dosyasını Sil" },
    { kod: "dosya:kalici-sil", ad: "Dosyayı Kalıcı Olarak Sil" },
  ];
  const olusanIzinler = await Promise.all(
    izinTanimlari.map((i) =>
      db.izin.upsert({
        where: { kod: i.kod },
        update: {},
        create: { kod: i.kod, ad: i.ad, kategori: "DOSYA" },
      }),
    ),
  );
  const personel = await db.rol.findUnique({ where: { kod: "PERSONEL" } });
  const personelIzin = ["dosya:oku", "dosya:kendi-sil"];
  if (personel) {
    for (const i of olusanIzinler) {
      if (!personelIzin.includes(i.kod)) continue;
      await db.rolIzin.upsert({
        where: { rol_id_izin_id: { rol_id: personel.id, izin_id: i.id } },
        update: {},
        create: { rol_id: personel.id, izin_id: i.id },
      });
    }
  }
}

const BUCKET = "test-bucket";

async function dosyaIle(args: {
  yukleyenId: string;
  gizlilik?: DosyaGizlilik;
  silindi?: boolean;
  kartId?: string;
  projeId?: string;
  listeId?: string;
}): Promise<{ id: string }> {
  const dosya = await db.dosya.create({
    data: {
      yukleyen_id: args.yukleyenId,
      ad: "test.pdf",
      mime: "application/pdf",
      kategori: "PDF",
      boyut: 1024,
      bucket: BUCKET,
      depolama_yolu: `dosyalar/2026/05/x/1/r.pdf`,
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
  } else if (args.listeId) {
    await db.dosyaBaglantisi.create({
      data: {
        dosya_id: dosya.id,
        kaynak_tip: "LISTE",
        kaynak_id: args.listeId,
        liste_id: args.listeId,
        proje_id: args.projeId ?? null,
        ekleyen_id: args.yukleyenId,
        birincil_mi: true,
      },
    });
  } else if (args.projeId) {
    await db.dosyaBaglantisi.create({
      data: {
        dosya_id: dosya.id,
        kaynak_tip: "PROJE",
        kaynak_id: args.projeId,
        proje_id: args.projeId,
        ekleyen_id: args.yukleyenId,
        birincil_mi: true,
      },
    });
  }
  return { id: dosya.id };
}

async function projeKartOrtami(birimId: string, olusturanId: string) {
  const proje = await projeOlusturFiks(db, {
    birimId,
    olusturanId,
  });
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

describe("canDosya", () => {
  describe("makam (KAYMAKAM)", () => {
    it("herhangi bir dosyayı her aksiyonla okur", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const baska = await projeKartOrtami(
        ortam.digerBirim.id,
        ortam.digerKullanici.id,
      );
      const dosya = await dosyaIle({
        yukleyenId: ortam.digerKullanici.id,
        kartId: baska.kart.id,
        listeId: baska.liste.id,
        projeId: baska.proje.id,
      });

      // ortam.superAdmin SUPER_ADMIN, ortam fixturesinde KAYMAKAM
      // yer almıyor — superAdmin'i makam olarak kullan.
      expect(
        await canDosya(ortam.superAdmin.id, "dosya:read", dosya.id),
      ).toBe(true);
      expect(
        await canDosya(ortam.superAdmin.id, "dosya:download", dosya.id),
      ).toBe(true);
      expect(
        await canDosya(ortam.superAdmin.id, "dosya:purge", dosya.id),
      ).toBe(true);
    });

    it("GIZLI dosyayı bile makam görür", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const baska = await projeKartOrtami(
        ortam.digerBirim.id,
        ortam.digerKullanici.id,
      );
      const dosya = await dosyaIle({
        yukleyenId: ortam.digerKullanici.id,
        gizlilik: DosyaGizlilik.GIZLI,
        kartId: baska.kart.id,
        listeId: baska.liste.id,
        projeId: baska.proje.id,
      });
      expect(
        await canDosya(ortam.superAdmin.id, "dosya:read", dosya.id),
      ).toBe(true);
    });
  });

  describe("personel — kaynak erişimi", () => {
    it("erişebildiği karta bağlı dosyayı okuyabilir", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
      const dosya = await dosyaIle({
        yukleyenId: ortam.personel.id,
        kartId: benim.kart.id,
        listeId: benim.liste.id,
        projeId: benim.proje.id,
      });
      expect(
        await canDosya(ortam.personel.id, "dosya:read", dosya.id),
      ).toBe(true);
    });

    it("erişimi olmayan başka birim projesindeki dosyayı GÖREMEZ", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const baskaBirim = await projeKartOrtami(
        ortam.digerBirim.id,
        ortam.digerKullanici.id,
      );
      const dosya = await dosyaIle({
        yukleyenId: ortam.digerKullanici.id,
        kartId: baskaBirim.kart.id,
        listeId: baskaBirim.liste.id,
        projeId: baskaBirim.proje.id,
      });
      // ortam.personel başka birime bağlı, yetkili değil
      expect(
        await canDosya(ortam.personel.id, "dosya:read", dosya.id),
      ).toBe(false);
    });

    it("bağlantısız orphan dosyayı yalnız yükleyen görür", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const dosya = await dosyaIle({ yukleyenId: ortam.personel.id });
      expect(
        await canDosya(ortam.personel.id, "dosya:read", dosya.id),
      ).toBe(true);
      // Başkası göremez
      const baskaBirim = await birimOlusturFiks(db, "Diğer Birim Y");
      const baskaKullanici = await kullaniciOlusturFiks(db, {
        birimId: baskaBirim.id,
        rolKod: "PERSONEL",
      });
      expect(
        await canDosya(baskaKullanici.id, "dosya:read", dosya.id),
      ).toBe(false);
    });
  });

  describe("gizlilik", () => {
    it("HASSAS dosyayı PERSONEL göremez", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
      const dosya = await dosyaIle({
        yukleyenId: ortam.personel.id,
        gizlilik: DosyaGizlilik.HASSAS,
        kartId: benim.kart.id,
        listeId: benim.liste.id,
        projeId: benim.proje.id,
      });
      expect(
        await canDosya(ortam.personel.id, "dosya:read", dosya.id),
      ).toBe(false);
    });

    it("GIZLI dosyayı yükleyen görür ama başka personel görmez", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
      const ikinciPersonel = await kullaniciOlusturFiks(db, {
        birimId: ortam.birim.id,
        rolKod: "PERSONEL",
      });
      // ikinciPersonel'i karta yetkili yap
      await db.kartYetkilisi.create({
        data: {
          kart_id: benim.kart.id,
          kullanici_id: ikinciPersonel.id,
        },
      });
      const dosya = await dosyaIle({
        yukleyenId: ortam.personel.id,
        gizlilik: DosyaGizlilik.GIZLI,
        kartId: benim.kart.id,
        listeId: benim.liste.id,
        projeId: benim.proje.id,
      });

      // Yükleyen kendisi görür
      expect(
        await canDosya(ortam.personel.id, "dosya:read", dosya.id),
      ).toBe(true);
      // Aynı karta erişimi olan ikinci personel GIZLI olduğu için göremez
      expect(
        await canDosya(ikinciPersonel.id, "dosya:read", dosya.id),
      ).toBe(false);
    });
  });

  describe("silme/restore", () => {
    it("kalıcı silme yalnız makam", async () => {
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
      const dosya = await dosyaIle({
        yukleyenId: ortam.personel.id,
        silindi: true,
        kartId: benim.kart.id,
        listeId: benim.liste.id,
        projeId: benim.proje.id,
      });
      expect(
        await canDosya(ortam.personel.id, "dosya:purge", dosya.id),
      ).toBe(false);
      expect(
        await canDosya(ortam.superAdmin.id, "dosya:purge", dosya.id),
      ).toBe(true);
    });

    it("yükleyen kendi dosyasını silebilir (kendi-sil)", async () => {
      // Default rol seed'i (rolIzinSeedle) DOSYA_KENDI_SIL içermiyor;
      // bu test için özel rol matrisini güncelleyelim — gerçek katalogda
      // PERSONEL_DOSYA bu izni içerir.
      const ortam = await ortamKur(db);
      await dosyaIzinleriniSeedle();
      // Test ortam fixture'ı PERSONEL'e dosya:kendi-sil iznini eklemiyor;
      // burada manuel ekleyelim
      const izin = await db.izin.upsert({
        where: { kod: "dosya:kendi-sil" },
        update: {},
        create: {
          kod: "dosya:kendi-sil",
          ad: "Kendi Dosyanı Sil",
          kategori: "DOSYA",
        },
      });
      const okIzin = await db.izin.upsert({
        where: { kod: "dosya:oku" },
        update: {},
        create: {
          kod: "dosya:oku",
          ad: "Dosyaları Görüntüle",
          kategori: "DOSYA",
        },
      });
      const personelRol = await db.rol.findUnique({
        where: { kod: "PERSONEL" },
      });
      if (personelRol) {
        await db.rolIzin.upsert({
          where: {
            rol_id_izin_id: { rol_id: personelRol.id, izin_id: izin.id },
          },
          update: {},
          create: { rol_id: personelRol.id, izin_id: izin.id },
        });
        await db.rolIzin.upsert({
          where: {
            rol_id_izin_id: { rol_id: personelRol.id, izin_id: okIzin.id },
          },
          update: {},
          create: { rol_id: personelRol.id, izin_id: okIzin.id },
        });
      }
      const benim = await projeKartOrtami(ortam.birim.id, ortam.personel.id);
      const dosya = await dosyaIle({
        yukleyenId: ortam.personel.id,
        kartId: benim.kart.id,
        listeId: benim.liste.id,
        projeId: benim.proje.id,
      });
      expect(
        await canDosya(ortam.personel.id, "dosya:delete", dosya.id),
      ).toBe(true);
    });
  });

  it("var olmayan dosya id'si false döner", async () => {
    const ortam = await ortamKur(db);
    expect(
      await canDosya(
        ortam.superAdmin.id,
        "dosya:read",
        "00000000-0000-0000-0000-000000000000",
      ),
    ).toBe(false);
  });
});
