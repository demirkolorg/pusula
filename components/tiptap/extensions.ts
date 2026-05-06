import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

// ADR-0023 — Tiptap editor extension seti.
//
// Toolbar paritesi (kullanıcı onaylı MVP):
//   • inline marks: bold, italic, strike, code
//   • blocks: paragraph, heading (1-3), bullet list, ordered list
//   • inserts: link (popover), hard break (Shift+Enter)
//
// MVP dışı (Faz 2):
//   • mention — Yorum sistemiyle birlikte tek bir mention extension'ı kurulur
//   • table, image, embed
//   • slash command menüsü
//
// `linkOnPaste` + `openOnClick: false` Linear/Trello davranışı: URL yapıştırınca
// otomatik link, üstüne tıklayınca açılmaz (düzenleme modunda).

export type TiptapExtensionSecenekleri = {
  placeholder?: string;
};

export function tiptapExtensionleri(secenekler: TiptapExtensionSecenekleri = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Code block çıkarıldı — inline code marks yeterli, MVP'de blok kod yok.
      codeBlock: false,
      // Horizontal rule de fazla — kart açıklamasında nadir.
      horizontalRule: false,
      // Blockquote da MVP dışı.
      blockquote: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      protocols: ["http", "https", "mailto", "tel"],
      HTMLAttributes: {
        class: "text-primary underline underline-offset-2",
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      },
    }),
    Placeholder.configure({
      placeholder: secenekler.placeholder ?? "Detay ekle, bağlam paylaş, link yapıştır…",
      // Sadece doc tamamen boşsa göster (paragraflarda gizleme).
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }),
  ];
}
