import { describe, it, expect } from "vitest";
import { tiptapMentionIdleriniCikar } from "./mention";
import type { TiptapDokuman } from "./schema";

const UUID_A = "00000000-0000-0000-0000-000000000001";
const UUID_B = "00000000-0000-0000-0000-000000000002";

describe("tiptapMentionIdleriniCikar", () => {
  it("null/undefined doc icin bos dizi dondurur", () => {
    expect(tiptapMentionIdleriniCikar(null)).toEqual([]);
    expect(tiptapMentionIdleriniCikar(undefined)).toEqual([]);
  });

  it("mention'siz doc'tan bos dizi dondurur", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Salt metin" }] },
      ],
    };
    expect(tiptapMentionIdleriniCikar(doc)).toEqual([]);
  });

  it("paragrafta gecen mention id'sini bulur", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Selam " },
            { type: "mention", attrs: { id: UUID_A, label: "Ahmet" } },
          ],
        },
      ],
    };
    expect(tiptapMentionIdleriniCikar(doc)).toEqual([UUID_A]);
  });

  it("ic ice gomulu mention'i (listItem icindeki paragraf) bulur", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "mention", attrs: { id: UUID_A, label: "Ahmet" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(tiptapMentionIdleriniCikar(doc)).toEqual([UUID_A]);
  });

  it("ayni mention birden cok kez gectiginde set'leyip bir kez dondurur", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "mention", attrs: { id: UUID_A, label: "Ahmet" } },
            { type: "text", text: " ve " },
            { type: "mention", attrs: { id: UUID_A, label: "Ahmet" } },
          ],
        },
      ],
    };
    expect(tiptapMentionIdleriniCikar(doc)).toEqual([UUID_A]);
  });

  it("birden fazla farkli mention'i sirayla dondurur", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "mention", attrs: { id: UUID_A, label: "Ahmet" } },
            { type: "text", text: " " },
            { type: "mention", attrs: { id: UUID_B, label: "Mehmet" } },
          ],
        },
      ],
    };
    const sonuc = tiptapMentionIdleriniCikar(doc);
    expect(sonuc).toHaveLength(2);
    expect(sonuc).toContain(UUID_A);
    expect(sonuc).toContain(UUID_B);
  });

  it("gecersiz id'li mention nodunu yoksayar", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "mention", attrs: { id: "gecersiz-uuid-degil", label: "X" } },
            { type: "mention", attrs: { id: UUID_A, label: "Ahmet" } },
          ],
        },
      ],
    };
    expect(tiptapMentionIdleriniCikar(doc)).toEqual([UUID_A]);
  });

  it("buyuk harfli uuid'yi normalize eder", () => {
    const doc: TiptapDokuman = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "mention", attrs: { id: UUID_A.toUpperCase(), label: "Ahmet" } },
          ],
        },
      ],
    };
    expect(tiptapMentionIdleriniCikar(doc)).toEqual([UUID_A]);
  });
});
