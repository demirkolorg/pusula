import { describe, expect, it } from "vitest";
import { SOCKET, room } from "./socket-events";

// Event isim sabitleri ve room üreticilerin tutarlılığı (Kural 54).

describe("SOCKET event isimleri (Kural 54)", () => {
  it("kebab-case namespace + iki nokta + fiil pattern'ine uyar", () => {
    const ihlal = Object.values(SOCKET).filter(
      (ad) => !/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(ad),
    );
    expect(ihlal).toEqual([]);
  });

  it("event isimleri benzersiz", () => {
    const tumu = Object.values(SOCKET);
    expect(tumu.length).toBe(new Set(tumu).size);
  });
});

describe("room üreticiler", () => {
  it("proje room: 'proje:<id>'", () => {
    expect(room.proje("abc")).toBe("proje:abc");
  });

  it("kart room: 'kart:<id>'", () => {
    expect(room.kart("xyz")).toBe("kart:xyz");
  });

  it("kullanici room: 'kullanici:<id>'", () => {
    expect(room.kullanici("u-1")).toBe("kullanici:u-1");
  });

  it("aynı id'ye aynı room — deterministic", () => {
    expect(room.proje("p1")).toBe(room.proje("p1"));
  });
});
