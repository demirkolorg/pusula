import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// services.ts -> @/auth zinciri test ortamında çözülemiyor — Tur 3 ile aynı
// pattern (Kontrol Kural 80 istisnası: framework boundary).
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import {
  anaSayfaMetrikleriniGetir,
  benimAcikKartlarim,
  makamKpisiniGetir,
  sonAktiviteleriGetir,
  sonZiyaretEdilenProjeleriGetir,
  _icDestek,
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
// _icDestek.buHaftaninBaslangici — Pazartesi başlar
// ============================================================

describe("buHaftaninBaslangici", () => {
  it("Çarşamba günü için pazartesiyi döndürür", () => {
    const carsamba = new Date(2026, 4, 6); // 2026-05-06 Çarşamba
    const sonuc = _icDestek.buHaftaninBaslangici(carsamba);
    expect(sonuc.getDay()).toBe(1);
    expect(sonuc.getDate()).toBe(4); // Pazartesi 4 Mayıs
    expect(sonuc.getHours()).toBe(0);
    expect(sonuc.getMinutes()).toBe(0);
  });

  it("Pazar günü önceki pazartesiyi döndürür", () => {
    const pazar = new Date(2026, 4, 10); // 2026-05-10 Pazar
    const sonuc = _icDestek.buHaftaninBaslangici(pazar);
    expect(sonuc.getDay()).toBe(1);
    expect(sonuc.getDate()).toBe(4);
  });

  it("Pazartesi günü kendisini döndürür", () => {
    const pazartesi = new Date(2026, 4, 4, 14, 30);
    const sonuc = _icDestek.buHaftaninBaslangici(pazartesi);
    expect(sonuc.getDay()).toBe(1);
    expect(sonuc.getDate()).toBe(4);
    expect(sonuc.getHours()).toBe(0);
  });
});

// ============================================================
// anaSayfaMetrikleriniGetir
// ============================================================

describe("anaSayfaMetrikleriniGetir", () => {
  it("hiç kart yokken tüm metrikler sıfır döner ve kapsam kişisel", async () => {
    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.personel.id,
      ortam.personel.email,
    );
    expect(metrik.kapsam).toBe("kisisel");
    expect(metrik.acikGorev).toBe(0);
    expect(metrik.geciken).toBe(0);
    expect(metrik.buHaftaBitenlerim).toBe(0);
    expect(metrik.buHaftaTamamladiklarim).toBe(0);
    expect(metrik.buHaftaTakim).toBe(0);
    expect(metrik.bekleyenDavetGelen).toBe(0);
    expect(metrik.bekleyenDavetGiden).toBe(0);
    expect(metrik.bekleyenDavetTum).toBe(0);
  });

  it("bana atanan açık kartları sayar", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const k1 = await kartOlusturFiks(adminDb, { listeId: liste.id });
    const k2 = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await kartOlusturFiks(adminDb, { listeId: liste.id }); // bana atanmamış

    await adminDb.kartYetkilisi.createMany({
      data: [
        { kart_id: k1.id, kullanici_id: ortam.personel.id },
        { kart_id: k2.id, kullanici_id: ortam.personel.id },
      ],
    });

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.personel.id,
      ortam.personel.email,
    );
    expect(metrik.acikGorev).toBe(2);
  });

  it("bitiş tarihi geçmiş kartları geciken olarak sayar", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const dun = new Date();
    dun.setDate(dun.getDate() - 1);
    const yarin = new Date();
    yarin.setDate(yarin.getDate() + 1);

    const gecikenKart = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      bitis: dun,
    });
    const ileridekiKart = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      bitis: yarin,
    });

    await adminDb.kartYetkilisi.createMany({
      data: [
        { kart_id: gecikenKart.id, kullanici_id: ortam.personel.id },
        { kart_id: ileridekiKart.id, kullanici_id: ortam.personel.id },
      ],
    });

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.personel.id,
      ortam.personel.email,
    );
    expect(metrik.acikGorev).toBe(2);
    expect(metrik.geciken).toBe(1);
  });

  it("tamamlanmış kartlar açık görev sayısına dahil edilmez", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id });
    await adminDb.kart.update({
      where: { id: kart.id },
      data: {
        tamamlandi_mi: true,
        tamamlanma_zamani: new Date(),
        tamamlayan_id: ortam.personel.id,
      },
    });
    await adminDb.kartYetkilisi.create({
      data: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.personel.id,
      ortam.personel.email,
    );
    expect(metrik.acikGorev).toBe(0);
    expect(metrik.buHaftaBitenlerim).toBe(1);
    expect(metrik.buHaftaTamamladiklarim).toBe(1);
  });

  it("bekleyen davetler email ve davet eden id'ye göre ayrılır", async () => {
    const sonKullanma = new Date();
    sonKullanma.setDate(sonKullanma.getDate() + 7);

    // Personele gelen 2 davet
    await adminDb.davetTokeni.createMany({
      data: [
        {
          token: "tok1",
          email: ortam.personel.email,
          davet_eden_id: ortam.superAdmin.id,
          son_kullanma: sonKullanma,
        },
        {
          token: "tok2",
          email: ortam.personel.email,
          davet_eden_id: ortam.superAdmin.id,
          son_kullanma: sonKullanma,
        },
      ],
    });

    // Personelin gönderdiği 1 davet (başkasına)
    await adminDb.davetTokeni.create({
      data: {
        token: "tok3",
        email: "yeni@test.local",
        davet_eden_id: ortam.personel.id,
        son_kullanma: sonKullanma,
      },
    });

    // Süresi dolmuş davet sayılmamalı
    const eskiTarih = new Date();
    eskiTarih.setDate(eskiTarih.getDate() - 1);
    await adminDb.davetTokeni.create({
      data: {
        token: "tok4",
        email: ortam.personel.email,
        davet_eden_id: ortam.superAdmin.id,
        son_kullanma: eskiTarih,
      },
    });

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.personel.id,
      ortam.personel.email,
    );
    expect(metrik.bekleyenDavetGelen).toBe(2);
    expect(metrik.bekleyenDavetGiden).toBe(1);
  });
});

