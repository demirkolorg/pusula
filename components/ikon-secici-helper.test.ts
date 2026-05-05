import { describe, it, expect } from "vitest";
import {
  ikonlariFiltrele,
  satirlaraBol,
} from "./ikon-secici-helper";

const ORNEK = ["star", "star-half", "heart", "heart-pulse", "home", "house"] as const;

describe("ikonlariFiltrele", () => {
  it("boş sorgu tüm listeyi döner (aynı referans)", () => {
    const r = ikonlariFiltrele("", ORNEK);
    expect(r).toBe(ORNEK);
  });

  it("substring eşleşmesi case-insensitive", () => {
    expect(ikonlariFiltrele("STAR", ORNEK)).toEqual(["star", "star-half"]);
    expect(ikonlariFiltrele("heart", ORNEK)).toEqual(["heart", "heart-pulse"]);
  });

  it("trim uygulanır", () => {
    expect(ikonlariFiltrele("  home  ", ORNEK)).toEqual(["home"]);
  });

  it("eşleşme yoksa boş dizi", () => {
    expect(ikonlariFiltrele("xxx-yok", ORNEK)).toEqual([]);
  });
});

describe("satirlaraBol", () => {
  it("3 kolon ile 6 öğeyi 2 satıra böler", () => {
    expect(satirlaraBol([1, 2, 3, 4, 5, 6], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("artık öğeler son satıra düşer", () => {
    expect(satirlaraBol([1, 2, 3, 4, 5], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
  });

  it("boş listede boş çıktı", () => {
    expect(satirlaraBol([], 4)).toEqual([]);
  });

  it("kolon < 1 ise tek satır", () => {
    expect(satirlaraBol([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
  });
});
