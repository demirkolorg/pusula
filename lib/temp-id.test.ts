import { describe, it, expect } from "vitest";
import { tempId, tempIdMi } from "./temp-id";

describe("tempId", () => {
  it("'temp-' on ekiyle baslar", () => {
    expect(tempId().startsWith("temp-")).toBe(true);
  });

  it("on ekten sonra 12 karakterli nanoid icerir (toplam 17 karakter)", () => {
    const id = tempId();
    // 'temp-' = 5 karakter + 12 nanoid = 17.
    expect(id.length).toBe(17);
  });

  it("ardisik cagrilarda essiz id'ler uretir", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      set.add(tempId());
    }
    expect(set.size).toBe(1000);
  });
});

describe("tempIdMi", () => {
  it("tempId() ciktisi icin true doner", () => {
    expect(tempIdMi(tempId())).toBe(true);
  });

  it("'temp-' ile baslayan herhangi bir string icin true doner", () => {
    expect(tempIdMi("temp-abc")).toBe(true);
    expect(tempIdMi("temp-")).toBe(true);
  });

  it("'temp-' ile baslamayan string icin false doner", () => {
    expect(tempIdMi("abc")).toBe(false);
    expect(tempIdMi("")).toBe(false);
    expect(tempIdMi("TEMP-XYZ")).toBe(false); // case sensitive
    expect(tempIdMi(" temp-x")).toBe(false); // bosluk onunde
  });

  it("null icin false doner", () => {
    expect(tempIdMi(null)).toBe(false);
  });

  it("undefined icin false doner", () => {
    expect(tempIdMi(undefined)).toBe(false);
  });

  it("string olmayan tipler icin false doner (runtime guvenlik)", () => {
    // typeof check'i sayesinde number/object da false donmeli.
    // @ts-expect-error: bilincli olarak yanlis tip veriyoruz
    expect(tempIdMi(123)).toBe(false);
    // @ts-expect-error: object tipinin runtime'da reddedildigini test ediyoruz
    expect(tempIdMi({})).toBe(false);
  });
});
