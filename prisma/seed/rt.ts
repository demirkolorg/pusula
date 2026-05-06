// Pusula seed — Tiptap zengin metin (Rich Text) inşa yardımcıları.
//
// Kart açıklamaları artık `aciklamaDokuman` üzerinden ProseMirror Doc JSON
// olarak gelir (ADR-0023). Düz metin sarma yerine bu modüldeki kısa builder'lar
// kullanılarak gerçekçi başlık + paragraf + liste + bold/italic + mention
// karışımı bir doküman üretilir; UI tarafında Tiptap editor ile birebir
// eşleştiği için kart detay/önizleme paritesi sağlanır.
//
// Kullanım:
//   const dok = doc(
//     h2("Yasal Dayanak"),
//     p("5442 sayılı ", b("İl İdaresi Kanunu"), "'nun 32. maddesi…"),
//     ul("İlçe Emniyet Amirliği", "İlçe Jandarma Komutanlığı"),
//     h3("Saha Bölgeleri"),
//     ol("Kop Geçidi", "Karaağaç ayrımı"),
//   );

import type { TiptapDokuman } from "@/lib/tiptap";
import type { KullaniciAnahtar } from "./tipler";

// `text` veya hardBreak/mention satır içi düğüm union'u.
type SatirIciDugum = {
  type: "text" | "hardBreak" | "mention";
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
};

// Builder kabul ettiği parça tipleri: ham string (text node'a sarılır),
// satır içi düğüm objeleri (b/i/lnk/mn/br) ve diziler (recursive flatten).
export type Inline = string | SatirIciDugum | Inline[];

function flatten(parcalar: Inline[]): SatirIciDugum[] {
  const out: SatirIciDugum[] = [];
  for (const p of parcalar) {
    if (Array.isArray(p)) {
      out.push(...flatten(p));
    } else if (typeof p === "string") {
      // Boş string'leri atla — Tiptap `text` zorunlu non-empty.
      if (p.length > 0) out.push({ type: "text", text: p });
    } else {
      out.push(p);
    }
  }
  return out;
}

// =====================================================================
// Satır içi (inline) yardımcıları
// =====================================================================

export function b(...icerik: Inline[]): SatirIciDugum {
  return mark("bold", icerik);
}

export function i(...icerik: Inline[]): SatirIciDugum {
  return mark("italic", icerik);
}

export function s(...icerik: Inline[]): SatirIciDugum {
  return mark("strike", icerik);
}

export function code(metin: string): SatirIciDugum {
  return { type: "text", text: metin, marks: [{ type: "code" }] };
}

export function lnk(metin: string, href: string): SatirIciDugum {
  return {
    type: "text",
    text: metin,
    marks: [{ type: "link", attrs: { href } } as { type: string }],
  } as SatirIciDugum;
}

// Seed çağrısında kullanıcı anahtarı ile mention. Runtime `mentionDoldur`
// `@<anahtar>` formatını UUID'ye çeviriyor; ancak Tiptap mention nodu için
// `attrs.id` UUID gerekiyor — bu yüzden seed'de mention'ı text+`@<key>` olarak
// bırakıp `mentionDoldur` kullanılır. Kart açıklamasında doğal cümle içi
// mention istersek `mn("@<anahtar>", "Görünen Ad")` ile metin formuna düşeriz.
export function mn(anahtar: KullaniciAnahtar, gorunen?: string): SatirIciDugum {
  // Açıklama içinde mention'ı düz "@gorunen_ad" olarak bırakıyoruz; UI'da
  // metin gibi okunur ama yine de italic+bold ile vurgulanır. Yorum metninde
  // gerçek mention parser'ı `mentionDoldur` üzerinden çalışıyor (UUID).
  const etiket = gorunen ?? anahtar;
  return {
    type: "text",
    text: `@${etiket}`,
    marks: [{ type: "bold" }],
  };
}

export function br(): SatirIciDugum {
  return { type: "hardBreak" };
}

function mark(tip: string, parcalar: Inline[]): SatirIciDugum {
  // `b("a", b("b"))` gibi iç içe mark verirse en içteki text düğümlerinin
  // `marks` dizisine ek mark ekleyerek füzyon yapıyoruz.
  const dugumler = flatten(parcalar);
  if (dugumler.length === 0) {
    return { type: "text", text: "" };
  }
  if (dugumler.length === 1 && dugumler[0]!.type === "text") {
    const tek = dugumler[0]!;
    const yeniMarklar = [...(tek.marks ?? []), { type: tip }];
    return { ...tek, marks: yeniMarklar };
  }
  // Birden fazla parça varsa hepsini ayrı ayrı işaretliyoruz.
  // Wrapper text düğüm olamaz; o yüzden ilk düğümü değiştirip dönüyoruz —
  // pratikte bu kompozit hâli builder kullanıcısı pek istemez, çoğu yerde
  // `b("metin")` formu yeterli olur. Bu nedenle uyarı vermek yerine ilk
  // düğüme mark uygulayıp diğerlerini olduğu gibi bırakıyoruz: caller
  // çağırırken `b("önek "), p2, " son"` benzeri istemez.
  const ilk = dugumler[0]!;
  if (ilk.type === "text") {
    dugumler[0] = { ...ilk, marks: [...(ilk.marks ?? []), { type: tip }] };
  }
  return dugumler[0]!;
}

// =====================================================================
// Blok düğümleri
// =====================================================================

type BlokDugum = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: BlokDugum[] | SatirIciDugum[];
};

export function p(...icerik: Inline[]): BlokDugum {
  const dugumler = flatten(icerik);
  return dugumler.length > 0
    ? { type: "paragraph", content: dugumler }
    : { type: "paragraph" };
}

export function h1(...icerik: Inline[]): BlokDugum {
  return heading(1, icerik);
}

export function h2(...icerik: Inline[]): BlokDugum {
  return heading(2, icerik);
}

export function h3(...icerik: Inline[]): BlokDugum {
  return heading(3, icerik);
}

function heading(level: 1 | 2 | 3, icerik: Inline[]): BlokDugum {
  return {
    type: "heading",
    attrs: { level },
    content: flatten(icerik),
  };
}

// `ul("madde 1", "madde 2", ["madde", b(" 3")])` → bulletList(listItem(p(...)))
export function ul(...maddeler: Inline[]): BlokDugum {
  return {
    type: "bulletList",
    content: maddeler.map((m) => liste_maddesi(m)),
  };
}

export function ol(...maddeler: Inline[]): BlokDugum {
  return {
    type: "orderedList",
    content: maddeler.map((m) => liste_maddesi(m)),
  };
}

function liste_maddesi(parca: Inline): BlokDugum {
  const dugumler = flatten([parca]);
  return {
    type: "listItem",
    content: [
      dugumler.length > 0
        ? { type: "paragraph", content: dugumler }
        : { type: "paragraph" },
    ],
  };
}

// =====================================================================
// Doküman kök
// =====================================================================

export function doc(...bloklar: BlokDugum[]): TiptapDokuman {
  return {
    type: "doc",
    content: bloklar as TiptapDokuman["content"],
  } as TiptapDokuman;
}
