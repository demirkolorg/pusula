import { describe, it, expect } from "vitest";
import {
  bosTiptapDokuman,
  metinTiptapDokumana,
  tiptapDokumaniBosMu,
  tiptapDokumaniMetne,
} from "./serialize";
import type { TiptapDokuman } from "./schema";

describe("bosTiptapDokuman", () => {
  it("tek bos paragrafli dokuman uretir", () => {
    expect(bosTiptapDokuman()).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });
});

describe("metinTiptapDokumana", () => {
  it("bos string icin bos dokuman dondurur", () => {
    expect(metinTiptapDokumana("")).toEqual(bosTiptapDokuman());
    expect(metinTiptapDokumana("   ")).toEqual(bosTiptapDokuman());
  });

  it("tek satir metni tek paragraflik doc'a sarar", () => {
    expect(metinTiptapDokumana("Merhaba")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Merhaba" }],
        },
      ],
    });
  });

  it("cift bos satir paragraf ayiricidir", () => {
    const doc = metinTiptapDokumana("Birinci\n\nIkinci");
    expect(doc.content).toHaveLength(2);
    expect(doc.content?.[0]?.type).toBe("paragraph");
    expect(doc.content?.[1]?.type).toBe("paragraph");
  });

  it("tek satir sonu hardBreak olur", () => {
    const doc = metinTiptapDokumana("Birinci\nIkinci");
    expect(doc.content).toHaveLength(1);
    const paragraf = doc.content?.[0];
    expect(paragraf?.type).toBe("paragraph");
    expect(paragraf?.content).toEqual([
      { type: "text", text: "Birinci" },
      { type: "hardBreak" },
      { type: "text", text: "Ikinci" },
    ]);
  });
});

describe("tiptapDokumaniMetne", () => {
  it("null ve bos doc icin bos string dondurur", () => {
    expect(tiptapDokumaniMetne(null)).toBe("");
    expect(tiptapDokumaniMetne(undefined)).toBe("");
    expect(tiptapDokumaniMetne(bosTiptapDokuman())).toBe("");
  });

  it("paragraflar arasi bos satir koyar", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Bir" }] },
        { type: "paragraph", content: [{ type: "text", text: "Iki" }] },
      ],
    };
    expect(tiptapDokumaniMetne(doc)).toBe("Bir\n\nIki");
  });

  it("hardBreak satir sonuna donusur", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "A" },
            { type: "hardBreak" },
            { type: "text", text: "B" },
          ],
        },
      ],
    };
    expect(tiptapDokumaniMetne(doc)).toBe("A\nB");
  });

  it("mention nodu @label seklinde basar", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Selam " },
            {
              type: "mention",
              attrs: { id: "00000000-0000-0000-0000-000000000001", label: "Ahmet Yilmaz" },
            },
          ],
        },
      ],
    };
    expect(tiptapDokumaniMetne(doc)).toBe("Selam @Ahmet Yilmaz");
  });

  it("bullet list maddelerini bullet onekiyle yazar", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Madde A" }] },
              ],
            },
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Madde B" }] },
              ],
            },
          ],
        },
      ],
    };
    expect(tiptapDokumaniMetne(doc)).toBe("• Madde A\n• Madde B");
  });

  it("ordered list 1. 2. seklinde numaralar", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Bir" }] },
              ],
            },
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Iki" }] },
              ],
            },
          ],
        },
      ],
    };
    expect(tiptapDokumaniMetne(doc)).toBe("1. Bir\n2. Iki");
  });

  it("heading metni paragraf gibi basar", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Baslik" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "Govde" }] },
      ],
    };
    expect(tiptapDokumaniMetne(doc)).toBe("Baslik\n\nGovde");
  });
});

describe("tiptapDokumaniBosMu", () => {
  it("null ve bos doc bos sayilir", () => {
    expect(tiptapDokumaniBosMu(null)).toBe(true);
    expect(tiptapDokumaniBosMu(undefined)).toBe(true);
    expect(tiptapDokumaniBosMu(bosTiptapDokuman())).toBe(true);
  });

  it("dolu doc bos sayilmaz", () => {
    expect(tiptapDokumaniBosMu(metinTiptapDokumana("X"))).toBe(false);
  });
});

describe("metinTiptapDokumana ↔ tiptapDokumaniMetne roundtrip", () => {
  it("tek satir metni roundtrip korur", () => {
    const orijinal = "Tek satir metin";
    expect(tiptapDokumaniMetne(metinTiptapDokumana(orijinal))).toBe(orijinal);
  });

  it("cok paragrafli metni roundtrip korur", () => {
    const orijinal = "Birinci paragraf\n\nIkinci paragraf";
    expect(tiptapDokumaniMetne(metinTiptapDokumana(orijinal))).toBe(orijinal);
  });

  it("hardBreakli metni roundtrip korur", () => {
    const orijinal = "Bir satir\nDevam";
    expect(tiptapDokumaniMetne(metinTiptapDokumana(orijinal))).toBe(orijinal);
  });
});
