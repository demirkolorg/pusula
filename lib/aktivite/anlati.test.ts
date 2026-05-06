import { describe, expect, it } from "vitest";
import { aktiviteAnlati } from "./anlati";
import type { AktiviteOzeti } from "./tipler";

function aktivite(parca: Partial<AktiviteOzeti>): AktiviteOzeti {
  return {
    id: "1",
    zaman: new Date("2026-05-06T09:00:00.000Z"),
    kullanici: { id: "u1", ad: "Ayşe", soyad: "Demir" },
    kategori: "kart",
    islem: "UPDATE",
    mesaj: "kartı tamamladı",
    detay: null,
    kaynak_id: "k1",
    degisiklikler: null,
    baglam: {
      proje: { id: "p1", ad: "Kış Tedbirleri" },
      liste: { id: "l1", ad: "Hazırlık" },
      kart: { id: "k1", baslik: "Ambulans planı" },
    },
    ...parca,
  };
}

describe("aktiviteAnlati", () => {
  it("kart aktivitesini tek cümle anlatıya çevirir", () => {
    expect(aktiviteAnlati(aktivite({})).metin).toBe(
      "Ayşe Demir, 'Kış Tedbirleri' projesinin 'Hazırlık' listesinde 'Ambulans planı' kartını tamamladı.",
    );
  });

  it("kartın liste değişimini iyelikli ve açık anlatır", () => {
    expect(
      aktiviteAnlati(aktivite({ mesaj: "kartın listesini değiştirdi" })).metin,
    ).toBe(
      "Ayşe Demir, 'Kış Tedbirleri' projesinin 'Hazırlık' listesinde 'Ambulans planı' kartının listesini değiştirdi.",
    );
  });

  it("sistem kullanıcısını ve yorum detayını işler", () => {
    const sonuc = aktiviteAnlati(
      aktivite({
        kullanici: null,
        kategori: "yorum",
        mesaj: "yorum yazdı",
        detay: "Kontrol edildi.",
      }),
    );
    expect(sonuc.metin).toContain("Sistem");
    expect(sonuc.metin).toContain("yorum yazdı: Kontrol edildi.");
  });
});