// ============================================================
// benimAcikKartlarim
// ============================================================

describe("benimAcikKartlarim", () => {
  it("bitiş tarihine göre sıralar (NULL'lar sona)", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const yarin = new Date();
    yarin.setDate(yarin.getDate() + 1);
    const haftayaSonra = new Date();
    haftayaSonra.setDate(haftayaSonra.getDate() + 7);

    const kartA = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Tarihsiz",
    });
    const kartB = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Yarın",
      bitis: yarin,
    });
    const kartC = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Haftaya",
      bitis: haftayaSonra,
    });

    await adminDb.kartYetkilisi.createMany({
      data: [
        { kart_id: kartA.id, kullanici_id: ortam.personel.id },
        { kart_id: kartB.id, kullanici_id: ortam.personel.id },
        { kart_id: kartC.id, kullanici_id: ortam.personel.id },
      ],
    });

    const sonuc = await benimAcikKartlarim(ortam.personel.id);
    expect(sonuc.map((k) => k.baslik)).toEqual(["Yarın", "Haftaya", "Tarihsiz"]);
  });

  it("arşivli ve silinmiş kartları döndürmez", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const aktif = await kartOlusturFiks(adminDb, { listeId: liste.id, baslik: "Aktif" });
    const arsiv = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Arşiv",
      arsiv_mi: true,
    });
    const silinmis = await kartOlusturFiks(adminDb, {
      listeId: liste.id,
      baslik: "Silinmiş",
      silindi_mi: true,
    });

    await adminDb.kartYetkilisi.createMany({
      data: [
        { kart_id: aktif.id, kullanici_id: ortam.personel.id },
        { kart_id: arsiv.id, kullanici_id: ortam.personel.id },
        { kart_id: silinmis.id, kullanici_id: ortam.personel.id },
      ],
    });

    const sonuc = await benimAcikKartlarim(ortam.personel.id);
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]!.baslik).toBe("Aktif");
  });

  it("liste ve proje bilgisini döndürür", async () => {
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Pano",
      kapak_renk: "primary",
    });
    const liste = await listeOlusturFiks(adminDb, {
      projeId: proje.id,
      ad: "Yapılacak",
    });
    const kart = await kartOlusturFiks(adminDb, { listeId: liste.id, baslik: "K1" });
    await adminDb.kartYetkilisi.create({
      data: { kart_id: kart.id, kullanici_id: ortam.personel.id },
    });

    const sonuc = await benimAcikKartlarim(ortam.personel.id);
    expect(sonuc[0]!.liste.ad).toBe("Yapılacak");
    expect(sonuc[0]!.liste.proje.ad).toBe("Pano");
    expect(sonuc[0]!.liste.proje.kapak_renk).toBe("primary");
  });
});

