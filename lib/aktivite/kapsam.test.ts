import { describe, expect, it } from "vitest";
import { kapsamWhere } from "./kapsam-where";
import type { AktiviteKapsamFiltresi } from "./tipler";

const temel: AktiviteKapsamFiltresi = {
  kullaniciId: "00000000-0000-0000-0000-000000000001",
  makam: false,
  projeIdleri: ["p1"],
  listeIdleri: ["l1"],
  kartIdleri: ["k1"],
  kontrolListesiIdleri: ["kl1"],
};

describe("kapsamWhere", () => {
  it("makam için filtre üretmez", () => {
    expect(kapsamWhere({ ...temel, makam: true })).toEqual({});
  });

  it("kullanıcı, proje, liste, kart ve kontrol maddesi kapsamını OR matrisine koyar", () => {
    const where = kapsamWhere(temel);
    expect(where).toHaveProperty("OR");
    const or = where.OR;
    expect(Array.isArray(or)).toBe(true);
    expect(JSON.stringify(or)).toContain("kullanici_id");
    expect(JSON.stringify(or)).toContain("proje_id");
    expect(JSON.stringify(or)).toContain("liste_id");
    expect(JSON.stringify(or)).toContain("kart_id");
    expect(JSON.stringify(or)).toContain("kontrol_listesi_id");
  });

  it("erişim id setleri boşsa en az kendi aktivitelerini döndürür", () => {
    const where = kapsamWhere({
      kullaniciId: temel.kullaniciId,
      makam: false,
      projeIdleri: [],
      listeIdleri: [],
      kartIdleri: [],
      kontrolListesiIdleri: [],
    });
    expect(where).toEqual({ OR: [{ kullanici_id: temel.kullaniciId }] });
  });
});
