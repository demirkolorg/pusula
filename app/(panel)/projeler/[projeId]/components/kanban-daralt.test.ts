import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  daraltilmisListeleriOku,
  daraltilmisListeleriYaz,
  daraltStorageKey,
  gecerliListelereKirp,
  listeDaralt,
  listeDaraltToggle,
  listeGenislet,
  setlerEsit,
  tumDaralt,
  tumGenislet,
} from "./kanban-daralt";

const PROJE = "p1";
const ANAHTAR = `pusula:liste-daralt:${PROJE}`;

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("daraltStorageKey", () => {
  it("projeId ile prefix birleştirir", () => {
    expect(daraltStorageKey("p1")).toBe("pusula:liste-daralt:p1");
    expect(daraltStorageKey("uuid-abc")).toBe("pusula:liste-daralt:uuid-abc");
  });
});

describe("listeDaraltToggle", () => {
  it("boş set'te id ekler", () => {
    const sonuc = listeDaraltToggle(new Set(), "l1");
    expect(sonuc).toEqual(new Set(["l1"]));
  });

  it("var olan id'yi siler", () => {
    const sonuc = listeDaraltToggle(new Set(["l1", "l2"]), "l1");
    expect(sonuc).toEqual(new Set(["l2"]));
  });

  it("orijinal set'i mutate etmez (immutable)", () => {
    const orj = new Set(["l1"]);
    listeDaraltToggle(orj, "l2");
    expect(orj).toEqual(new Set(["l1"]));
  });
});

describe("listeDaralt / listeGenislet", () => {
  it("listeDaralt mevcut id ekler, var olanı tekrar eklemez", () => {
    expect(listeDaralt(new Set(), "l1")).toEqual(new Set(["l1"]));
    expect(listeDaralt(new Set(["l1"]), "l1")).toEqual(new Set(["l1"]));
  });

  it("listeGenislet mevcut id'yi siler, olmayan için no-op", () => {
    expect(listeGenislet(new Set(["l1", "l2"]), "l1")).toEqual(new Set(["l2"]));
    expect(listeGenislet(new Set(["l1"]), "yok")).toEqual(new Set(["l1"]));
  });

  it("orijinal set'i mutate etmez", () => {
    const orj = new Set(["l1"]);
    listeDaralt(orj, "l2");
    listeGenislet(orj, "l1");
    expect(orj).toEqual(new Set(["l1"]));
  });
});

describe("daraltilmisListeleriOku", () => {
  it("boş key'de boş set döner", () => {
    expect(daraltilmisListeleriOku("yok")).toEqual(new Set());
  });

  it("yazılmış değeri okur", () => {
    window.localStorage.setItem(ANAHTAR, JSON.stringify(["l1", "l2"]));
    expect(daraltilmisListeleriOku(PROJE)).toEqual(new Set(["l1", "l2"]));
  });

  it("corrupted JSON'da boş set döner ve key'i siler", () => {
    window.localStorage.setItem(ANAHTAR, "{not json");
    expect(daraltilmisListeleriOku(PROJE)).toEqual(new Set());
    expect(window.localStorage.getItem(ANAHTAR)).toBeNull();
  });

  it("array değil obje için boş set + key silinir", () => {
    window.localStorage.setItem(ANAHTAR, '{"a":1}');
    expect(daraltilmisListeleriOku(PROJE)).toEqual(new Set());
    expect(window.localStorage.getItem(ANAHTAR)).toBeNull();
  });

  it("string olmayan elemanlar filtrelenir", () => {
    window.localStorage.setItem(
      ANAHTAR,
      JSON.stringify(["l1", 42, null, "l2", { a: 1 }]),
    );
    expect(daraltilmisListeleriOku(PROJE)).toEqual(new Set(["l1", "l2"]));
  });

  it("boş array için boş set döner", () => {
    window.localStorage.setItem(ANAHTAR, "[]");
    expect(daraltilmisListeleriOku(PROJE)).toEqual(new Set());
  });
});

