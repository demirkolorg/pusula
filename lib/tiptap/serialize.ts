import type { TiptapDokuman } from "./schema";

// ADR-0023 — Tiptap doküman ↔ düz metin dönüşümleri.
//
// • bosTiptapDokuman()        → tek paragraflı boş doküman (UI ilk durum).
// • metinTiptapDokumana(s)    → düz metni Tiptap doc'a sarar (seed/migrasyon).
// • tiptapDokumaniMetne(d)    → plaintext türetir — `aciklama_metin` denormalize
//                                kolonu, audit diff, tsvector trigger okur.
// • tiptapDokumaniBosMu(d)    → "boş açıklama" karşılaştırması; sırf <p></p>
//                                içeren doc'u null gibi sayar.

export function bosTiptapDokuman(): TiptapDokuman {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function metinTiptapDokumana(metin: string): TiptapDokuman {
  const trimli = metin.trim();
  if (!trimli) return bosTiptapDokuman();

  // Boş satırları paragraf ayırıcı, satır sonlarını hardBreak yap.
  const paragraflar = trimli
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    type: "doc",
    content: paragraflar.map((p) => {
      const satirlar = p.split("\n");
      const icerik: Array<{
        type: "text" | "hardBreak";
        text?: string;
      }> = [];
      satirlar.forEach((satir, idx) => {
        if (idx > 0) icerik.push({ type: "hardBreak" });
        if (satir.length > 0) icerik.push({ type: "text", text: satir });
      });
      return { type: "paragraph", content: icerik.length > 0 ? icerik : undefined };
    }),
  };
}

type Dugum = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: Dugum[];
};

function dugumuMetneCevir(dugum: Dugum): string {
  if (dugum.type === "text") return dugum.text ?? "";
  if (dugum.type === "hardBreak") return "\n";
  if (dugum.type === "mention") {
    const label = typeof dugum.attrs?.label === "string" ? dugum.attrs.label : null;
    const id = typeof dugum.attrs?.id === "string" ? dugum.attrs.id : null;
    return label ? `@${label}` : id ? `@${id}` : "";
  }
  // Liste maddeleri: her madde bir satır + "• " önek (bullet) ya da "1. "
  // (ordered) — plaintext aramada/önizlemede anlamlı kalsın.
  const cocuk = (dugum.content ?? []).map(dugumuMetneCevir).join("");
  return cocuk;
}

function bullettleListMaddeleri(
  liste: Dugum,
  baslangic: number,
  numarali: boolean,
): string {
  const maddeler = (liste.content ?? []).filter((c) => c.type === "listItem");
  return maddeler
    .map((m, i) => {
      const onek = numarali ? `${baslangic + i}. ` : "• ";
      return onek + dugumuMetneCevir(m).trim();
    })
    .join("\n");
}

export function tiptapDokumaniMetne(doc: TiptapDokuman | null | undefined): string {
  if (!doc || !doc.content) return "";
  const parcalar: string[] = [];
  for (const blok of doc.content) {
    const tip = blok.type;
    if (tip === "paragraph" || tip === "heading") {
      parcalar.push(dugumuMetneCevir(blok as Dugum));
    } else if (tip === "bulletList") {
      parcalar.push(bullettleListMaddeleri(blok as Dugum, 1, false));
    } else if (tip === "orderedList") {
      const baslangic =
        typeof (blok as Dugum).attrs?.start === "number"
          ? ((blok as Dugum).attrs!.start as number)
          : 1;
      parcalar.push(bullettleListMaddeleri(blok as Dugum, baslangic, true));
    } else {
      parcalar.push(dugumuMetneCevir(blok as Dugum));
    }
  }
  return parcalar
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join("\n\n");
}

export function tiptapDokumaniBosMu(doc: TiptapDokuman | null | undefined): boolean {
  if (!doc) return true;
  return tiptapDokumaniMetne(doc).trim().length === 0;
}
