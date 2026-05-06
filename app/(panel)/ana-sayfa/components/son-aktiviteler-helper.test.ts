import { describe, it, expect } from "vitest";
import { zamanGrubu, gruplaraAyir } from "./son-aktiviteler-helper";

describe("zamanGrubu", () => {
  const simdi = new Date(2026, 4, 6, 14, 30); // 2026-05-06 14:30 Çarşamba

  it("aynı gün için 'bugun' döner", () => {
    expect(zamanGrubu(new Date(2026, 4, 6, 0, 0), simdi)).toBe("bugun");
    expect(zamanGrubu(new Date(2026, 4, 6, 23, 59), simdi)).toBe("bugun");
  });

  it("bir gün önce için 'dun' döner", () => {
    expect(zamanGrubu(new Date(2026, 4, 5, 12, 0), simdi)).toBe("dun");
    expect(zamanGrubu(new Date(2026, 4, 5, 0, 0), simdi)).toBe("dun");
  });

  it("2-6 gün önce için 'buHafta' döner", () => {
    expect(zamanGrubu(new Date(2026, 4, 4, 12, 0), simdi)).toBe("buHafta");
    expect(zamanGrubu(new Date(2026, 3, 30, 8, 0), simdi)).toBe("buHafta");
  });

  it("7+ gün önce için 'daha-eski' döner", () => {
    expect(zamanGrubu(new Date(2026, 3, 29, 12, 0), simdi)).toBe("daha-eski");
    expect(zamanGrubu(new Date(2025, 11, 1), simdi)).toBe("daha-eski");
  });
});

describe("gruplaraAyir", () => {
  const simdi = new Date(2026, 4, 6, 14, 30);

  it("boş giriş için boş dizi döner", () => {
    expect(gruplaraAyir([], simdi)).toEqual([]);
  });

  it("tek grup için tek bölüm döner", () => {
    const sonuc = gruplaraAyir(
      [
        { id: "1", zaman: new Date(2026, 4, 6, 10, 0) },
        { id: "2", zaman: new Date(2026, 4, 6, 9, 0) },
      ],
      simdi,
    );
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]!.grup).toBe("bugun");
    expect(sonuc[0]!.baslik).toBe("Bugün");
    expect(sonuc[0]!.satirlar).toHaveLength(2);
  });

  it("birden fazla grup için sıralı döner (bugün → dün → bu hafta → eski)", () => {
    const sonuc = gruplaraAyir(
      [
        { id: "1", zaman: new Date(2026, 4, 6, 10, 0) }, // bugun
        { id: "2", zaman: new Date(2026, 4, 5, 10, 0) }, // dun
        { id: "3", zaman: new Date(2026, 4, 3, 10, 0) }, // buHafta
        { id: "4", zaman: new Date(2026, 3, 1, 10, 0) }, // daha-eski
      ],
      simdi,
    );
    expect(sonuc.map((s) => s.grup)).toEqual([
      "bugun",
      "dun",
      "buHafta",
      "daha-eski",
    ]);
  });

  it("boş gruplar dönmez", () => {
    const sonuc = gruplaraAyir(
      [
        { id: "1", zaman: new Date(2026, 4, 6, 10, 0) }, // bugun
        { id: "2", zaman: new Date(2026, 3, 1, 10, 0) }, // daha-eski
      ],
      simdi,
    );
    expect(sonuc.map((s) => s.grup)).toEqual(["bugun", "daha-eski"]);
  });

  it("girdi sırasını grup içinde korur", () => {
    const sonuc = gruplaraAyir(
      [
        { id: "1", zaman: new Date(2026, 4, 6, 14, 0) },
        { id: "2", zaman: new Date(2026, 4, 6, 12, 0) },
        { id: "3", zaman: new Date(2026, 4, 6, 10, 0) },
      ],
      simdi,
    );
    expect(sonuc[0]!.satirlar.map((s) => s.id)).toEqual(["1", "2", "3"]);
  });
});
