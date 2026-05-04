import { describe, expect, it } from "vitest";
import { aktiviteDiff } from "./aktivite-diff";

describe("aktiviteDiff", () => {
  it("iki taraf da boşsa boş döner", () => {
    expect(aktiviteDiff("", "")).toEqual({ eski: [], yeni: [] });
  });

  it("eski boşsa yeni metin tamamen 'fark'", () => {
    const r = aktiviteDiff("", "Selam");
    expect(r.eski).toEqual([]);
    expect(r.yeni).toEqual([{ metin: "Selam", tip: "fark" }]);
  });

  it("yeni boşsa eski metin tamamen 'fark'", () => {
    const r = aktiviteDiff("Selam", "");
    expect(r.eski).toEqual([{ metin: "Selam", tip: "fark" }]);
    expect(r.yeni).toEqual([]);
  });

  it("eşit metinde tamamı 'ortak'", () => {
    const r = aktiviteDiff("aynı metin", "aynı metin");
    expect(r.eski).toEqual([{ metin: "aynı metin", tip: "ortak" }]);
    expect(r.yeni).toEqual([{ metin: "aynı metin", tip: "ortak" }]);
  });

  it("sona kelime eklenmesi → ortak prefix + 'fark' suffix", () => {
    const r = aktiviteDiff("merhaba dünya", "merhaba dünya nasılsın");
    expect(r.eski.map((s) => s.tip)).toEqual(["ortak"]);
    // Yeni'de ek kısım 'fark' olarak işaretlenir
    const yeniFarkliMetinler = r.yeni
      .filter((s) => s.tip === "fark")
      .map((s) => s.metin)
      .join("");
    expect(yeniFarkliMetinler).toContain("nasılsın");
  });

  it("baştaki kelimenin silinmesi → eski'de 'fark' başlangıç", () => {
    const r = aktiviteDiff("eski merhaba dünya", "merhaba dünya");
    const eskiFarkli = r.eski
      .filter((s) => s.tip === "fark")
      .map((s) => s.metin)
      .join("");
    expect(eskiFarkli).toContain("eski");
    expect(r.yeni.every((s) => s.tip === "ortak")).toBe(true);
  });

  it("ortadaki kelimenin değiştirilmesi → her iki tarafta da 'fark' var", () => {
    const r = aktiviteDiff("a b c", "a x c");
    const eskiFarkli = r.eski.filter((s) => s.tip === "fark");
    const yeniFarkli = r.yeni.filter((s) => s.tip === "fark");
    expect(eskiFarkli.length).toBeGreaterThan(0);
    expect(yeniFarkli.length).toBeGreaterThan(0);
  });

  it("orijinal metnin tamamını koruyup birleştirir (eski)", () => {
    const eskiMetin = "Sırasıyla yapılması gerekenler;\n1- bir\n2- iki";
    const yeniMetin = "Sırasıyla yapılması gerekenler;\n1- bir\n2- iki\n3- üç";
    const r = aktiviteDiff(eskiMetin, yeniMetin);
    expect(r.eski.map((s) => s.metin).join("")).toBe(eskiMetin);
    expect(r.yeni.map((s) => s.metin).join("")).toBe(yeniMetin);
  });

  it("bitişik aynı tip segmentler birleştirilir", () => {
    const r = aktiviteDiff("a b c", "a b c d e");
    // Yeni'de "d e" (ve önündeki boşluklar) tek "fark" segmenti olmalı
    let oncekiTip: string | null = null;
    let ardisikAyniTip = false;
    for (const s of r.yeni) {
      if (s.tip === oncekiTip) {
        ardisikAyniTip = true;
        break;
      }
      oncekiTip = s.tip;
    }
    expect(ardisikAyniTip).toBe(false);
  });

  it("performans tavanını aşan metinlerde tek 'fark' segment olarak döner", () => {
    const buyukMetin = ("kelime ".repeat(2500)).trim();
    const buyukYeni = ("yeni ".repeat(2500)).trim();
    const r = aktiviteDiff(buyukMetin, buyukYeni);
    expect(r.eski).toEqual([{ metin: buyukMetin, tip: "fark" }]);
    expect(r.yeni).toEqual([{ metin: buyukYeni, tip: "fark" }]);
  });
});
