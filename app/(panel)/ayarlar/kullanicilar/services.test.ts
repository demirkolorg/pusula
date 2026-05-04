import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  bekleyenKullanicilariListele,
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

describe("bekleyenKullanicilariListele", () => {
  it("sadece BEKLIYOR durumundaki silinmemiş kullanıcıları döner", async () => {
    await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "bekleyen1@test.local",
    });
    await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "bekleyen2@test.local",
    });

    const liste = await bekleyenKullanicilariListele();
    expect(liste).toHaveLength(2);
    expect(liste.map((k) => k.email).sort()).toEqual([
      "bekleyen1@test.local",
      "bekleyen2@test.local",
    ]);
  });

  it("ONAYLANDI ve REDDEDILDI durumlarını dışarıda bırakır", async () => {
    const o = await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "onayli@test.local",
    });
    const r = await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "reddedildi@test.local",
    });
    await kullaniciyiOnayla(o.id, ortam.superAdmin.id);
    await kullaniciyiReddet(r.id, ortam.superAdmin.id, "spam");

    const liste = await bekleyenKullanicilariListele();
    expect(liste).toHaveLength(0);
  });

  it("birim bilgisini içerir", async () => {
    await bekleyenKullaniciOlustur({
      birimId: ortam.birim.id,
      email: "x@test.local",
    });
    const liste = await bekleyenKullanicilariListele();
    expect(liste[0]?.birim?.id).toBe(ortam.birim.id);
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
