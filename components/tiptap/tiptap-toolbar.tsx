"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  ListIcon,
  ListOrderedIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TiptapToolbarButon } from "./tiptap-toolbar-buton";
import { TiptapLinkPopover } from "./tiptap-link-popover";

// ADR-0023 — Tiptap editör toolbar'ı. Mobil 360px'te yatay scroll'a izin
// verir (whitespace-nowrap + overflow-x-auto). Buton grupları arasında
// shadcn Separator dikey çizgi.
//
// Kontrol Kural 11: hit target 44px+. Tek buton 36px içerik + container
// padding ile 44px etkin alan. Kural 17: 360/768/1440 viewport test.

type Props = {
  editor: Editor;
  // Editör read-only ise toolbar tamamen disable.
  devreDisi?: boolean;
};

export function TiptapToolbar({ editor, devreDisi }: Props) {
  // Editor state değiştiğinde butonların aktif/pasif durumunu yeniden
  // hesaplamak için zorunlu re-render. Tiptap editor.on('selectionUpdate'
  // | 'transaction') tarafından tetiklenir.
  const [, _yenile] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const tetikle = () => _yenile();
    editor.on("selectionUpdate", tetikle);
    editor.on("transaction", tetikle);
    return () => {
      editor.off("selectionUpdate", tetikle);
      editor.off("transaction", tetikle);
    };
  }, [editor]);

  return (
    <div
      role="toolbar"
      aria-label="Metin biçimlendirme"
      className="bg-background sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto whitespace-nowrap border-b px-1 py-1"
    >
      <TiptapToolbarButon
        ipucu="Kalın"
        kisayol="Ctrl+B"
        aktif={editor.isActive("bold")}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleBold().run()}
        cocuk={<BoldIcon className="size-4" />}
      />
      <TiptapToolbarButon
        ipucu="İtalik"
        kisayol="Ctrl+I"
        aktif={editor.isActive("italic")}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleItalic().run()}
        cocuk={<ItalicIcon className="size-4" />}
      />
      <TiptapToolbarButon
        ipucu="Üstü çizili"
        aktif={editor.isActive("strike")}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleStrike().run()}
        cocuk={<StrikethroughIcon className="size-4" />}
      />
      <TiptapToolbarButon
        ipucu="Satır içi kod"
        kisayol="Ctrl+E"
        aktif={editor.isActive("code")}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleCode().run()}
        cocuk={<CodeIcon className="size-4" />}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <TiptapToolbarButon
        ipucu="Başlık 1"
        aktif={editor.isActive("heading", { level: 1 })}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        cocuk={<Heading1Icon className="size-4" />}
      />
      <TiptapToolbarButon
        ipucu="Başlık 2"
        aktif={editor.isActive("heading", { level: 2 })}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        cocuk={<Heading2Icon className="size-4" />}
      />
      <TiptapToolbarButon
        ipucu="Başlık 3"
        aktif={editor.isActive("heading", { level: 3 })}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        cocuk={<Heading3Icon className="size-4" />}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <TiptapToolbarButon
        ipucu="Madde işaretli liste"
        aktif={editor.isActive("bulletList")}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleBulletList().run()}
        cocuk={<ListIcon className="size-4" />}
      />
      <TiptapToolbarButon
        ipucu="Numaralı liste"
        aktif={editor.isActive("orderedList")}
        devreDisi={devreDisi}
        onTikla={() => editor.chain().focus().toggleOrderedList().run()}
        cocuk={<ListOrderedIcon className="size-4" />}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <TiptapLinkPopover editor={editor} devreDisi={devreDisi} />
    </div>
  );
}
