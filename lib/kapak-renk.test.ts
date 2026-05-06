import { describe, expect, it } from "vitest";
import { kapakKutusuSiniflari } from "./kapak-renk";

describe("kapakKutusuSiniflari", () => {
  it("sistem rengi için bg + foreground birlikte döner", () => {
    expect(kapakKutusuSiniflari("primary")).toBe(
      "bg-primary text-primary-foreground",
    );
    expect(kapakKutusuSiniflari("secondary")).toBe(
      "bg-secondary text-secondary-foreground",
    );
    expect(kapakKutusuSiniflari("tertiary")).toBe(
      "bg-tertiary text-tertiary-foreground",
    );
  });

  it("palet rengi için bg-palet + foreground döner", () => {
    expect(kapakKutusuSiniflari("kirmizi")).toBe(
      "bg-palet-kirmizi text-palet-kirmizi-foreground",
    );
    expect(kapakKutusuSiniflari("turuncu")).toBe(
      "bg-palet-turuncu text-palet-turuncu-foreground",
    );
    expect(kapakKutusuSiniflari("lacivert")).toBe(
      "bg-palet-lacivert text-palet-lacivert-foreground",
    );
  });

  it("null/undefined için varsayılan fallback döner", () => {
    expect(kapakKutusuSiniflari(null)).toBe("bg-muted text-muted-foreground");
    expect(kapakKutusuSiniflari(undefined)).toBe(
      "bg-muted text-muted-foreground",
    );
  });

  it("boş string için fallback döner", () => {
    expect(kapakKutusuSiniflari("")).toBe("bg-muted text-muted-foreground");
  });

  it("geçersiz token için fallback döner", () => {
    expect(kapakKutusuSiniflari("yok-boyle-renk")).toBe(
      "bg-muted text-muted-foreground",
    );
  });

  it("özel fallback parametresi kullanır", () => {
    expect(kapakKutusuSiniflari(null, "bg-card")).toBe("bg-card");
    expect(kapakKutusuSiniflari("gecersiz", "bg-card text-card-foreground")).toBe(
      "bg-card text-card-foreground",
    );
  });

  it("geçerli token verildiğinde fallback'i yok sayar", () => {
    expect(kapakKutusuSiniflari("primary", "bg-card")).toBe(
      "bg-primary text-primary-foreground",
    );
  });
});
