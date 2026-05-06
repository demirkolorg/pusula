import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  kaynakEtiketleriOlustur,
  kaynakTipEtiketi,
  KAYNAK_TIP_LABEL,
} from "./audit-kaynak-etiket";
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

// ============================================================
// kaynakTipEtiketi — saf fonksiyon
// ============================================================

describe("kaynakTipEtiketi", () => {
  it("bilinen tipler için Türkçe etiket döner", () => {
    expect(kaynakTipEtiketi("Kart")).toBe("Kart");
    expect(kaynakTipEtiketi("ProjeYetkilisi")).toBe("Proje Yetkilisi");
    expect(kaynakTipEtiketi("BildirimMailKuyrugu")).toBe("E-posta Bildirimi");
  });

  it("bilinmeyen tip için ham değeri döner", () => {
    expect(kaynakTipEtiketi("Bilinmeyen")).toBe("Bilinmeyen");
  });

  it("tüm sözlük girişleri non-empty Türkçe", () => {
    for (const [tip, label] of Object.entries(KAYNAK_TIP_LABEL)) {
      expect(label.length, `${tip} boş olamaz`).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// kaynakEtiketleriOlustur — DB ile entegrasyon
// ============================================================

describe("kaynakEtiketleriOlustur", () => {
  it("boş giriş için boş dizi döner", async () => {
    const sonuc = await kaynakEtiketleriOlustur([]);
    expect(sonuc).toEqual([]);
  });

  it("Proje kaydı için proje adını çözer", async () => {
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Asfalt Projesi",
    });
    const sonuc = await kaynakEtiketleriOlustur([
      {
        kaynak_tip: "Proje",
        kaynak_id: proje.id,
        eski_veri: null,
        yeni_veri: null,
      },
    ]);
    expect(sonuc[0]).toBe("Asfalt Projesi");
  });

  it("Kart kaydı için kart başlığını çözer", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Sokak temizliği",
    });
    const sonuc = await kaynakEtiketleriOlustur([
      {
        kaynak_tip: "Kart",
        kaynak_id: kart.id,
        eski_veri: null,
        yeni_veri: null,
      },
    ]);
    expect(sonuc[0]).toBe("Sokak temizliği");
  });

  it("kaynak_id silinmiş kayıt için yeni_veri'den fallback yapar", async () => {
    const sonuc = await kaynakEtiketleriOlustur([
      {
        kaynak_tip: "Kart",
        kaynak_id: "00000000-0000-0000-0000-000000000000",
        eski_veri: null,
        yeni_veri: { baslik: "Silinmiş kart" },
      },
    ]);
    expect(sonuc[0]).toBe("Silinmiş kart");
  });

  it("ProjeYetkilisi için kullanıcı + proje birleşik etiket üretir", async () => {
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Test Projesi",
    });
    const personel = await adminDb.kullanici.findUnique({
      where: { id: ortam.personel.id },
      select: { ad: true, soyad: true },
    });
    const sonuc = await kaynakEtiketleriOlustur([
      {
        kaynak_tip: "ProjeYetkilisi",
        kaynak_id: null,
        eski_veri: null,
        yeni_veri: { kullanici_id: ortam.personel.id, proje_id: proje.id },
      },
    ]);
    expect(sonuc[0]).toBe(`${personel!.ad} ${personel!.soyad} - Test Projesi`);
  });

  it("hiç bilgi yoksa null döner", async () => {
    const sonuc = await kaynakEtiketleriOlustur([
      {
        kaynak_tip: "Kart",
        kaynak_id: null,
        eski_veri: null,
        yeni_veri: null,
      },
    ]);
    expect(sonuc[0]).toBeNull();
  });

  it("birden fazla satırı tek batch'te çözer (sıra korunur)", async () => {
    const p1 = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Proje Bir",
    });
    const p2 = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Proje Iki",
    });
    const sonuc = await kaynakEtiketleriOlustur([
      { kaynak_tip: "Proje", kaynak_id: p1.id, eski_veri: null, yeni_veri: null },
      { kaynak_tip: "Proje", kaynak_id: p2.id, eski_veri: null, yeni_veri: null },
    ]);
    expect(sonuc).toEqual(["Proje Bir", "Proje Iki"]);
  });
});
