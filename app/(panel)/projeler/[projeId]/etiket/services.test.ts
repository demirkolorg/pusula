import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  etiketleriListele,
  etiketOlustur,
  etiketGuncelle,
  etiketSil,
  kartaEtiketEkle,
  kartaEtiketKaldir,
  kartinEtiketleri,
} from "./services";
import {
  ortamKur,
  projeOlusturFiks,
  listeOlusturFiks,
  kartOlusturFiks,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";
import { EylemHatasi } from "@/lib/action-wrapper";

// Etiket modülü — pg-test integration. Mock yasak (Kural 80).

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;

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

// =====================================================================
// Etiket CRUD
// =====================================================================

describe("etiketleriListele", () => {
  it("projedeki etiketleri olusturma sirasinda doner", async () => {
    const proje = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });

    const e1 = await etiketOlustur(ortam.kurum.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    const e2 = await etiketOlustur(ortam.kurum.id, {
      proje_id: proje.id,
      ad: "Bilgi",
      renk: "#3b82f6",
    });

    const liste = await etiketleriListele(ortam.kurum.id, proje.id);
    expect(liste.map((x) => x.id)).toEqual([e1.id, e2.id]);
    expect(liste[0]!.ad).toBe("Acil");
    expect(liste[1]!.renk).toBe("#3b82f6");
  });

  it("baska kurumun projesinden etiket okuma BULUNAMADI verir", async () => {
    const yabanci = await projeOlusturFiks(adminDb, {
      kurumId: ortam.digerKurum.id,
    });
    await expect(
      etiketleriListele(ortam.kurum.id, yabanci.id),
    ).rejects.toBeInstanceOf(EylemHatasi);
  });
});

describe("etiketOlustur", () => {
  it("ayni projede ayni adli etiket reddedilir (P2002)", async () => {
    const proje = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    await etiketOlustur(ortam.kurum.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await expect(
      etiketOlustur(ortam.kurum.id, {
        proje_id: proje.id,
        ad: "Acil",
        renk: "#22c55e",
      }),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("farkli projelerde ayni adli etiket olabilir", async () => {
    const p1 = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    const p2 = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    await etiketOlustur(ortam.kurum.id, {
      proje_id: p1.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await expect(
      etiketOlustur(ortam.kurum.id, {
        proje_id: p2.id,
        ad: "Acil",
        renk: "#ef4444",
      }),
    ).resolves.toMatchObject({ ad: "Acil" });
  });
});

describe("etiketGuncelle", () => {
  it("ad ve rengi gunceller", async () => {
    const proje = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    const e = await etiketOlustur(ortam.kurum.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });
    await etiketGuncelle(ortam.kurum.id, {
      id: e.id,
      ad: "Y",
      renk: "#ef4444",
    });
    const liste = await etiketleriListele(ortam.kurum.id, proje.id);
    expect(liste[0]).toMatchObject({ ad: "Y", renk: "#ef4444" });
  });

  it("baska kurumun etiketini guncellemek BULUNAMADI verir", async () => {
    const yabanci = await projeOlusturFiks(adminDb, {
      kurumId: ortam.digerKurum.id,
    });
    const e = await adminDb.etiket.create({
      data: { proje_id: yabanci.id, ad: "Z", renk: "#171717" },
    });
    await expect(
      etiketGuncelle(ortam.kurum.id, { id: e.id, ad: "Yeni" }),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });
});

describe("etiketSil", () => {
  it("etiketi siler ve KartEtiket baglarini cascade ile dusurur", async () => {
    const proje = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.kurum.id, {
      proje_id: proje.id,
      ad: "Acil",
      renk: "#ef4444",
    });
    await kartaEtiketEkle(ortam.kurum.id, kart.id, e.id);

    await etiketSil(ortam.kurum.id, e.id);

    const kalanlar = await etiketleriListele(ortam.kurum.id, proje.id);
    expect(kalanlar).toEqual([]);
    const baglar = await adminDb.kartEtiket.findMany({
      where: { kart_id: kart.id },
    });
    expect(baglar).toEqual([]);
  });
});

// =====================================================================
// Karta etiket atama
// =====================================================================

describe("kartaEtiketEkle", () => {
  it("karta etiket ekler ve idempotent calisir", async () => {
    const proje = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.kurum.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });

    await kartaEtiketEkle(ortam.kurum.id, kart.id, e.id);
    await kartaEtiketEkle(ortam.kurum.id, kart.id, e.id); // ikinci kez — patlamaz

    const ids = await kartinEtiketleri(ortam.kurum.id, kart.id);
    expect(ids).toEqual([e.id]);
  });

  it("baska projedeki etiketi karta eklemek YETKISIZ verir", async () => {
    const projeA = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    const projeB = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: projeA.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const eB = await etiketOlustur(ortam.kurum.id, {
      proje_id: projeB.id,
      ad: "Yanlis",
      renk: "#171717",
    });

    await expect(
      kartaEtiketEkle(ortam.kurum.id, kart.id, eB.id),
    ).rejects.toMatchObject({ kod: "YETKISIZ" });
  });
});

describe("kartaEtiketKaldir", () => {
  it("karttan etiketi cikarir, var olmayan baglanti idempotent", async () => {
    const proje = await projeOlusturFiks(adminDb, { kurumId: ortam.kurum.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const e = await etiketOlustur(ortam.kurum.id, {
      proje_id: proje.id,
      ad: "X",
      renk: "#22c55e",
    });
    await kartaEtiketEkle(ortam.kurum.id, kart.id, e.id);

    await kartaEtiketKaldir(ortam.kurum.id, kart.id, e.id);
    await kartaEtiketKaldir(ortam.kurum.id, kart.id, e.id); // ikinci kez — patlamaz

    const ids = await kartinEtiketleri(ortam.kurum.id, kart.id);
    expect(ids).toEqual([]);
  });
});