describe("daraltilmisListeleriYaz", () => {
  it("boş set key'i siler", () => {
    window.localStorage.setItem(ANAHTAR, JSON.stringify(["l1"]));
    daraltilmisListeleriYaz(PROJE, new Set());
    expect(window.localStorage.getItem(ANAHTAR)).toBeNull();
  });

  it("dolu set yazar", () => {
    daraltilmisListeleriYaz(PROJE, new Set(["l1", "l2"]));
    const okunan = JSON.parse(window.localStorage.getItem(ANAHTAR) ?? "[]");
    expect(new Set(okunan)).toEqual(new Set(["l1", "l2"]));
  });

  it("yazıp tekrar okuma round-trip tutarlı", () => {
    const orj = new Set(["a", "b", "c"]);
    daraltilmisListeleriYaz(PROJE, orj);
    expect(daraltilmisListeleriOku(PROJE)).toEqual(orj);
  });
});

describe("setlerEsit", () => {
  it("aynı referans eşit", () => {
    const s = new Set(["a"]);
    expect(setlerEsit(s, s)).toBe(true);
  });

  it("aynı içerik farklı sırayla eşit", () => {
    expect(setlerEsit(new Set(["a", "b"]), new Set(["b", "a"]))).toBe(true);
  });

  it("farklı boyut eşit değil", () => {
    expect(setlerEsit(new Set(["a"]), new Set(["a", "b"]))).toBe(false);
  });

  it("aynı boyut farklı içerik eşit değil", () => {
    expect(setlerEsit(new Set(["a"]), new Set(["b"]))).toBe(false);
  });

  it("ikisi de boş eşit", () => {
    expect(setlerEsit(new Set(), new Set())).toBe(true);
  });
});

describe("tumDaralt", () => {
  it("boş set'e id listesi ekler", () => {
    expect(tumDaralt(new Set(), ["l1", "l2", "l3"])).toEqual(
      new Set(["l1", "l2", "l3"]),
    );
  });

  it("var olan id'leri korur, yeni eklenenler birleşir", () => {
    expect(tumDaralt(new Set(["l1"]), ["l2", "l3"])).toEqual(
      new Set(["l1", "l2", "l3"]),
    );
  });

  it("zaten daraltılmış id tekrar eklenmez (Set semantiği)", () => {
    expect(tumDaralt(new Set(["l1", "l2"]), ["l1", "l3"])).toEqual(
      new Set(["l1", "l2", "l3"]),
    );
  });

  it("boş id listesi orijinal içeriği değiştirmez", () => {
    expect(tumDaralt(new Set(["l1"]), [])).toEqual(new Set(["l1"]));
  });

  it("orijinal set'i mutate etmez", () => {
    const orj = new Set(["l1"]);
    tumDaralt(orj, ["l2"]);
    expect(orj).toEqual(new Set(["l1"]));
  });
});

describe("tumGenislet", () => {
  it("verilen id'leri set'ten çıkarır", () => {
    expect(tumGenislet(new Set(["l1", "l2", "l3"]), ["l1", "l2"])).toEqual(
      new Set(["l3"]),
    );
  });

  it("set'te olmayan id'ler için no-op", () => {
    expect(tumGenislet(new Set(["l1"]), ["yok1", "yok2"])).toEqual(
      new Set(["l1"]),
    );
  });

  it("hepsi çıkarılırsa boş set", () => {
    expect(tumGenislet(new Set(["l1", "l2"]), ["l1", "l2"])).toEqual(new Set());
  });

  it("orijinal set'i mutate etmez", () => {
    const orj = new Set(["l1", "l2"]);
    tumGenislet(orj, ["l1"]);
    expect(orj).toEqual(new Set(["l1", "l2"]));
  });
});

describe("gecerliListelereKirp", () => {
  it("geçersiz id'leri çıkarır", () => {
    const sonuc = gecerliListelereKirp(
      new Set(["l1", "l2", "silinmis"]),
      new Set(["l1", "l2"]),
    );
    expect(sonuc).toEqual(new Set(["l1", "l2"]));
  });

  it("hepsi geçerliyse aynı içerik döner", () => {
    expect(
      gecerliListelereKirp(new Set(["l1", "l2"]), new Set(["l1", "l2", "l3"])),
    ).toEqual(new Set(["l1", "l2"]));
  });

  it("hiçbiri geçerli değilse boş set", () => {
    expect(
      gecerliListelereKirp(new Set(["l1", "l2"]), new Set(["x"])),
    ).toEqual(new Set());
  });

  it("orijinali mutate etmez", () => {
    const orj = new Set(["l1", "silinmis"]);
    gecerliListelereKirp(orj, new Set(["l1"]));
    expect(orj).toEqual(new Set(["l1", "silinmis"]));
  });
});
