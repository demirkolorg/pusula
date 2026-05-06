"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ADR-0023 — Toolbar tek-buton primitive'i. shadcn Toggle yok, button +
// `aria-pressed` ile semantik karşılık. Base UI tooltip `render` prop'u
// (asChild değil) kullanıyor — diğer kullanım örneği:
// kart-tamamla-toggle.tsx:186.

type Props = {
  ipucu: string;
  aktif?: boolean;
  devreDisi?: boolean;
  onTikla: () => void;
  cocuk: React.ReactNode;
  // Klavye kısayolu rozeti — tooltip'te küçük gri etiketle gösterilir.
  kisayol?: string;
};

export const TiptapToolbarButon = React.forwardRef<HTMLButtonElement, Props>(
  function TiptapToolbarButon(
    { ipucu, aktif, devreDisi, onTikla, cocuk, kisayol },
    ref,
  ) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              ref={ref}
              type="button"
              aria-label={ipucu}
              aria-pressed={aktif ?? false}
              disabled={devreDisi}
              onClick={onTikla}
              // Editör focus'unu kaybetmeden komut çalışsın diye mousedown'u
              // engelle — Tiptap içeriği üzerinde caret korunur.
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent",
                "text-muted-foreground transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
                aktif && "bg-accent text-accent-foreground border-border",
              )}
            >
              {cocuk}
            </button>
          }
        />
        <TooltipContent>
          <span>{ipucu}</span>
          {kisayol && (
            <span className="text-muted-foreground ml-2 text-[11px]">{kisayol}</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  },
);