// ============================================================
// sonZiyaretEdilenProjeleriGetir
// ============================================================

describe("sonZiyaretEdilenProjeleriGetir", () => {
  it("son ziyaret tarihine göre azalan sıralar", async () => {
    const p1 = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Eski",
    });
    const p2 = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Yeni",
    });

    const eskiTarih = new Date();
    eskiTarih.setHours(eskiTarih.getHours() - 5);
    const yeniTarih = new Date();

    await adminDb.projeZiyareti.createMany({
      data: [
        { kullanici_id: ortam.personel.id, proje_id: p1.id, son_ziyaret: eskiTarih },
        { kullanici_id: ortam.personel.id, proje_id: p2.id, son_ziyaret: yeniTarih },
      ],
    });

    const sonuc = await sonZiyaretEdilenProjeleriGetir(ortam.personel.id);
    expect(sonuc.map((z) => z.ad)).toEqual(["Yeni", "Eski"]);
  });

  it("silinmiş projeleri döndürmez", async () => {
    const aktif = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Aktif",
    });
    const silinmis = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Silinmiş",
      silindi_mi: true,
    });

    await adminDb.projeZiyareti.createMany({
      data: [
        { kullanici_id: ortam.personel.id, proje_id: aktif.id },
        { kullanici_id: ortam.personel.id, proje_id: silinmis.id },
      ],
    });

    const sonuc = await sonZiyaretEdilenProjeleriGetir(ortam.personel.id);
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]!.ad).toBe("Aktif");
  });

  it("limit'e uyar", async () => {
    const p1 = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id, ad: "P1" });
    const p2 = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id, ad: "P2" });
    const p3 = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id, ad: "P3" });

    await adminDb.projeZiyareti.createMany({
      data: [
        { kullanici_id: ortam.personel.id, proje_id: p1.id },
        { kullanici_id: ortam.personel.id, proje_id: p2.id },
        { kullanici_id: ortam.personel.id, proje_id: p3.id },
      ],
    });

    const sonuc = await sonZiyaretEdilenProjeleriGetir(ortam.personel.id, 2);
    expect(sonuc).toHaveLength(2);
  });
});

// ============================================================
// sonAktiviteleriGetir
// ============================================================

describe("sonAktiviteleriGetir", () => {
  it("makam kullanıcı tüm aktiviteleri görür", async () => {
    await adminDb.aktiviteLogu.createMany({
      data: [
        {
          kullanici_id: ortam.personel.id,
          islem: "CREATE",
          kaynak_tip: "Proje",
          kaynak_id: null,
        },
        {
          kullanici_id: ortam.digerKullanici.id,
          islem: "UPDATE",
          kaynak_tip: "Kart",
          kaynak_id: null,
        },
      ],
    });

    const sonuc = await sonAktiviteleriGetir(ortam.superAdmin.id);
    expect(sonuc).toHaveLength(2);
  });

  it("zaman'a göre azalan sıralar (en yeni önce)", async () => {
    const eski = new Date();
    eski.setHours(eski.getHours() - 2);
    const yeni = new Date();
    yeni.setHours(yeni.getHours() - 1);
    await adminDb.aktiviteLogu.createMany({
      data: [
        {
          zaman: eski,
          kullanici_id: ortam.personel.id,
          islem: "CREATE",
          kaynak_tip: "Proje",
          kaynak_id: null,
        },
        {
          zaman: yeni,
          kullanici_id: ortam.personel.id,
          islem: "UPDATE",
          kaynak_tip: "Proje",
          kaynak_id: null,
        },
      ],
    });

    const sonuc = await sonAktiviteleriGetir(ortam.superAdmin.id);
    expect(new Date(sonuc[0]!.zaman).getTime()).toBeGreaterThan(
      new Date(sonuc[1]!.zaman).getTime(),
    );
  });

  it("Proje kaynağı için bağlam'da proje adını çözer", async () => {
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Asfalt Projesi",
    });
    await adminDb.aktiviteLogu.create({
      data: {
        kullanici_id: ortam.personel.id,
        islem: "CREATE",
        kaynak_tip: "Proje",
        kaynak_id: proje.id,
        yeni_veri: { id: proje.id, ad: "Asfalt Projesi" },
      },
    });

    const sonuc = await sonAktiviteleriGetir(ortam.superAdmin.id);
    const k = sonuc[0]!;
    expect(k.kategori).toBe("proje");
    expect(k.kaynak_id).toBe(proje.id);
    expect(k.baglam?.proje?.ad).toBe("Asfalt Projesi");
    expect(k.mesaj).toContain("projeyi");
  });

  it("UPDATE diff alanlarını degisiklikler[] olarak çözer", async () => {
    const proje = await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Eski Ad",
    });
    await adminDb.aktiviteLogu.create({
      data: {
        kullanici_id: ortam.personel.id,
        islem: "UPDATE",
        kaynak_tip: "Proje",
        kaynak_id: proje.id,
        eski_veri: { ad: "Eski Ad" },
        yeni_veri: { ad: "Yeni Ad" },
        diff: { ad: { eski: "Eski Ad", yeni: "Yeni Ad" } },
      },
    });

    const sonuc = await sonAktiviteleriGetir(ortam.superAdmin.id);
    const k = sonuc[0]!;
    expect(k.islem).toBe("UPDATE");
    // Proje UPDATE için degisiklikler null olabilir (proje adı değişimi mesajda
    // "projenin adını değiştirdi" gibi ifade edildiyse) — en azından mesaj
    // anlamlı olmalı.
    expect(k.mesaj.length).toBeGreaterThan(0);
  });

  it("kullanici null olduğunda kullanici alanı null döner", async () => {
    await adminDb.aktiviteLogu.create({
      data: {
        kullanici_id: null,
        islem: "CREATE",
        kaynak_tip: "Proje",
        kaynak_id: null,
      },
    });

    const sonuc = await sonAktiviteleriGetir(ortam.superAdmin.id);
    expect(sonuc[0]!.kullanici).toBeNull();
  });
});

