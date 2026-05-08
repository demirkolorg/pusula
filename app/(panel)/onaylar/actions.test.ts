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

// Sprint 2 / S2-13 — onaylar/actions.ts integration testleri.
// ADR-0019 — kart/madde tamamlama öneri onay/red akışı.

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
  bekleyenKartOnerileriniListeleEylem,
  bekleyenMaddeOnerileriniListeleEylem,
  bekleyenOneriSayimiEylem,
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

describe("bekleyenKartOnerileriniListeleEylem", () => {
  it("yetki fail: KART_TAMAMLA olmayan kullanıcı YETKISIZ alır", async () => {
    oturumOlarak(ortam.personel.id);
    const sonuc = await bekleyenKartOnerileriniListeleEylem({});
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("YETKISIZ");
    }
  });

  it("yetki ok (makam): superAdmin için boş liste döner", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await bekleyenKartOnerileriniListeleEylem({});
    expect(sonuc.basarili).toBe(true);
    if (sonuc.basarili) {
      expect(sonuc.veri.oğeler).toEqual([]);
    }
  });

  it("Zod validation: limit > 100 GECERSIZ_GIRDI", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await bekleyenKartOnerileriniListeleEylem({ limit: 200 });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
    }
  });
});

describe("bekleyenOneriSayimiEylem", () => {
  it("yetkisiz kullanıcı için 0/0 döner (404 yerine sessizce)", async () => {
    oturumOlarak(ortam.personel.id);
    const sonuc = await bekleyenOneriSayimiEylem({});
    expect(sonuc.basarili).toBe(true);
    if (sonuc.basarili) {
      expect(sonuc.veri).toEqual({ kart: 0, madde: 0 });
    }
  });
});

describe("bekleyenMaddeOnerileriniListeleEylem", () => {
  it("oturum yok için GIRIS_YOK", async () => {
    oturumOlarak(null);
    const sonuc = await bekleyenMaddeOnerileriniListeleEylem({});
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("GIRIS_YOK");
    }
  });
});
