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

// Sprint 2 / S2-10 — projeler/actions.ts integration testleri.
// Mock yasak (Kontrol Kural 80) — gerçek pg-test DB.
// `@/auth` framework boundary olduğu için mocklanır (Kural 80 istisnası).

// vi.mock factory'leri hoist edildiği için authMock'u vi.hoisted ile yukarı taşı.
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

// next/headers test ortamında "request scope" zorunlu kılıyor — action
// wrapper `istekContextAl` üzerinden header okur. Boş Headers ile mock.
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: () => undefined,
    set: () => undefined,
  })),
}));

// HataLogu yan-etkisi test infrastructure'ında flaky (Prisma auth flux).
// Action layer testi için kritik değil — audit assertion AktiviteLogu
// üzerinden yapılır.
vi.mock("@/lib/hata-kayit", () => ({
  hataKaydet: vi.fn(async () => undefined),
}));

import { projeOlusturEylem, projeArsivleEylem } from "./actions";
import { ortamKur, projeOlusturFiks, type Ortam } from "@/tests/fixtures/proje";
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

describe("projeOlusturEylem", () => {
  it("yetki olmayan kullanıcı için YETKISIZ döner", async () => {
    // PERSONEL rolü PROJE_OLUSTUR iznine sahip değil (fixture defaults).
    oturumOlarak(ortam.personel.id);
    const sonuc = await projeOlusturEylem({ ad: "Yeni Proje" });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("YETKISIZ");
    }
  });

  it("yetkili kullanıcı için başarılı + DB'de proje yazılı", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await projeOlusturEylem({ ad: "Yeni Proje" });
    expect(sonuc.basarili).toBe(true);
    if (sonuc.basarili) {
      const proje = await adminDb.proje.findUnique({
        where: { id: sonuc.veri.id },
        select: { ad: true, silindi_mi: true },
      });
      expect(proje?.ad).toBe("Yeni Proje");
      expect(proje?.silindi_mi).toBe(false);
    }
  });

  it("başarılı yaratma için aktivite log'a yazıldı", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await projeOlusturEylem({ ad: "Audit Proje" });
    expect(sonuc.basarili).toBe(true);
    if (!sonuc.basarili) return;
    const log = await adminDb.aktiviteLogu.findFirst({
      where: {
        kaynak_tip: "Proje",
        kaynak_id: sonuc.veri.id,
        islem: "CREATE",
      },
    });
    expect(log).not.toBeNull();
    expect(log?.kullanici_id).toBe(ortam.superAdmin.id);
  });

  it("Zod validation: kısa ad GECERSIZ_GIRDI döner", async () => {
    oturumOlarak(ortam.superAdmin.id);
    const sonuc = await projeOlusturEylem({ ad: "X" });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("GECERSIZ_GIRDI");
      expect(sonuc.alanlar?.ad).toBeDefined();
    }
  });
});

describe("projeArsivleEylem", () => {
  it("S1-10: PROJE_ARSIVLE iznine sahip olmayan kullanıcı YETKISIZ alır", async () => {
    // PERSONEL fixture'da PROJE_ARSIVLE'ye sahip değil; superAdmin makam.
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
    });
    oturumOlarak(ortam.personel.id);
    const sonuc = await projeArsivleEylem({ id: proje.id, arsiv_mi: true });
    expect(sonuc.basarili).toBe(false);
    if (!sonuc.basarili) {
      expect(sonuc.kod).toBe("YETKISIZ");
    }
  });
});
