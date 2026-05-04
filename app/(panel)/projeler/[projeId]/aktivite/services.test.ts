import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import { kartAktiviteleriniListele } from "./services";
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
let projeId: string;

async function sahipliProjeOlustur(kurumId: string, sahipId: string) {
  const p = await projeOlusturFiks(adminDb, { kurumId, olusturanId: sahipId });
  await adminDb.projeUyesi.create({
    data: { proje_id: p.id, kullanici_id: sahipId, seviye: "ADMIN" },
  });
  return { id: p.id };
}

// Audit middleware ATLA: AktiviteLogu — kendisini loglamaz, manuel insert güvenli.
async function aktiviteEkle(opt: {
  kullaniciId?: string;
  islem: "CREATE" | "UPDATE" | "DELETE";
  kaynakTip: string;
  kaynakId?: string | null;
  yeniVeri?: unknown;
  eskiVeri?: unknown;
  diff?: unknown;
}): Promise<void> {
  await adminDb.aktiviteLogu.create({
    data: {
      kullanici_id: opt.kullaniciId ?? null,
      islem: opt.islem,
      kaynak_tip: opt.kaynakTip,
      kaynak_id: opt.kaynakId ?? null,
      yeni_veri: (opt.yeniVeri as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      eski_veri: (opt.eskiVeri as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      diff: (opt.diff as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
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
  const proje = await sahipliProjeOlustur(ortam.kurum.id, ortam.superAdmin.id);
  projeId = proje.id;
  const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
  kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
});

// =====================================================================
// Erişim
// =====================================================================

describe("kartAktiviteleriniListele — erişim", () => {
  it("başka kurumun kartı BULUNAMADI", async () => {
    const yabanci = await projeOlusturFiks(adminDb, {
      kurumId: ortam.digerKurum.id,
    });
    const liste = await listeOlusturFiks(adminDb, { projeId: yabanci.id });
    const ykart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await expect(
      kartAktiviteleriniListele(ortam.kurum.id, {
        kart_id: ykart.id,
        limit: 50,
      }),
    ).rejects.toMatchObject({ kod: "BULUNAMADI" });
  });
});

// =====================================================================
// Kart kendisi
// =====================================================================

describe("Kart aktiviteleri", () => {
  it("kart CREATE → 'kartı oluşturdu' + başlık detayı", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "Kart",
      kaynakId: kart.id,
      yeniVeri: { id: kart.id, baslik: "Kart Başlığı", liste_id: "x" },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      kategori: "kart",
      mesaj: "kartı oluşturdu",
      detay: "Kart Başlığı",
    });
    expect(r[0]!.kullanici?.id).toBe(ortam.superAdmin.id);
  });

  it("Kart UPDATE diff.silindi_mi=true → 'çöp kutusuna taşıdı'", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "UPDATE",
      kaynakTip: "Kart",
      kaynakId: kart.id,
      diff: { silindi_mi: { eski: false, yeni: true } },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r[0]!.mesaj).toBe("kartı çöp kutusuna taşıdı");
  });

  it("Kart UPDATE diff.baslik → 'başlığı değiştirdi'", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "UPDATE",
      kaynakTip: "Kart",
      kaynakId: kart.id,
      diff: { baslik: { eski: "X", yeni: "Y" } },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r[0]!.mesaj).toBe("kartın başlığı değiştirdi");
  });
});

// =====================================================================
// Yorum / Eklenti / Kontrol Listesi (kart_id JSON path)
// =====================================================================

describe("Yorum aktiviteleri", () => {
  it("Yorum CREATE → 'yorum yazdı' + içerik kısaltma", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "Yorum",
      yeniVeri: {
        id: "y1",
        kart_id: kart.id,
        icerik: "Bu uzun bir yorumdur.",
      },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r[0]).toMatchObject({
      kategori: "yorum",
      mesaj: "yorum yazdı",
      detay: "Bu uzun bir yorumdur.",
    });
  });

  it("Yorum UPDATE diff.silindi_mi=true → 'yorumunu sildi'", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "UPDATE",
      kaynakTip: "Yorum",
      yeniVeri: { kart_id: kart.id },
      diff: { silindi_mi: { eski: false, yeni: true } },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r[0]!.mesaj).toBe("yorumunu sildi");
  });
});

describe("Eklenti aktiviteleri", () => {
  it("Eklenti CREATE → 'dosya yükledi' + ad", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "Eklenti",
      yeniVeri: { kart_id: kart.id, ad: "rapor.pdf" },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r[0]).toMatchObject({
      kategori: "eklenti",
      mesaj: "dosya yükledi",
      detay: "rapor.pdf",
    });
  });
});

// =====================================================================
// KontrolListesi + KontrolMaddesi (dolaylı bağ — kontrol_listesi_id IN)
// =====================================================================

describe("Kontrol Listesi aktiviteleri", () => {
  it("KontrolListesi CREATE → 'kontrol listesi ekledi'", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "KontrolListesi",
      yeniVeri: { kart_id: kart.id, ad: "Görevler" },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r[0]).toMatchObject({
      kategori: "kontrol-listesi",
      mesaj: "kontrol listesi ekledi",
      detay: "Görevler",
    });
  });

  it("KontrolMaddesi UPDATE diff.tamamlandi_mi=true → 'tamamladı' (dolaylı bağ)", async () => {
    // Önce gerçek bir KontrolListesi oluştur (madde'nin parent'ı bulunabilsin)
    const kl = await adminDb.kontrolListesi.create({
      data: { kart_id: kart.id, ad: "X", sira: "M" },
    });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "UPDATE",
      kaynakTip: "KontrolMaddesi",
      yeniVeri: { kontrol_listesi_id: kl.id, metin: "Yap" },
      diff: { tamamlandi_mi: { eski: false, yeni: true } },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    // adminDb.kontrolListesi.create audit yazar (Kontrol Listesi CREATE) +
    // bizim eklediğimiz KontrolMaddesi UPDATE → toplam 2
    const tamamlama = r.find((a) => a.mesaj === "kontrol maddesini tamamladı");
    expect(tamamlama).toBeDefined();
    expect(tamamlama!.detay).toBe("Yap");
  });
});

