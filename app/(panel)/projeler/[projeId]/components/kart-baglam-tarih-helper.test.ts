import { describe, it, expect } from "vitest";
import { tarihOnayHesapla, TARIH_ONAYLARI } from "./kart-baglam-tarih-helper";

// Tüm referans tarihler İstanbul TZ'de 12:00 öğlen (UTC 09:00) — DST etkisi yok.
// Day-of-week: Pzr=0, Pzt=1, Sal=2, Çar=3, Per=4, Cum=5, Cmt=6
// 2026-05-04 = Pazartesi, 2026-05-09 = Cumartesi, 2026-05-10 = Pazar

describe("tarihOnayHesapla", () => {
  const istanbulOgle = (yil: number, ay: number, gun: number) =>
    new Date(Date.UTC(yil, ay - 1, gun, 9, 0, 0)); // İstanbul 12:00

  it("bugun: aynı gün 17:00 İstanbul", () => {
    const ref = istanbulOgle(2026, 5, 4); // Pzt
    const sonuc = tarihOnayHesapla("bugun", ref);
    expect(sonuc).not.toBeNull();
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(sonuc!);
    expect(fmt).toContain("2026-05-04");
    expect(fmt).toContain("17:00");
  });

  it("yarin: ertesi gün 17:00", () => {
    const ref = istanbulOgle(2026, 5, 4); // Pzt
    const sonuc = tarihOnayHesapla("yarin", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("2026-05-05");
  });

  it("haftasonu: hafta içi günden Cumartesi'ye gider", () => {
    const ref = istanbulOgle(2026, 5, 4); // Pzt → Cmt = 9
    const sonuc = tarihOnayHesapla("haftasonu", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("2026-05-09");
  });

  it("haftasonu: Cuma'dan Cumartesi'ye gider", () => {
    const ref = istanbulOgle(2026, 5, 8); // Cum → Cmt = 9
    const sonuc = tarihOnayHesapla("haftasonu", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("09");
  });

  it("haftasonu: Cumartesi günündeyken aynı gün döner", () => {
    const ref = istanbulOgle(2026, 5, 9); // Cmt
    const sonuc = tarihOnayHesapla("haftasonu", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("09");
  });

  it("haftasonu: Pazar günündeyken aynı gün döner", () => {
    const ref = istanbulOgle(2026, 5, 10); // Pzr
    const sonuc = tarihOnayHesapla("haftasonu", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("10");
  });

  it("gelecek-hafta: Pazartesi'den sonraki Pazartesi'ye gider", () => {
    const ref = istanbulOgle(2026, 5, 4); // Pzt → 11 Pzt
    const sonuc = tarihOnayHesapla("gelecek-hafta", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("2026-05-11");
  });

  it("gelecek-hafta: Cuma'dan sonraki Pazartesi'ye gider", () => {
    const ref = istanbulOgle(2026, 5, 8); // Cum → 11 Pzt
    const sonuc = tarihOnayHesapla("gelecek-hafta", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("11");
  });

  it("gelecek-hafta: Pazar'dan sonraki Pazartesi'ye gider", () => {
    const ref = istanbulOgle(2026, 5, 10); // Pzr → 11 Pzt
    const sonuc = tarihOnayHesapla("gelecek-hafta", ref);
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
    }).format(sonuc!);
    expect(fmt).toBe("11");
  });

  it("kaldir: null döner", () => {
    expect(tarihOnayHesapla("kaldir")).toBeNull();
  });
});

describe("TARIH_ONAYLARI", () => {
  it("4 ön ayar tanımlı (kaldir liste dışı, button olarak ayrı)", () => {
    expect(TARIH_ONAYLARI).toHaveLength(4);
    expect(TARIH_ONAYLARI.map((t) => t.anahtar)).toEqual([
      "bugun",
      "yarin",
      "haftasonu",
      "gelecek-hafta",
    ]);
  });

  it("tüm etiketler Türkçe ve dolu", () => {
    for (const o of TARIH_ONAYLARI) {
      expect(o.etiket.length).toBeGreaterThan(0);
      expect(o.etiket).toMatch(/[a-zçğıöşü]/i);
    }
  });
});
