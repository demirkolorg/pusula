import { describe, it, expect } from "vitest";
import {
  tiptapDokumanSemasi,
  TIPTAP_MAX_DERINLIK,
  TIPTAP_MAX_DUGUM,
} from "./schema";

describe("tiptapDokumanSemasi", () => {
  it("basit dokumani kabul eder", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
      ],
    };
    expect(tiptapDokumanSemasi.safeParse(doc).success).toBe(true);
  });

  it("kok type 'doc' degilse reddeder", () => {
    const doc = { type: "paragraph", content: [] };
    expect(tiptapDokumanSemasi.safeParse(doc).success).toBe(false);
  });

  it("desteklenmeyen dugum tipini reddeder", () => {
    const doc = {
      type: "doc",
      content: [{ type: "table", content: [] }],
    };
    expect(tiptapDokumanSemasi.safeParse(doc).success).toBe(false);
  });

  it("zenginlestirilmis tum desteklenen dugumleri kabul eder", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "H1" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "H2" }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "H3" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Bold metin", marks: [{ type: "bold" }] },
            { type: "text", text: " ve italik", marks: [{ type: "italic" }] },
            { type: "hardBreak" },
            {
              type: "mention",
              attrs: { id: "00000000-0000-0000-0000-000000000001", label: "Ali" },
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "X" }] },
              ],
            },
          ],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Y" }] },
              ],
            },
          ],
        },
      ],
    };
    expect(tiptapDokumanSemasi.safeParse(doc).success).toBe(true);
  });

  it("link mark'ini kabul eder", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "tikla",
              marks: [{ type: "link", attrs: { href: "https://x" } }],
            },
          ],
        },
      ],
    };
    expect(tiptapDokumanSemasi.safeParse(doc).success).toBe(true);
  });

  it("max dugum sayisini asan dokumani reddeder (DoS koruma)", () => {
    const cocuklar = Array.from({ length: TIPTAP_MAX_DUGUM + 1 }, () => ({
      type: "paragraph" as const,
    }));
    const doc = { type: "doc", content: cocuklar };
    expect(tiptapDokumanSemasi.safeParse(doc).success).toBe(false);
  });

  it("max derinligi asan dokumani reddeder", () => {
    function ucuzla(seviye: number): {
      type: string;
      content?: ReturnType<typeof ucuzla>[];
    } {
      if (seviye <= 0) return { type: "paragraph" };
      return { type: "bulletList", content: [{ type: "listItem", content: [ucuzla(seviye - 1)] }] };
    }
    const derinDoc = {
      type: "doc",
      content: [ucuzla(TIPTAP_MAX_DERINLIK + 5)],
    };
    expect(tiptapDokumanSemasi.safeParse(derinDoc).success).toBe(false);
  });

  it("bos doc'u (paragraph yok) kabul eder", () => {
    expect(tiptapDokumanSemasi.safeParse({ type: "doc" }).success).toBe(true);
  });
});
