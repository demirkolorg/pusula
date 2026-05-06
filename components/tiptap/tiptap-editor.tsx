"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { TiptapDokuman } from "@/lib/tiptap";
import { bosTiptapDokuman } from "@/lib/tiptap";
import { cn } from "@/lib/utils";
import { tiptapExtensionleri } from "./extensions";
import { TiptapToolbar } from "./tiptap-toolbar";

// ADR-0023 — Pusula Tiptap editör bileşeni.
//
// API:
//   <TiptapEditor
//     deger={kart.aciklama_dokuman}     // Tiptap doc veya null
//     onDegisim={(yeni) => ...}         // edit'te tetiklenir (debounce DIŞARI)
//     onTeslimEt={() => kaydet()}       // blur veya Ctrl+Enter
//     placeholder="..."
//     yetkili                           // false → read-only
//   />
//
// Tasarım kararları:
//   • Edit/save kontrolü dış (Kart-modal-aciklama debounce yapacak)
//   • Editor instance'ı `useEditor` ile mount'ta tek kez kurulur (Tiptap'ın
//     `content` parametresi de tek seferlik baseline; sonradan
//     `editor.commands.setContent(...)` ile sync edilir — yalnız harici
//     veri farkı varsa, döngü olmasın diye `transaction.docChanged` filtresi)
//   • SSR-safe: `useEditor`'ün `immediatelyRender: false` Next.js 16 + React
//     19 default davranışına göre kurulur

type Props = {
  deger: TiptapDokuman | null;
  onDegisim: (yeni: TiptapDokuman) => void;
  onTeslimEt?: () => void;
  placeholder?: string;
  yetkili?: boolean;
  // Test/mobil için boy ayarı.
  className?: string;
};

export function TiptapEditor({
  deger,
  onDegisim,
  onTeslimEt,
  placeholder,
  yetkili = true,
  className,
}: Props) {
  const editor = useEditor(
    {
      // Next.js 16 hydration uyumu: SSR'da render etme, client'ta mount sonrası kur.
      immediatelyRender: false,
      extensions: tiptapExtensionleri({ placeholder }),
      content: deger ?? bosTiptapDokuman(),
      editable: yetkili,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
            "min-h-32 px-3 py-2 leading-[1.65] text-[14px]",
            "[&_p]:my-1 [&_h1]:mt-3 [&_h1]:text-lg [&_h2]:mt-3 [&_h2]:text-base [&_h3]:mt-2 [&_h3]:text-sm",
            "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
          ),
        },
      },
      onUpdate: ({ editor: e }) => {
        // ProseMirror `Doc` JSON'unu TiptapDokuman olarak geri ver.
        onDegisim(e.getJSON() as TiptapDokuman);
      },
      onBlur: () => {
        onTeslimEt?.();
      },
    },
    // useEditor bağımlılıkları — `yetkili` dışarıdan değişirse re-init.
    [yetkili],
  );

  // Harici `deger` değiştiğinde editor içeriğini senkronize et — örn.
  // realtime başka kullanıcıdan gelen güncelleme. Editor içinde aynı doc'u
  // tekrar set etmemek için JSON karşılaştır (Tiptap recursive equal yok).
  React.useEffect(() => {
    if (!editor) return;
    const editorJson = editor.getJSON();
    const harici = deger ?? bosTiptapDokuman();
    // Hızlı string karşılaştırma — referans karşılaştırma yetmez, set'leme
    // lokal edit'i ezerse caret atlar. Aynı içerikte güncelleme tetikleme.
    if (JSON.stringify(editorJson) !== JSON.stringify(harici)) {
      editor.commands.setContent(harici, { emitUpdate: false });
    }
  }, [deger, editor]);

  // Klavye kısayolu — Ctrl+Enter / ⌘+Enter ile teslim et.
  React.useEffect(() => {
    if (!editor) return;
    const eleman = editor.view.dom;
    const dinleyici = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onTeslimEt?.();
      }
    };
    eleman.addEventListener("keydown", dinleyici);
    return () => eleman.removeEventListener("keydown", dinleyici);
  }, [editor, onTeslimEt]);

  if (!editor) {
    // SSR ve mount-öncesi durum: textarea benzeri görsel boşluk.
    return (
      <div
        className={cn(
          "border-input min-h-32 rounded-md border bg-transparent px-3 py-2",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "border-input bg-background overflow-hidden rounded-md border",
        "focus-within:ring-ring focus-within:ring-[3px] focus-within:ring-offset-0",
        className,
      )}
    >
      {yetkili && <TiptapToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
