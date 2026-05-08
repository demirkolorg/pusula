import { z } from "zod";

// ADR-0023 — Tiptap (ProseMirror) doküman tipleri.
//
// Saklama formatı:
//   { type: "doc", content: BlockNode[] }
//
// Desteklenen düğümler (MVP toolbar seti — kullanıcı onaylı):
//   • paragraph
//   • heading (level 1-3)
//   • bulletList, orderedList → listItem(paragraph...)
//   • text — marks: bold, italic, strike, code, link
//   • mention — { id: uuid, label: string }
//   • hardBreak
//
// Server-side bu şemayla validate edilir (kötü niyetli/şişkin payload
// reddedilsin diye). UI tarafında editor zaten bu şemaya göre üretir.

const KOK_DUGUM_TIPLERI = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
] as const;

const ICERIK_DUGUM_TIPLERI = [
  ...KOK_DUGUM_TIPLERI,
  "listItem",
  "text",
  "mention",
  "hardBreak",
] as const;

const MARK_TIPLERI = ["bold", "italic", "strike", "code", "link"] as const;

// DoS koruması — şişkin doküman reddedilsin (Kontrol Kural 49).
export const TIPTAP_MAX_DUGUM = 1000;
export const TIPTAP_MAX_DERINLIK = 10;
export const TIPTAP_MAX_METIN = 10_000; // tek text node uzunluğu — toplam değil

// `attrs` defensive preprocess: TipTap editor bazen attrs alanına
// function referansı koyuyor (Next.js 16 React Server Actions Function
// instance'larını serialize edebildiği için temizlenmiyor). Function
// geldiğinde boş objeye çevir — node'un geçerliliği etkilenmesin.
const attrsSemasi = z.preprocess(
  (val) => (typeof val === "function" ? {} : val),
  z.record(z.string(), z.unknown()).optional(),
);

const markSemasi = z.object({
  type: z.enum(MARK_TIPLERI),
  attrs: attrsSemasi,
});

// Recursive node schema — `z.lazy` ile (ProseMirror düğümleri kendini içerir).
type TiptapDugum = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapDugum[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

export const tiptapDugumSemasi: z.ZodType<TiptapDugum> = z.lazy(() =>
  z.object({
    type: z.enum(ICERIK_DUGUM_TIPLERI),
    attrs: attrsSemasi,
    content: z.array(tiptapDugumSemasi).optional(),
    text: z.string().max(TIPTAP_MAX_METIN).optional(),
    marks: z.array(markSemasi).optional(),
  }),
);

// Doküman kök şeması — `type: "doc"` zorunlu, content array.
const tiptapDokumanHamSemasi = z.object({
  type: z.literal("doc"),
  content: z.array(tiptapDugumSemasi).optional(),
});

// Refinement: maks düğüm sayısı + maks derinlik kontrolü.
function dugumSayVeDerinlikOlc(
  dugum: TiptapDugum,
  derinlik: number,
): { sayi: number; maxDerinlik: number } {
  let sayi = 1;
  let maxDerinlik = derinlik;
  if (dugum.content) {
    for (const cocuk of dugum.content) {
      const alt = dugumSayVeDerinlikOlc(cocuk, derinlik + 1);
      sayi += alt.sayi;
      if (alt.maxDerinlik > maxDerinlik) maxDerinlik = alt.maxDerinlik;
    }
  }
  return { sayi, maxDerinlik };
}

export const tiptapDokumanSemasi = tiptapDokumanHamSemasi.superRefine(
  (doc, ctx) => {
    const koklerToplam = (doc.content ?? []).reduce(
      (acc, c) => {
        const olcum = dugumSayVeDerinlikOlc(c, 1);
        return {
          sayi: acc.sayi + olcum.sayi,
          maxDerinlik: Math.max(acc.maxDerinlik, olcum.maxDerinlik),
        };
      },
      { sayi: 0, maxDerinlik: 0 },
    );
    if (koklerToplam.sayi > TIPTAP_MAX_DUGUM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Doküman çok büyük (max ${TIPTAP_MAX_DUGUM} düğüm).`,
      });
    }
    if (koklerToplam.maxDerinlik > TIPTAP_MAX_DERINLIK) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Doküman çok derin (max ${TIPTAP_MAX_DERINLIK} seviye).`,
      });
    }
  },
);

export type TiptapDokuman = z.infer<typeof tiptapDokumanSemasi>;
export type TiptapDugumTipi = (typeof ICERIK_DUGUM_TIPLERI)[number];
