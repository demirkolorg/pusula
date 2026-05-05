import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kapagiAyarla,
  kapagiKaldir,
  kapakRenginiAyarla,
  kapakRenginiKaldir,
} from "./services";
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
let kart: { id: string };

async function sahipliProjeOlustur(birimId: string, sahipId: string) {
  const p = await projeOlusturFiks(adminDb, { birimId, olusturanId: sahipId });
  await adminDb.projeYetkilisi.create({
    data: { proje_id: p.id, kullanici_id: sahipId, seviye: "ADMIN" },
  });
  return { id: p.id };
}

async function eklentiOlustur(opt: {
  kartId: string;
  yukleyenId: string;
  mime: string;
  ad?: string;
}): Promise<{ id: string }> {
  return adminDb.eklenti.create({
    data: {
      kart_id: opt.kartId,
      yukleyen_id: opt.yukleyenId,
      ad: opt.ad ?? "kapak.png",
      mime: opt.mime,
      boyut: 1024,
      depolama_yolu: `kartlar/${opt.kartId}/test.png`,
    },
    select: { id: true },
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
  const proje = await sahipliProjeOlustur(ortam.birim.id, ortam.superAdmin.id);
  const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
  kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
});

describe("kapagiAyarla", () => {
  it("görsel eklenti kart kapağı yapılır + kapak_renk null'lanır", async () => {
    // Önce karta renk kapağı koy
    await adminDb.kart.update({
      where: { id: kart.id },
      data: { kapak_renk: "primary" },
    });
    const e = await eklentiOlustur({
      kartId: kart.id,
      yukleyenId: ortam.superAdmin.id,
      mime: "image/png",
    });
    await kapagiAyarla(ortam.birim.id, kart.id, e.id);

    const k = await adminDb.kart.findUnique({
      where: { id: kart.id },
      select: { kapak_dosya_id: true, kapak_renk: true },
    });
    expect(k?.kapak_dosya_id).toBe(e.id);
    expect(k?.kapak_renk).toBeNull();
  });

  it("görsel olmayan eklenti kapak yapılamaz", async () => {
    const e = await eklentiOlustur({
      kartId: kart.id,
      yukleyenId: ortam.superAdmin.id,
      mime: "application/pdf",
    });
    await expect(
      kapagiAyarla(ortam.birim.id, kart.id, e.id),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("başka karta ait eklenti kapak yapılamaz", async () => {
    const liste2 = await listeOlusturFiks(adminDb, {
      projeId: (
        await adminDb.kart.findUnique({
          where: { id: kart.id },
          select: { liste: { select: { proje_id: true } } },
        })
      )!.liste.proje_id,
    });
    const baskaKart = await kartOlusturFiks(adminDb, { listeId: liste2.id });
    const e = await eklentiOlustur({
      kartId: baskaKart.id,
      yukleyenId: ortam.superAdmin.id,
      mime: "image/png",
    });
    await expect(
      kapagiAyarla(ortam.birim.id, kart.id, e.id),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("silinmiş eklenti kapak yapılamaz", async () => {
    const e = await eklentiOlustur({
      kartId: kart.id,
      yukleyenId: ortam.superAdmin.id,
      mime: "image/png",
    });
    await adminDb.eklenti.update({
      where: { id: e.id },
      data: { silindi_mi: true, silinme_zamani: new Date() },
    });
    await expect(
      kapagiAyarla(ortam.birim.id, kart.id, e.id),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });

  // Eski birim izolasyonu testi yetkilendirme modeliyle kapsam dışı kaldı.
});

describe("kapagiKaldir", () => {
  it("kapak_dosya_id null'lanır, kapak_renk dokunulmaz", async () => {
    const e = await eklentiOlustur({
      kartId: kart.id,
      yukleyenId: ortam.superAdmin.id,
      mime: "image/png",
    });
    await kapagiAyarla(ortam.birim.id, kart.id, e.id);
    // Kapak rengi yeniden set
    await adminDb.kart.update({
      where: { id: kart.id },
      data: { kapak_renk: "primary" },
    });
    await kapagiKaldir(ortam.birim.id, kart.id);
    const k = await adminDb.kart.findUnique({
      where: { id: kart.id },
      select: { kapak_dosya_id: true, kapak_renk: true },
    });
    expect(k?.kapak_dosya_id).toBeNull();
    expect(k?.kapak_renk).toBe("primary");
  });
});

describe("kapakRenginiAyarla", () => {
  it("geçerli token kart_renk olarak yazılır", async () => {
    await kapakRenginiAyarla(ortam.birim.id, kart.id, "mavi");
    const k = await adminDb.kart.findUnique({
      where: { id: kart.id },
      select: { kapak_renk: true, kapak_dosya_id: true },
    });
    expect(k?.kapak_renk).toBe("mavi");
    expect(k?.kapak_dosya_id).toBeNull();
  });

  it("renk konunca varolan görsel kapak null'lanır", async () => {
    const e = await eklentiOlustur({
      kartId: kart.id,
      yukleyenId: ortam.superAdmin.id,
      mime: "image/png",
    });
    await kapagiAyarla(ortam.birim.id, kart.id, e.id);
    await kapakRenginiAyarla(ortam.birim.id, kart.id, "tertiary");
    const k = await adminDb.kart.findUnique({
      where: { id: kart.id },
      select: { kapak_renk: true, kapak_dosya_id: true },
    });
    expect(k?.kapak_renk).toBe("tertiary");
    expect(k?.kapak_dosya_id).toBeNull();
  });

  it("geçersiz token reddedilir", async () => {
    await expect(
      // @ts-expect-error -- intentional: schema'yı bypass eden direkt çağrı
      kapakRenginiAyarla(ortam.birim.id, kart.id, "siyah"),
    ).rejects.toMatchObject({ kod: "GECERSIZ_GIRDI" });
  });

  it("bulunamayan kart için hata fırlatır", async () => {
    await expect(
      kapakRenginiAyarla(
        ortam.birim.id,
        "00000000-0000-0000-0000-000000000000",
        "kirmizi",
      ),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });
});

describe("kapakRenginiKaldir", () => {
  it("kapak_renk null'lanır, görsel kapak dokunulmaz", async () => {
    const e = await eklentiOlustur({
      kartId: kart.id,
      yukleyenId: ortam.superAdmin.id,
      mime: "image/png",
    });
    // Önce renk koy, sonra görsel — görsel rengi null'lar.
    await kapakRenginiAyarla(ortam.birim.id, kart.id, "yesil");
    await kapagiAyarla(ortam.birim.id, kart.id, e.id);
    // Renk kaldır komutu varolmayan rengi kaldırırken görseli korur.
    await kapakRenginiKaldir(ortam.birim.id, kart.id);
    const k = await adminDb.kart.findUnique({
      where: { id: kart.id },
      select: { kapak_renk: true, kapak_dosya_id: true },
    });
    expect(k?.kapak_renk).toBeNull();
    expect(k?.kapak_dosya_id).toBe(e.id);
  });

  it("zaten null olan kapak_renk için no-op çalışır", async () => {
    await kapakRenginiKaldir(ortam.birim.id, kart.id);
    const k = await adminDb.kart.findUnique({
      where: { id: kart.id },
      select: { kapak_renk: true },
    });
    expect(k?.kapak_renk).toBeNull();
  });
});
