import { describe, expect, it } from "vitest";
import { DURUM_LABEL, kullaniciDurumu } from "./durum-helper";

describe("kullaniciDurumu", () => {
  it("BEKLIYOR durumu öncelikli (aktif değerinden bağımsız)", () => {
    expect(
      kullaniciDurumu({ aktif: false, onay_durumu: "BEKLIYOR" }),
    ).toBe("BEKLIYOR");
    expect(
      kullaniciDurumu({ aktif: true, onay_durumu: "BEKLIYOR" }),
    ).toBe("BEKLIYOR");
  });

  it("REDDEDILDI durumu öncelikli", () => {
    expect(
      kullaniciDurumu({ aktif: false, onay_durumu: "REDDEDILDI" }),
    ).toBe("REDDEDILDI");
  });

  it("ONAYLANDI + aktif=true → AKTIF", () => {
    expect(
      kullaniciDurumu({ aktif: true, onay_durumu: "ONAYLANDI" }),
    ).toBe("AKTIF");
  });

  it("ONAYLANDI + aktif=false → PASIF (manuel deaktif)", () => {
    expect(
      kullaniciDurumu({ aktif: false, onay_durumu: "ONAYLANDI" }),
    ).toBe("PASIF");
  });

  it("onay_durumu null → aktif flag belirler (eski kayıtlar için)", () => {
    expect(kullaniciDurumu({ aktif: true, onay_durumu: null })).toBe(
      "AKTIF",
    );
    expect(kullaniciDurumu({ aktif: false, onay_durumu: null })).toBe(
      "PASIF",
    );
  });

  it("DURUM_LABEL Türkçe etiketler", () => {
    expect(DURUM_LABEL.AKTIF).toBe("Aktif");
    expect(DURUM_LABEL.BEKLIYOR).toBe("Onay Bekliyor");
    expect(DURUM_LABEL.REDDEDILDI).toBe("Reddedildi");
    expect(DURUM_LABEL.PASIF).toBe("Pasif");
  });
});
