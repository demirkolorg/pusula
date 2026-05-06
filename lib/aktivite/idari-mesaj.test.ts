import { describe, expect, it } from "vitest";
import { idariMesaj } from "./idari-mesaj";
import type { HamAktivite } from "./tipler";

function ham(parca: Partial<HamAktivite>): HamAktivite {
  return {
    id: 1n,
    zaman: new Date("2026-05-06T09:00:00.000Z"),
    kullanici_id: null,
    islem: "UPDATE",
    kaynak_tip: "Kullanici",
    kaynak_id: "u1",
    yeni_veri: null,
    eski_veri: null,
    diff: null,
    ...parca,
  };
}

describe("idariMesaj", () => {
  it("kullanıcı kaydını ad soyad detayıyla anlatır", () => {
    const mesaj = idariMesaj(
      ham({ yeni_veri: { ad: "Ayşe", soyad: "Demir" } }),
      "UPDATE",
    );
    expect(mesaj).toEqual({
      kategori: "diger",
      mesaj: "kullanıcı kaydını güncelledi",
      detay: "Ayşe Demir",
    });
  });

  it("rol izin bağlantısını özel mesajla anlatır", () => {
    const mesaj = idariMesaj(
      ham({ kaynak_tip: "RolIzin", yeni_veri: { izin_id: "izin-1" } }),
      "CREATE",
    );
    expect(mesaj?.mesaj).toBe("role izin ekledi");
  });
});
