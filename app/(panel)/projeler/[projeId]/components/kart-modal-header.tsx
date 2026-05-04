"use client";

import * as React from "react";
import { BellIcon, LinkIcon, ListIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialogClose } from "@/components/ui/responsive-dialog";
import { toast } from "@/lib/toast";

type Props = {
  projeAd: string;
  listeAd: string;
  kartKodu?: string;
  baglantiKopyala: () => void;
  // Sancak'taki "more" menüsü — çoğalt/arşiv/sil gibi tüm aksiyonlar
  // burada slot olarak verilir; header sade kalır.
  aksiyonMenu: React.ReactNode;
};

// Sancak referansı: top-bar — soldan breadcrumb (list ikon · sütun · / · liste · mono kod)
// sağda 4 aksiyon ikonu (bildirim, bağlantı, more, divider, kapat).
// "Daha fazla" menüsünde sil + yakında olan aksiyonlar.
export function KartModalHeader({
  projeAd,
  listeAd,
  kartKodu,
  baglantiKopyala,
  aksiyonMenu,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5 sm:px-5">
      <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
        <ListIcon className="size-3.5 shrink-0" />
        <span className="truncate">{projeAd}</span>
        <span className="text-muted-foreground/60">/</span>
        <span className="text-foreground/80 truncate font-medium">
          {listeAd}
        </span>
        {kartKodu && (
          <span className="text-muted-foreground/70 ml-1.5 shrink-0 font-mono text-[11px]">
            {kartKodu}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bildirimleri aç/kapat"
          title="Bildirimleri aç/kapat — bu kartı takip edenlere yeni yorum, atama veya değişikliklerde bildirim gönderir"
          onClick={() => toast.bilgi("Bildirim takibi yakında eklenecek")}
        >
          <BellIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bağlantıyı kopyala"
          title="Karta doğrudan bağlantıyı panoya kopyala"
          onClick={baglantiKopyala}
        >
          <LinkIcon className="size-3.5" />
        </Button>
        {aksiyonMenu}
        <span className="bg-border mx-1 h-4 w-px" />
        <ResponsiveDialogClose
          render={
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label="Modalı kapat"
              title="Modalı kapat (Esc)"
            >
              <XIcon className="size-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
