import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  vi,
} from "vitest";
import { PrismaClient } from "@prisma/client";

// Sprint 2 / S2-9 — projeler/[projeId]/actions.ts integration testleri.
// En yüksek-trafik action dosyası (kart + liste eylemleri).

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => null as unknown),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: () => undefined,
    set: () => undefined,
  })),
}));

vi.mock("@/lib/hata-kayit", () => ({
  hataKaydet: vi.fn(async () => undefined),
}));

import {
  listeOlusturEylem,
  kartOlusturEylem,
  kartSilEylem,
} from "./actions";
import {
  ortamKur,
  projeOlusturFiks,
  listeOlusturFiks,
  type Ortam,
} from "@/tests/fixtures/proje";
import { truncateAll } from "@/tests/db/setup";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;

function oturumOlarak(kullaniciId: string | null): void {
  if (!kullaniciId) {
    authMock.mockResolvedValue(null);
    return;
  }
  authMock.mockResolvedValue({
    user: { id: kullaniciId, email: `${kullaniciId}@test.local` },
    expires: new Date(Date.now() + 3600_000).toISOString(),
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
  authMock.mockReset();
});

describe("kartOlusturEylem", () => {
  it("yetki olmayan kullanıcı için YETKISIZ", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    oturumOlarak(ortam.digerKullanici.id);
    const sonuc = await kartOlusturEylem({
      liste_id: liste.id,
      baslik: "Yeni",
    });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("YETKISIZ");
    }
  });

  it("yetkili kullanıcı için kart yaratılır + DB'de var", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await kartOlusturEylem({
      liste_id: liste.id,
      baslik: "Yeni Kart",
    });
    expect(sonuc.basarili).toBe(true);
    if (sonuc.basarili) {
      const kart = await adminDb.kart.findUnique({
        where: { id: sonuc.veri.id },
        select: { baslik: true, liste_id: true },
      });
      expect(kart?.baslik).toBe("Yeni Kart");
      expect(kart?.liste_id).toBe(liste.id);
    }
  });

  it("audit log: CREATE kaynak_tip=Kart kaydı yazıldı", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await kartOlusturEylem({
      liste_id: liste.id,
      baslik: "Audit Test",
    });
    expect(sonuc.basarili).toBe(true);
    if (!sonuc.basarili) return;
    const log = await adminDb.aktiviteLogu.findFirst({
      where: {
        kaynak_tip: "Kart",
        kaynak_id: sonuc.veri.id,
        islem: "CREATE",
      },
    });
    expect(log).not.toBeNull();
    expect(log?.kullanici_id).toBe(ortam.superAdmin.id);
  });

  it("Zod validation: boş başlık GECERSIZ_GIRDI", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await kartOlusturEylem({ liste_id: liste.id, baslik: "" });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
      expect(sonuc.alanlar?.baslik).toBeDefined();
    }
  });
});

describe("listeOlusturEylem", () => {
  it("S1-11 + V.2: proje:edit yetkisi olmayan kullanıcı YETKISIZ alır", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    oturumOlarak(ortam.digerKullanici.id);
    const sonuc = await listeOlusturEylem({
      proje_id: proje.id,
      ad: "Liste",
    });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("YETKISIZ");
    }
  });
});

describe("kartSilEylem", () => {
  it("yetkisiz silme YETKISIZ döner", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await adminDb.kart.create({
      data: {
        liste_id: liste.id,
        baslik: "Kart",
        sira: "M",
      },
    });
    oturumOlarak(ortam.digerKullanici.id);
    const sonuc = await kartSilEylem({ id: kart.id });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("YETKISIZ");
    }
  });
});
