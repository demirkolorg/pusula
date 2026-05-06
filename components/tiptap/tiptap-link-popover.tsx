"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { LinkIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TiptapToolbarButon } from "./tiptap-toolbar-buton";

// ADR-0023 — Link insert popover. URL girdisi alır, Tiptap link mark'ını
// uygular. Mevcut seçimde link varsa düzenleme moduna geçer + "Kaldır"
// butonu gösterir.

type Props = {
  editor: Editor;
  devreDisi?: boolean;
};

function gecerliMi(url: string): boolean {
  if (!url) return false;
  const trimli = url.trim();
  if (trimli.startsWith("mailto:") || trimli.startsWith("tel:")) return true;
  try {
    new URL(trimli.includes("://") ? trimli : `https://${trimli}`);
    return true;
  } catch {
    return false;
  }
}

function urlNormallestir(url: string): string {
  const trimli = url.trim();
  if (
    trimli.startsWith("http://") ||
    trimli.startsWith("https://") ||
    trimli.startsWith("mailto:") ||
    trimli.startsWith("tel:")
  ) {
    return trimli;
  }
  return `https://${trimli}`;
}

export function TiptapLinkPopover({ editor, devreDisi }: Props) {
  const [acik, setAcik] = React.useState(false);
  const [url, setUrl] = React.useState("");

  const aktif = editor.isActive("link");

  const popoverAcildi = (a: boolean) => {
    if (a) {
      // Mevcut linkin URL'sini doldur (varsa).
      const mevcut = editor.getAttributes("link").href;
      setUrl(typeof mevcut === "string" ? mevcut : "");
    }
    setAcik(a);
  };

  const uygula = () => {
    if (!gecerliMi(url)) return;
    const norm = urlNormallestir(url);
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: norm })
      .run();
    setAcik(false);
  };

  const kaldir = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setAcik(false);
  };

  return (
    <Popover open={acik} onOpenChange={popoverAcildi}>
      <PopoverTrigger
        render={
          <TiptapToolbarButon
            ipucu="Bağlantı"
            kisayol="Ctrl+K"
            aktif={aktif}
            devreDisi={devreDisi}
            onTikla={() => popoverAcildi(true)}
            cocuk={<LinkIcon className="size-4" />}
          />
        }
      />
      <PopoverContent className="w-80" align="start">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="tiptap-link-url">
            Bağlantı URL
          </label>
          <Input
            id="tiptap-link-url"
            type="url"
            placeholder="https://ornek.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                uygula();
              }
            }}
            autoFocus
          />
          <div className="flex justify-between gap-2">
            {aktif ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={kaldir}
              >
                Kaldır
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              size="sm"
              onClick={uygula}
              disabled={!gecerliMi(url)}
            >
              Uygula
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
