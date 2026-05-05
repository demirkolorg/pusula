import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  rolleriListele,
  rolDetayiniGetir,
  rolOlustur,
  rolGuncelle,
  rolSil,
  rolIzinleriniGuncelle,
  rolCogalt,
  kullaniciyaRolAta,
  tumIzinleriListele,
} from "./services";
import {
  IZIN_KATEGORI,
  IZIN_KODLARI,
  IZIN_TANIMLARI,
  TUM_IZIN_KODLARI,
  VARSAYILAN_ROL_IZINLERI,
} from "@/lib/permissions-katalog";
import { ROL_KODLARI } from "@/lib/roller";
import { truncateAll } from "@/tests/db/setup";
import { ortamKur, type Ortam } from "@/tests/fixtures/proje";
import { EylemHatasi } from "@/lib/action-wrapper";

const adminDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});

let ortam: Ortam;

/**
 * Tam izin kataloğunu test DB'ye seedler — `tests/fixtures/proje.ts`'in
 * sınırlı 4 izinden farklı, RBAC modülü için tüm 20 izin gerekir.
 */
async function tumIzinKataloguSeedle(): Promise<void> {
  for (const kod of TUM_IZIN_KODLARI) {
    const tanim = IZIN_TANIMLARI[kod];
    const kategori = IZIN_KATEGORI[kod];
    if (!tanim || !kategori) continue;
    await adminDb.izin.upsert({
      where: { kod },
      update: {
        ad: tanim.ad,
        aciklama: tanim.aciklama,
        kategori,
      },
      create: {
        kod,
        ad: tanim.ad,
        aciklama: tanim.aciklama,
        kategori,
      },
    });
  }

  // SUPER_ADMIN'e tüm izinler — son-admin testleri için zorunlu.
  const sa = await adminDb.rol.findUnique({
    where: { kod: ROL_KODLARI.SUPER_ADMIN },
    select: { id: true },
  });
  if (!sa) throw new Error("SUPER_ADMIN rolü seed eksik");

  const tumKayitlar = await adminDb.izin.findMany({
    select: { id: true, kod: true },
  });
  const izinHaritasi = new Map(tumKayitlar.map((i) => [i.kod, i.id]));

  const istenen = VARSAYILAN_ROL_IZINLERI[ROL_KODLARI.SUPER_ADMIN] ?? [];
  for (const kod of istenen) {
    const izinId = izinHaritasi.get(kod);
    if (!izinId) continue;
    await adminDb.rolIzin.upsert({
      where: { rol_id_izin_id: { rol_id: sa.id, izin_id: izinId } },
      update: {},
      create: { rol_id: sa.id, izin_id: izinId },
    });
  }
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
  await tumIzinKataloguSeedle();
});

// ============================================================
// Liste & detay
// ============================================================

describe("rolleriListele", () => {
  it("sistem rolleri önce gelir, sonra ada göre sıralanır", async () => {
    await adminDb.rol.create({
      data: { kod: "OZEL_A", ad: "Aaa Özel", sistem_rolu: false },
    });
    await adminDb.rol.create({
      data: { kod: "OZEL_B", ad: "Bbb Özel", sistem_rolu: false },
    });

    const liste = await rolleriListele();
    const ilkUcSistem = liste
      .slice(0, liste.filter((r) => r.sistem_rolu).length)
      .every((r) => r.sistem_rolu);
    expect(ilkUcSistem).toBe(true);

    const ozeller = liste.filter((r) => !r.sistem_rolu);
    expect(ozeller.map((r) => r.ad)).toEqual(["Aaa Özel", "Bbb Özel"]);
  });

  it("arama filtresi kod/ad/açıklama'da tarar", async () => {
    await adminDb.rol.create({
      data: {
        kod: "DENETCI",
        ad: "Denetim Sorumlusu",
        aciklama: "Audit raporları",
        sistem_rolu: false,
      },
    });

    const sonuc = await rolleriListele("audit");
    expect(sonuc.some((r) => r.kod === "DENETCI")).toBe(true);
  });

  it("kullanıcı ve izin sayısı doğru raporlanır", async () => {
    const liste = await rolleriListele();
    const sa = liste.find((r) => r.kod === ROL_KODLARI.SUPER_ADMIN);
    expect(sa).toBeTruthy();
    expect(sa!.kullanici_sayisi).toBeGreaterThan(0);
    // Fixture seed bazı eski (geri uyum) izinleri DB'ye yazmış olabilir;
    // SUPER_ADMIN bunlara da bağlandığı için >= TUM_IZIN_KODLARI.length kontrol.
    expect(sa!.izin_sayisi).toBeGreaterThanOrEqual(TUM_IZIN_KODLARI.length);
  });
});