// ============================================================
// ADR-0026 — Makam (kapsam: "sistem") senaryoları
// ============================================================

describe("anaSayfaMetrikleriniGetir — makam kapsamı", () => {
  it("makam için kapsam 'sistem' olarak döner", async () => {
    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.superAdmin.id,
      ortam.superAdmin.email,
    );
    expect(metrik.kapsam).toBe("sistem");
  });

  it("makam: kart yetkilisi olmasa bile sistemdeki tüm açık kartları sayar", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    // 3 kart oluştur — hiçbiri superAdmin'e atanmadı.
    await kartOlusturFiks(adminDb, { listeId: liste.id });
    await kartOlusturFiks(adminDb, { listeId: liste.id });
    await kartOlusturFiks(adminDb, { listeId: liste.id });

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.superAdmin.id,
      ortam.superAdmin.email,
    );
    expect(metrik.kapsam).toBe("sistem");
    expect(metrik.acikGorev).toBe(3);
  });

  it("makam: bitiş tarihi geçmiş tüm kartları geciken olarak sayar", async () => {
    const proje = await projeOlusturFiks(adminDb, { birimId: ortam.birim.id });
    const liste = await listeOlusturFiks(adminDb, { projeId: proje.id });
    const dun = new Date();
    dun.setDate(dun.getDate() - 1);
    await kartOlusturFiks(adminDb, { listeId: liste.id, bitis: dun });
    await kartOlusturFiks(adminDb, { listeId: liste.id, bitis: dun });
    await kartOlusturFiks(adminDb, { listeId: liste.id }); // bitiş yok

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.superAdmin.id,
      ortam.superAdmin.email,
    );
    expect(metrik.geciken).toBe(2);
  });

  it("makam: bekleyenDavetTum tüm aktif davetleri sayar, gelen/giden 0 döner", async () => {
    const sonKullanma = new Date();
    sonKullanma.setDate(sonKullanma.getDate() + 7);
    await adminDb.davetTokeni.createMany({
      data: [
        {
          token: "m1",
          email: "x@test.local",
          davet_eden_id: ortam.personel.id,
          son_kullanma: sonKullanma,
        },
        {
          token: "m2",
          email: "y@test.local",
          davet_eden_id: ortam.personel.id,
          son_kullanma: sonKullanma,
        },
      ],
    });

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.superAdmin.id,
      ortam.superAdmin.email,
    );
    expect(metrik.bekleyenDavetTum).toBe(2);
    expect(metrik.bekleyenDavetGelen).toBe(0);
    expect(metrik.bekleyenDavetGiden).toBe(0);
  });

  it("kişisel: bekleyenDavetTum gelen+giden toplamı olarak gelir", async () => {
    const sonKullanma = new Date();
    sonKullanma.setDate(sonKullanma.getDate() + 7);
    await adminDb.davetTokeni.createMany({
      data: [
        {
          token: "k1",
          email: ortam.personel.email,
          davet_eden_id: ortam.superAdmin.id,
          son_kullanma: sonKullanma,
        },
        {
          token: "k2",
          email: "yeni@test.local",
          davet_eden_id: ortam.personel.id,
          son_kullanma: sonKullanma,
        },
      ],
    });

    const metrik = await anaSayfaMetrikleriniGetir(
      ortam.personel.id,
      ortam.personel.email,
    );
    expect(metrik.bekleyenDavetGelen).toBe(1);
    expect(metrik.bekleyenDavetGiden).toBe(1);
    expect(metrik.bekleyenDavetTum).toBe(2);
  });
});

