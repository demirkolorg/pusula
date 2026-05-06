import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { olusturTestDb, truncateAll } from "../../tests/db/setup";
import {
  kartOlusturFiks,
  listeOlusturFiks,
  ortamKur,
  projeOlusturFiks,
} from "../../tests/fixtures/proje";
import { BUCKET } from "../../lib/storage";
import { eklentileriBackfillEt } from "./backfill-eklenti-dosya";

const db = olusturTestDb();

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await truncateAll(db);
});

async function ekKartOrtami() {
  const ortam = await ortamKur(db);
  const proje = await projeOlusturFiks(db, {
    birimId: ortam.birim.id,
    olusturanId: ortam.superAdmin.id,
  });
  const liste = await listeOlusturFiks(db, { projeId: proje.id });
  const kart = await kartOlusturFiks(db, {
    listeId: liste.id,
    olusturanId: ortam.superAdmin.id,
  });
  return { ortam, proje, liste, kart };
}

describe("eklentileriBackfillEt — F2 backfill", () => {
  it("aktif Eklenti kayıtlarını Dosya + Sürüm + Bağlantı üçlüsüne taşır", async () => {
    const { ortam, proje, liste, kart } = await ekKartOrtami();

    const eklenti = await db.eklenti.create({
      data: {
        kart_id: kart.id,
        yukleyen_id: ortam.superAdmin.id,
        ad: "rapor.pdf",
        mime: "application/pdf",
        boyut: 12345,
        depolama_yolu: `kartlar/${kart.id}/abc.pdf`,
      },
      select: { id: true, olusturma_zamani: true },
    });

    const sayilar = await eklentileriBackfillEt(db);

    expect(sayilar.toplam).toBe(1);
    expect(sayilar.yenilenen).toBe(1);
    expect(sayilar.atlanan).toBe(0);
    expect(sayilar.hata).toBe(0);

    const dosya = await db.dosya.findUnique({ where: { id: eklenti.id } });
    expect(dosya).not.toBeNull();
    expect(dosya?.id).toBe(eklenti.id);
    expect(dosya?.ad).toBe("rapor.pdf");
    expect(dosya?.mime).toBe("application/pdf");
    expect(dosya?.boyut).toBe(12345);
    expect(dosya?.uzanti).toBe("pdf");
    expect(dosya?.kategori).toBe("PDF");
    expect(dosya?.bucket).toBe(BUCKET);
    expect(dosya?.depolama_yolu).toBe(`kartlar/${kart.id}/abc.pdf`);
    expect(dosya?.durum).toBe("HAZIR");
    expect(dosya?.silindi_mi).toBe(false);
    expect(dosya?.olusturma_zamani.toISOString()).toBe(
      eklenti.olusturma_zamani.toISOString(),
    );

    const surum = await db.dosyaSurumu.findFirst({
      where: { dosya_id: eklenti.id },
    });
    expect(surum?.surum_no).toBe(1);
    expect(surum?.depolama_yolu).toBe(`kartlar/${kart.id}/abc.pdf`);
    expect(surum?.bucket).toBe(BUCKET);

    const baglanti = await db.dosyaBaglantisi.findFirst({
      where: { dosya_id: eklenti.id },
    });
    expect(baglanti?.kaynak_tip).toBe("KART");
    expect(baglanti?.kaynak_id).toBe(kart.id);
    expect(baglanti?.kart_id).toBe(kart.id);
    expect(baglanti?.liste_id).toBe(liste.id);
    expect(baglanti?.proje_id).toBe(proje.id);
    expect(baglanti?.ekleyen_id).toBe(ortam.superAdmin.id);
    expect(baglanti?.birincil_mi).toBe(true);
  });

  it("silinmiş Eklenti'nin silindi_mi/silinme_zamani değerini korur", async () => {
    const { ortam, kart } = await ekKartOrtami();

    const silinmeZamani = new Date("2026-01-15T10:00:00.000Z");
    const eklenti = await db.eklenti.create({
      data: {
        kart_id: kart.id,
        yukleyen_id: ortam.superAdmin.id,
        ad: "eski.docx",
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        boyut: 5000,
        depolama_yolu: `kartlar/${kart.id}/old.docx`,
        silindi_mi: true,
        silinme_zamani: silinmeZamani,
      },
      select: { id: true },
    });

    const sayilar = await eklentileriBackfillEt(db);
    expect(sayilar.yenilenen).toBe(1);

    const dosya = await db.dosya.findUnique({ where: { id: eklenti.id } });
    expect(dosya?.silindi_mi).toBe(true);
    expect(dosya?.silinme_zamani?.toISOString()).toBe(
      silinmeZamani.toISOString(),
    );
    expect(dosya?.kategori).toBe("OFIS_BELGESI");
  });

  it("idempotent: ikinci kez çalıştırılınca duplicate üretmez", async () => {
    const { ortam, kart } = await ekKartOrtami();

    await db.eklenti.create({
      data: {
        kart_id: kart.id,
        yukleyen_id: ortam.superAdmin.id,
        ad: "foto.png",
        mime: "image/png",
        boyut: 2048,
        depolama_yolu: `kartlar/${kart.id}/img.png`,
      },
    });

    const ilk = await eklentileriBackfillEt(db);
    expect(ilk.yenilenen).toBe(1);
    expect(ilk.atlanan).toBe(0);

    const ikinci = await eklentileriBackfillEt(db);
    expect(ikinci.toplam).toBe(1);
    expect(ikinci.yenilenen).toBe(0);
    expect(ikinci.atlanan).toBe(1);
    expect(ikinci.hata).toBe(0);

    const dosyaSayisi = await db.dosya.count();
    const surumSayisi = await db.dosyaSurumu.count();
    const baglantiSayisi = await db.dosyaBaglantisi.count();
    expect(dosyaSayisi).toBe(1);
    expect(surumSayisi).toBe(1);
    expect(baglantiSayisi).toBe(1);
  });

  it("birden fazla Eklenti'yi tek seferde işler", async () => {
    const { ortam, kart } = await ekKartOrtami();

    await db.eklenti.createMany({
      data: [
        {
          kart_id: kart.id,
          yukleyen_id: ortam.superAdmin.id,
          ad: "a.pdf",
          mime: "application/pdf",
          boyut: 100,
          depolama_yolu: `kartlar/${kart.id}/a.pdf`,
        },
        {
          kart_id: kart.id,
          yukleyen_id: ortam.personel.id,
          ad: "b.xlsx",
          mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          boyut: 200,
          depolama_yolu: `kartlar/${kart.id}/b.xlsx`,
        },
        {
          kart_id: kart.id,
          yukleyen_id: ortam.superAdmin.id,
          ad: "c.zip",
          mime: "application/zip",
          boyut: 300,
          depolama_yolu: `kartlar/${kart.id}/c.zip`,
        },
      ],
    });

    const sayilar = await eklentileriBackfillEt(db);
    expect(sayilar.toplam).toBe(3);
    expect(sayilar.yenilenen).toBe(3);
    expect(sayilar.hata).toBe(0);

    const dosyalar = await db.dosya.findMany({ orderBy: { ad: "asc" } });
    expect(dosyalar).toHaveLength(3);
    expect(dosyalar.map((d) => d.kategori)).toEqual(["PDF", "TABLO", "ARSIV"]);
  });

  it("hiç Eklenti yoksa boş sayılarla geçer", async () => {
    await ortamKur(db); // sadece DB'yi seed edelim, eklenti yaratmıyoruz

    const sayilar = await eklentileriBackfillEt(db);
    expect(sayilar.toplam).toBe(0);
    expect(sayilar.yenilenen).toBe(0);
    expect(sayilar.atlanan).toBe(0);
    expect(sayilar.hata).toBe(0);
  });
});
