import type { TiptapDokuman } from "./schema";

// ADR-0023 — Tiptap mention node yardımcıları (server-side).
//
// Tiptap mention attribute yapısı:
//   { type: "mention", attrs: { id: "uuid", label: "Ad Soyad" } }
//
// Bu modül server-side bildirim üretiminde kullanılır — yorum mention sistemiyle
// (lib/mention-format.ts) aynı sözleşmeye sahiptir: UUID v4, set döner.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MentionDugumu = {
  type: string;
  attrs?: { id?: unknown };
  content?: MentionDugumu[];
};

function dugumdenIdToplaSet(dugum: MentionDugumu, hedef: Set<string>): void {
  if (dugum.type === "mention") {
    const ham = dugum.attrs?.id;
    if (typeof ham === "string" && UUID_REGEX.test(ham)) {
      hedef.add(ham.toLowerCase());
    }
  }
  if (dugum.content) {
    for (const cocuk of dugum.content) dugumdenIdToplaSet(cocuk, hedef);
  }
}

export function tiptapMentionIdleriniCikar(
  doc: TiptapDokuman | null | undefined,
): string[] {
  if (!doc || !doc.content) return [];
  const sonuc = new Set<string>();
  for (const blok of doc.content) {
    dugumdenIdToplaSet(blok as MentionDugumu, sonuc);
  }
  return Array.from(sonuc);
}