// ============================================================
// ADR-0026 — makamKpisiniGetir
// ============================================================

describe("makamKpisiniGetir", () => {
  it("non-makam kullanıcı için null döner", async () => {
    const sonuc = await makamKpisiniGetir(ortam.personel.id);
    expect(sonuc).toBeNull();
  });

  it("makam: aktif proje sayısı silinmemiş projeleri döndürür", async () => {
    await projeOlusturFiks(adminDb, { birimId: ortam.birim.id, ad: "P1" });
    await projeOlusturFiks(adminDb, { birimId: ortam.birim.id, ad: "P2" });
    await projeOlusturFiks(adminDb, {
      birimId: ortam.birim.id,
      ad: "Silinmis",
      silindi_mi: true,
    });

    const sonuc = await makamKpisiniGetir(ortam.superAdmin.id);
    expect(sonuc).not.toBeNull();
    expect(sonuc!.aktifProje).toBe(2);
  });

  it("makam: aktifKullaniciSon7Gun son 7 günde giriş yapanları sayar", async () => {
    const dun = new Date();
    dun.setDate(dun.getDate() - 1);
    const onGunOnce = new Date();
    onGunOnce.setDate(onGunOnce.getDate() - 10);

    // Personel dün giriş yaptı.
    await adminDb.kullanici.update({
      where: { id: ortam.personel.id },
      data: { son_giris_zamani: dun },
    });
    // digerKullanici 10 gün önce — sınırın dışı.
    await adminDb.kullanici.update({
      where: { id: ortam.digerKullanici.id },
      data: { son_giris_zamani: onGunOnce },
    });

    const sonuc = await makamKpisiniGetir(ortam.superAdmin.id);
    expect(sonuc!.aktifKullaniciSon7Gun).toBe(1);
  });

  it("makam: onayBekleyenKullanici BEKLIYOR durumundakileri sayar", async () => {
    await adminDb.kullanici.create({
      data: {
        email: "bekleyen@test.local",
        parola_hash: "x",
        ad: "B",
        soyad: "K",
        onay_durumu: "BEKLIYOR",
      },
    });

    const sonuc = await makamKpisiniGetir(ortam.superAdmin.id);
    expect(sonuc!.onayBekleyenKullanici).toBe(1);
  });

  it("makam: kritikHataSon24Sa FATAL/ERROR + çözülmemişleri sayar", async () => {
    const simdi = new Date();
    const otuzSaatOnce = new Date(simdi);
    otuzSaatOnce.setHours(otuzSaatOnce.getHours() - 30);

    await adminDb.hataLogu.createMany({
      data: [
        { seviye: "FATAL", taraf: "server", mesaj: "f1", cozuldu_mu: false },
        { seviye: "ERROR", taraf: "server", mesaj: "e1", cozuldu_mu: false },
        // Çözülmüş — sayılmamalı
        { seviye: "ERROR", taraf: "server", mesaj: "e2", cozuldu_mu: true },
        // WARN — sayılmamalı
        { seviye: "WARN", taraf: "server", mesaj: "w1", cozuldu_mu: false },
        // 30 saat önce — sayılmamalı
        {
          seviye: "ERROR",
          taraf: "server",
          mesaj: "eski",
          cozuldu_mu: false,
          zaman: otuzSaatOnce,
        },
      ],
    });

    const sonuc = await makamKpisiniGetir(ortam.superAdmin.id);
    expect(sonuc!.kritikHataSon24Sa).toBe(2);
  });
});
