import { describe, it, expect } from "vitest";
import {
  ikonMu,
  ikonNormalize,
  IKON_SAYISI,
  TUM_IKONLAR,
} from "./kapak-ikon";

describe("ikonMu", () => {
  it("bilinen lucide ismi true döner", () => {
    expect(ikonMu("star")).toBe(true);
    expect(ikonMu("heart")).toBe(true);
    expect(ikonMu("building-2")).toBe(true);
  });

  it("bilinmeyen string false döner", () => {
    expect(ikonMu("definitely-not-an-icon-xyz")).toBe(false);
    expect(ikonMu("Star")).toBe(false); // case-sensitive
    expect(ikonMu("")).toBe(false);
  });

  it("string olmayan değerler false döner", () => {
    expect(ikonMu(null)).toBe(false);
    expect(ikonMu(undefined)).toBe(false);
    expect(ikonMu(42)).toBe(false);
    expect(ikonMu({ name: "star" })).toBe(false);
  });
});

describe("ikonNormalize", () => {
  it("geçerli ikon string'ini geri döner", () => {
    expect(ikonNormalize("star")).toBe("star");
  });

  it("geçersiz veya boş değer null döner", () => {
    expect(ikonNormalize("foo-bar-baz-yok")).toBeNull();
    expect(ikonNormalize(null)).toBeNull();
    expect(ikonNormalize(undefined)).toBeNull();
    expect(ikonNormalize(123)).toBeNull();
  });
});

describe("TUM_IKONLAR / IKON_SAYISI", () => {
  it("set boş değil ve sayı 1000+ (zengin koleksiyon)", () => {
    expect(IKON_SAYISI).toBeGreaterThan(1000);
    expect(TUM_IKONLAR.length).toBe(IKON_SAYISI);
  });

  it("birkaç klasik ikon listede var", () => {
    expect(TUM_IKONLAR).toContain("star");
    expect(TUM_IKONLAR).toContain("heart");
    expect(TUM_IKONLAR).toContain("home");
  });
});