// =====================================================================
// KartEtiket / KartUyesi (composite PK, kart_id JSON path) — etiket/üye join
// =====================================================================

describe("Etiket / Üye aktiviteleri", () => {
  it("KartEtiket CREATE → etiket adı join ile dolu detay", async () => {
    const e = await adminDb.etiket.create({
      data: { proje_id: projeId, ad: "Acil", renk: "#ef4444" },
    });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "KartEtiket",
      yeniVeri: { kart_id: kart.id, etiket_id: e.id },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    const etiketEkle = r.find(
      (a) => a.kategori === "etiket" && a.mesaj === "etiket ekledi",
    );
    expect(etiketEkle?.detay).toBe("Acil");
  });

  it("KartUyesi CREATE → 'üye atadı' + ad soyad join", async () => {
    await adminDb.projeUyesi.create({
      data: {
        proje_id: projeId,
        kullanici_id: ortam.personel.id,
        seviye: "NORMAL",
      },
    });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "KartUyesi",
      yeniVeri: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    const ekle = r.find(
      (a) => a.kategori === "uye" && a.mesaj === "üye atadı",
    );
    expect(ekle?.detay).toBeTruthy();
    expect(ekle!.detay!.length).toBeGreaterThan(0);
  });

  // Why: Geçmişte audit middleware `upsert`'i UPDATE olarak loglardı; bu
  // yüzden üye eklendiğinde aktivite "üyeyi kaldırdı" görünüyordu (üretim
  // logu). Mesaj fonksiyonu artık veri varlığına göre karar verir: yeni_veri
  // doluysa eklendi, yalnız eski_veri doluysa kaldırıldı.
  it("KartUyesi UPDATE + yeni_veri dolu → 'üye atadı' (upsert geriye dönük)", async () => {
    await adminDb.projeUyesi.create({
      data: {
        proje_id: projeId,
        kullanici_id: ortam.personel.id,
        seviye: "NORMAL",
      },
    });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "UPDATE",
      kaynakTip: "KartUyesi",
      yeniVeri: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    const ekle = r.find(
      (a) => a.kategori === "uye" && a.mesaj === "üye atadı",
    );
    expect(ekle).toBeDefined();
  });

  it("KartUyesi DELETE (yalnız eski_veri) → 'üyeyi kaldırdı'", async () => {
    await adminDb.projeUyesi.create({
      data: {
        proje_id: projeId,
        kullanici_id: ortam.personel.id,
        seviye: "NORMAL",
      },
    });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "DELETE",
      kaynakTip: "KartUyesi",
      eskiVeri: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    const kaldir = r.find(
      (a) => a.kategori === "uye" && a.mesaj === "üyeyi kaldırdı",
    );
    expect(kaldir).toBeDefined();
  });

  it("KartEtiket UPDATE + yeni_veri dolu → 'etiket ekledi' (upsert geriye dönük)", async () => {
    const e = await adminDb.etiket.create({
      data: { proje_id: projeId, ad: "Kritik", renk: "#f59e0b" },
    });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "UPDATE",
      kaynakTip: "KartEtiket",
      yeniVeri: { kart_id: kart.id, etiket_id: e.id },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    const ekle = r.find(
      (a) => a.kategori === "etiket" && a.mesaj === "etiket ekledi",
    );
    expect(ekle?.detay).toBe("Kritik");
  });
});

// =====================================================================
// Filtre — başka karta ait kayıtlar görünmesin
// =====================================================================

describe("İzolasyon", () => {
  it("başka karta ait yorum/eklenti aktiviteleri görünmez", async () => {
    const liste2 = await listeOlusturFiks(adminDb, { projeId });
    const baskaKart = await kartOlusturFiks(adminDb, { listeId: liste2.id });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "Yorum",
      yeniVeri: { kart_id: baskaKart.id, icerik: "Başka kart yorumu" },
    });
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "Yorum",
      yeniVeri: { kart_id: kart.id, icerik: "Bizim kart yorumu" },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    const yorumlar = r.filter((a) => a.kategori === "yorum");
    expect(yorumlar).toHaveLength(1);
    expect(yorumlar[0]!.detay).toBe("Bizim kart yorumu");
  });
});

// =====================================================================
// Sıra: en yeni üstte (zaman DESC)
// =====================================================================

describe("Sıralama", () => {
  it("en yeni aktivite ilk sırada (id DESC)", async () => {
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "Yorum",
      yeniVeri: { kart_id: kart.id, icerik: "İlk" },
    });
    await new Promise((r) => setTimeout(r, 5));
    await aktiviteEkle({
      kullaniciId: ortam.superAdmin.id,
      islem: "CREATE",
      kaynakTip: "Yorum",
      yeniVeri: { kart_id: kart.id, icerik: "İkinci" },
    });
    const r = await kartAktiviteleriniListele(ortam.kurum.id, {
      kart_id: kart.id,
      limit: 50,
    });
    expect(r[0]!.detay).toBe("İkinci");
    expect(r[1]!.detay).toBe("İlk");
  });
});