describe("rolDetayiniGetir", () => {
  it("rolün izin kodlarını ve atanmış kullanıcılarını döner", async () => {
    const sa = await adminDb.rol.findUniqueOrThrow({
      where: { kod: ROL_KODLARI.SUPER_ADMIN },
    });
    const detay = await rolDetayiniGetir(sa.id);
    expect(detay.kod).toBe(ROL_KODLARI.SUPER_ADMIN);
    expect(detay.izinler).toContain(IZIN_KODLARI.ROL_IZIN_ATA);
    expect(detay.kullanicilar.length).toBeGreaterThan(0);
  });

  it("bulunmazsa EylemHatasi fırlatır", async () => {
    await expect(
      rolDetayiniGetir("00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(EylemHatasi);
  });
});

// ============================================================
// rolOlustur
// ============================================================

describe("rolOlustur", () => {
  it("yeni rolü izinlerle birlikte yaratır", async () => {
    const r = await rolOlustur({
      kod: "TEST_ROL",
      ad: "Test Rolü",
      aciklama: "deneme",
      izinler: [IZIN_KODLARI.KART_OLUSTUR, IZIN_KODLARI.KART_BASLIK_DUZENLE],
    });
    const detay = await rolDetayiniGetir(r.id);
    expect(detay.izinler.sort()).toEqual(
      [IZIN_KODLARI.KART_OLUSTUR, IZIN_KODLARI.KART_BASLIK_DUZENLE].sort(),
    );
    expect(detay.sistem_rolu).toBe(false);
    expect(detay.izin_versiyonu).toBe(1);
  });

  it("sistem rol kodu ile çakışırsa reddeder", async () => {
    await expect(
      rolOlustur({
        kod: ROL_KODLARI.KAYMAKAM,
        ad: "Kopya",
        aciklama: null,
        izinler: [],
      }),
    ).rejects.toThrow(/sistem rol/i);
  });

  it("aynı kod iki kez yaratılamaz", async () => {
    await rolOlustur({
      kod: "AYNI",
      ad: "İlk",
      aciklama: null,
      izinler: [],
    });
    await expect(
      rolOlustur({
        kod: "AYNI",
        ad: "İkinci",
        aciklama: null,
        izinler: [],
      }),
    ).rejects.toThrow(/zaten/i);
  });
});

// ============================================================
// rolGuncelle
// ============================================================

describe("rolGuncelle", () => {
  it("ad ve açıklamayı günceller", async () => {
    const yeni = await rolOlustur({
      kod: "GUNCELLE_ROL",
      ad: "Eski Ad",
      aciklama: "eski",
      izinler: [],
    });
    await rolGuncelle({ id: yeni.id, ad: "Yeni Ad", aciklama: "yeni" });
    const detay = await rolDetayiniGetir(yeni.id);
    expect(detay.ad).toBe("Yeni Ad");
    expect(detay.aciklama).toBe("yeni");
  });
});

// ============================================================
// rolSil
// ============================================================

describe("rolSil", () => {
  it("sistem rolünü silmez", async () => {
    const sa = await adminDb.rol.findUniqueOrThrow({
      where: { kod: ROL_KODLARI.SUPER_ADMIN },
    });
    await expect(rolSil(sa.id, ortam.superAdmin.id)).rejects.toThrow(
      /sistem/i,
    );
  });

  it("kullanıcısı olan rolü silmez", async () => {
    // SUPER_ADMIN kullanıcı atanmış halde — ortam'da var. Yeni özel rol
    // oluşturup ortam.personel'e ata, sonra silmeyi dene.
    const yeni = await rolOlustur({
      kod: "DOLU_ROL",
      ad: "Dolu",
      aciklama: null,
      izinler: [],
    });
    await adminDb.kullaniciRol.create({
      data: { kullanici_id: ortam.personel.id, rol_id: yeni.id },
    });
    await expect(rolSil(yeni.id, ortam.superAdmin.id)).rejects.toThrow(
      /atanmış/i,
    );
  });

  it("boş özel rolü siler", async () => {
    const yeni = await rolOlustur({
      kod: "BOS_ROL",
      ad: "Boş",
      aciklama: null,
      izinler: [],
    });
    await rolSil(yeni.id, ortam.superAdmin.id);
    const kontrol = await adminDb.rol.findUnique({ where: { id: yeni.id } });
    expect(kontrol).toBeNull();
  });
});

// ============================================================
// rolIzinleriniGuncelle — kalp
// ============================================================

describe("rolIzinleriniGuncelle", () => {
  it("izinleri günceller ve versiyon artırır", async () => {
    const yeni = await rolOlustur({
      kod: "VER_ROL",
      ad: "Versiyon Test",
      aciklama: null,
      izinler: [IZIN_KODLARI.KART_OLUSTUR],
    });
    const oncesi = await rolDetayiniGetir(yeni.id);

    const sonuc = await rolIzinleriniGuncelle(
      {
        id: yeni.id,
        izinler: [IZIN_KODLARI.KART_OLUSTUR, IZIN_KODLARI.KART_BASLIK_DUZENLE],
      },
      ortam.superAdmin.id,
    );

    expect(sonuc.izin_versiyonu).toBe(oncesi.izin_versiyonu + 1);

    const sonra = await rolDetayiniGetir(yeni.id);
    expect(sonra.izinler.sort()).toEqual(
      [IZIN_KODLARI.KART_OLUSTUR, IZIN_KODLARI.KART_BASLIK_DUZENLE].sort(),
    );
  });

  it("izin listesi tamamen değişebilir (replace semantiği)", async () => {
    const yeni = await rolOlustur({
      kod: "REP_ROL",
      ad: "Replace",
      aciklama: null,
      izinler: [IZIN_KODLARI.KART_OLUSTUR, IZIN_KODLARI.KART_BASLIK_DUZENLE],
    });
    await rolIzinleriniGuncelle(
      { id: yeni.id, izinler: [IZIN_KODLARI.PROJE_OLUSTUR] },
      ortam.superAdmin.id,
    );
    const sonra = await rolDetayiniGetir(yeni.id);
    expect(sonra.izinler).toEqual([IZIN_KODLARI.PROJE_OLUSTUR]);
  });

  it("son-admin guard: kendi rolünden ROL_YONET çıkaramaz (başka rolünde yoksa)", async () => {
    // Tek-rol bir kullanıcı oluştur, sadece ROL_YONET içeren bir rol ata
    const ozelRol = await rolOlustur({
      kod: "TEK_YONETICI",
      ad: "Tek Yönetici",
      aciklama: null,
      izinler: [IZIN_KODLARI.ROL_IZIN_ATA],
    });
    const tekKisi = await adminDb.kullanici.create({
      data: {
        birim_id: ortam.birim.id,
        email: "tek-yonetici@test.local",
        parola_hash: "x",
        ad: "Tek",
        soyad: "Yönetici",
        aktif: true,
        onay_durumu: "ONAYLANDI",
      },
      select: { id: true },
    });
    await adminDb.kullaniciRol.create({
      data: { kullanici_id: tekKisi.id, rol_id: ozelRol.id },
    });

    await expect(
      rolIzinleriniGuncelle(
        { id: ozelRol.id, izinler: [IZIN_KODLARI.KART_OLUSTUR] },
        tekKisi.id,
      ),
    ).rejects.toThrow(/rol-yönetimi/i);
  });

  it("son-admin guard: kullanıcının başka rolünde ROL_YONET varsa kaldırmaya izin verir", async () => {
    // İki rol oluştur, ikisinde de ROL_YONET; birinden çıkarılabilmeli
    const rol1 = await rolOlustur({
      kod: "YETKI_1",
      ad: "Yetki 1",
      aciklama: null,
      izinler: [IZIN_KODLARI.ROL_IZIN_ATA],
    });
    const rol2 = await rolOlustur({
      kod: "YETKI_2",
      ad: "Yetki 2",
      aciklama: null,
      izinler: [IZIN_KODLARI.ROL_IZIN_ATA],
    });
    const kisi = await adminDb.kullanici.create({
      data: {
        birim_id: ortam.birim.id,
        email: "iki-rolu@test.local",
        parola_hash: "x",
        ad: "İki",
        soyad: "Rol",
        aktif: true,
        onay_durumu: "ONAYLANDI",
      },
      select: { id: true },
    });
    await adminDb.kullaniciRol.createMany({
      data: [
        { kullanici_id: kisi.id, rol_id: rol1.id },
        { kullanici_id: kisi.id, rol_id: rol2.id },
      ],
    });

    // rol1'den çıkar — rol2'de hâlâ var, izin verilmeli
    await expect(
      rolIzinleriniGuncelle(
        { id: rol1.id, izinler: [IZIN_KODLARI.KART_OLUSTUR] },
        kisi.id,
      ),
    ).resolves.toBeTruthy();
  });

  it("son-admin guard: makam rolü olan kullanıcı atlatır", async () => {
    // ortam.superAdmin SUPER_ADMIN — makam rolü, guard atlanmalı
    const ozel = await rolOlustur({
      kod: "ATLA_TEST",
      ad: "Atla",
      aciklama: null,
      izinler: [IZIN_KODLARI.ROL_IZIN_ATA],
    });
    await adminDb.kullaniciRol.create({
      data: { kullanici_id: ortam.superAdmin.id, rol_id: ozel.id },
    });

    await expect(
      rolIzinleriniGuncelle(
        { id: ozel.id, izinler: [IZIN_KODLARI.KART_OLUSTUR] },
        ortam.superAdmin.id,
      ),
    ).resolves.toBeTruthy();
  });

  it("tanımsız izin kodu → reddeder", async () => {
    const yeni = await rolOlustur({
      kod: "BAD_IZIN",
      ad: "Bad",
      aciklama: null,
      izinler: [],
    });
    await expect(
      rolIzinleriniGuncelle(
        { id: yeni.id, izinler: ["yok:olan" as never] },
        ortam.superAdmin.id,
      ),
    ).rejects.toBeInstanceOf(EylemHatasi);
  });
});

// ============================================================
// rolCogalt
// ============================================================

describe("rolCogalt", () => {
  it("kaynak rolün izinlerini yeni role kopyalar", async () => {
    const kaynak = await rolOlustur({
      kod: "KAYNAK",
      ad: "Kaynak",
      aciklama: null,
      izinler: [IZIN_KODLARI.PROJE_OLUSTUR, IZIN_KODLARI.KART_OLUSTUR],
    });
    const yeni = await rolCogalt({
      kaynakId: kaynak.id,
      kod: "KOPYA",
      ad: "Kopya",
      aciklama: "kopya",
    });
    const detay = await rolDetayiniGetir(yeni.id);
    expect(detay.izinler.sort()).toEqual(
      [IZIN_KODLARI.PROJE_OLUSTUR, IZIN_KODLARI.KART_OLUSTUR].sort(),
    );
    expect(detay.sistem_rolu).toBe(false);
  });
});

// ============================================================
// kullaniciyaRolAta
// ============================================================

describe("kullaniciyaRolAta", () => {
  it("kullanıcının rollerini tamamen değiştirir", async () => {
    const r1 = await rolOlustur({
      kod: "AT_R1",
      ad: "R1",
      aciklama: null,
      izinler: [IZIN_KODLARI.KART_OLUSTUR],
    });
    const r2 = await rolOlustur({
      kod: "AT_R2",
      ad: "R2",
      aciklama: null,
      izinler: [IZIN_KODLARI.KART_BASLIK_DUZENLE],
    });

    await kullaniciyaRolAta(
      { kullaniciId: ortam.personel.id, rolIdleri: [r1.id, r2.id] },
      ortam.superAdmin.id,
    );
    const sonra = await adminDb.kullaniciRol.findMany({
      where: { kullanici_id: ortam.personel.id },
      select: { rol_id: true },
    });
    expect(sonra.map((s) => s.rol_id).sort()).toEqual([r1.id, r2.id].sort());
  });

  it("self-lockout: kendi son ROL_YONET kaynağını kaldırma engelli", async () => {
    // Tek-rol kullanıcı, sadece ROL_YONET'li bir rol
    const yetkili = await rolOlustur({
      kod: "TEK_Y",
      ad: "Tek Y",
      aciklama: null,
      izinler: [IZIN_KODLARI.ROL_IZIN_ATA],
    });
    const baska = await rolOlustur({
      kod: "BASKA",
      ad: "Başka",
      aciklama: null,
      izinler: [IZIN_KODLARI.KART_OLUSTUR],
    });
    const kisi = await adminDb.kullanici.create({
      data: {
        birim_id: ortam.birim.id,
        email: "tek-r@test.local",
        parola_hash: "x",
        ad: "T",
        soyad: "K",
        aktif: true,
        onay_durumu: "ONAYLANDI",
      },
      select: { id: true },
    });
    await adminDb.kullaniciRol.create({
      data: { kullanici_id: kisi.id, rol_id: yetkili.id },
    });

    // ROL_YONET'siz role değiştir → reddedilmeli
    await expect(
      kullaniciyaRolAta(
        { kullaniciId: kisi.id, rolIdleri: [baska.id] },
        kisi.id,
      ),
    ).rejects.toThrow(/rol-yönetimi/i);
  });
});

// ============================================================
// tumIzinleriListele
// ============================================================

describe("tumIzinleriListele", () => {
  it("yeni granüler kataloğun tamamı döner", async () => {
    const liste = await tumIzinleriListele();
    const kodlar = liste.map((i) => i.kod);
    for (const k of TUM_IZIN_KODLARI) expect(kodlar).toContain(k);
  });
});
