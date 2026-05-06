import { describe, it, expect } from "vitest";
import { mentionParcala, type KisiMap } from "./mention";
import {
  mentionIdleriniCikar,
  mentionlariDuzenlemeMetnineCevir,
  mentionlariGorunenMetneCevir,
} from "./mention-format";

const UUID_A = "00000000-0000-0000-0000-000000000001";
const UUID_B = "00000000-0000-0000-0000-000000000002";

const kisiMap: KisiMap = new Map([
  [UUID_A, { ad: "Ahmet", soyad: "Yılmaz" }],
  [UUID_B, { ad: "Zeynep", soyad: "Kaya" }],
]);

describe("mentionParcala", () => {
  it("metin içindeki UUID mention'ları parça parça döner", () => {
    const r = mentionParcala(`Selam @${UUID_A}, sana @${UUID_B} sordum.`, kisiMap);
    expect(r).toHaveLength(5);
    expect(r[0]).toEqual({ tip: "metin", deger: "Selam " });
    expect(r[1]).toEqual({ tip: "mention", uuid: UUID_A, ad: "Ahmet Yılmaz" });
    expect(r[2]).toEqual({ tip: "metin", deger: ", sana " });
    expect(r[3]).toEqual({ tip: "mention", uuid: UUID_B, ad: "Zeynep Kaya" });
    expect(r[4]).toEqual({ tip: "metin", deger: " sordum." });
  });

  it("bilinmeyen UUID için ad null", () => {
    const r = mentionParcala(
      "Hey @99999999-9999-9999-9999-999999999999",
      kisiMap,
    );
    expect(r[1]).toMatchObject({
      tip: "mention",
      ad: null,
    });
  });

  it("hiç mention yoksa tek metin parçası", () => {
    const r = mentionParcala("Düz metin", kisiMap);
    expect(r).toEqual([{ tip: "metin", deger: "Düz metin" }]);
  });

  it("UUID dışı @ ler atlanır", () => {
    const r = mentionParcala("Ahmet @beyefendi merhaba", kisiMap);
    expect(r).toEqual([{ tip: "metin", deger: "Ahmet @beyefendi merhaba" }]);
  });

  it("aynı UUID birden fazla geçerse her biri ayrı parça olur", () => {
    const r = mentionParcala(`@${UUID_A} ve @${UUID_A}`, kisiMap);
    const mentionlar = r.filter((p) => p.tip === "mention");
    expect(mentionlar).toHaveLength(2);
  });
});

describe("mention format yardımcıları", () => {
  it("metindeki mention UUID'lerini tekilleştirir", () => {
    expect(mentionIdleriniCikar(`@${UUID_A} @${UUID_A} @${UUID_B}`)).toEqual([
      UUID_A,
      UUID_B,
    ]);
  });

  it("UUID mention'ları kullanıcı adına çevirir", () => {
    const metin = mentionlariGorunenMetneCevir(
      `Selam @${UUID_A}, @99999999-9999-9999-9999-999999999999`,
      kisiMap,
    );
    expect(metin).toBe("Selam @Ahmet Yılmaz, @kullanıcı");
  });

  it("düzenleme metninde UUID'leri ada çevirir ve geri çözüm map'i üretir", () => {
    const sonuc = mentionlariDuzenlemeMetnineCevir(
      `Selam @${UUID_A}, @${UUID_B}`,
      kisiMap,
    );
    expect(sonuc.metin).toBe("Selam @Ahmet Yılmaz, @Zeynep Kaya");
    expect(sonuc.cozumlemeMapi.get("Ahmet Yılmaz")).toBe(UUID_A);
    expect(sonuc.cozumlemeMapi.get("Zeynep Kaya")).toBe(UUID_B);
  });

  it("aynı ada sahip farklı kullanıcıları ID göstermeden ayırır", () => {
    const ikinciUuid = "00000000-0000-0000-0000-000000000003";
    const map: KisiMap = new Map([
      [UUID_A, { ad: "Ali", soyad: "Veli" }],
      [ikinciUuid, { ad: "Ali", soyad: "Veli" }],
    ]);
    const sonuc = mentionlariDuzenlemeMetnineCevir(
      `@${UUID_A} @${ikinciUuid}`,
      map,
    );
    expect(sonuc.metin).toBe("@Ali Veli @Ali Veli 2");
    expect(sonuc.cozumlemeMapi.get("Ali Veli")).toBe(UUID_A);
    expect(sonuc.cozumlemeMapi.get("Ali Veli 2")).toBe(ikinciUuid);
  });
});
