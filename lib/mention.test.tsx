import { describe, it, expect } from "vitest";
import { mentionParcala, type UyeMap } from "./mention";

const UUID_A = "00000000-0000-0000-0000-000000000001";
const UUID_B = "00000000-0000-0000-0000-000000000002";

const uyeMap: UyeMap = new Map([
  [UUID_A, { ad: "Ahmet", soyad: "Yılmaz" }],
  [UUID_B, { ad: "Zeynep", soyad: "Kaya" }],
]);

describe("mentionParcala", () => {
  it("metin içindeki UUID mention'ları parça parça döner", () => {
    const r = mentionParcala(`Selam @${UUID_A}, sana @${UUID_B} sordum.`, uyeMap);
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
      uyeMap,
    );
    expect(r[1]).toMatchObject({
      tip: "mention",
      ad: null,
    });
  });

  it("hiç mention yoksa tek metin parçası", () => {
    const r = mentionParcala("Düz metin", uyeMap);
    expect(r).toEqual([{ tip: "metin", deger: "Düz metin" }]);
  });

  it("UUID dışı @ ler atlanır", () => {
    const r = mentionParcala("Ahmet @beyefendi merhaba", uyeMap);
    expect(r).toEqual([{ tip: "metin", deger: "Ahmet @beyefendi merhaba" }]);
  });

  it("aynı UUID birden fazla geçerse her biri ayrı parça olur", () => {
    const r = mentionParcala(`@${UUID_A} ve @${UUID_A}`, uyeMap);
    const mentionlar = r.filter((p) => p.tip === "mention");
    expect(mentionlar).toHaveLength(2);
  });
});
