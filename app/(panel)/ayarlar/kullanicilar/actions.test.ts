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

// Sprint 2 / S2-12 — ayarlar/kullanicilar/actions.ts integration testleri.

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => null as unknown),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
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
  kullaniciListele,
  kullaniciSilEylem,
} from "./actions";
import { ortamKur, type Ortam } from "@/tests/fixtures/proje";
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

describe("kullaniciListele", () => {
  it("yetki fail: KULLANICI_DUZENLE iznine sahip olmayan kullanıcı YETKISIZ alır", async () => {
    oturumOlarak(ortam.personel.id);
    const sonuc = await kullaniciListele({ sayfa: 1, sayfaBoyutu: 20 });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("YETKISIZ");
    }
  });

  it("yetki ok (makam): superAdmin için liste döner", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await kullaniciListele({ sayfa: 1, sayfaBoyutu: 20 });
    expect(sonuc.basarili).toBe(true);
    if (sonuc.basarili) {
      // Fixture: superAdmin + personel + digerKullanici = 3
      expect(sonuc.veri.toplam).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("kullaniciSilEylem", () => {
  it("kendi kendini silmek CAKISMA döner", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await kullaniciSilEylem({ id: ortam.superAdmin.id });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("CAKISMA");
    }
  });

  it("Zod validation: invalid uuid GECERSIZ_GIRDI", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await kullaniciSilEylem({ id: "uuid-degil" });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
    }
  });
});
