"use client";

import * as React from "react";
import { BellIcon, LinkIcon, ListIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialogClose } from "@/components/ui/responsive-dialog";
import { kapakArkaplanSinifi, kapakUstuMetinSinifi } from "@/lib/kapak-renk";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

type Props = {
  projeAd: string;
  listeAd: string;
  kartKodu?: string;
  // Kart kapak rengi token'ı — header'a arkaplan + kontrastlı foreground olarak yansır.
  // Token globals.css'teki `--<token>` ve `--<token>-foreground` çiftine bağlıdır;
  // light/dark temada kontrast otomatik korunur.
  kapakRenk?: string | null;
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
  kapakRenk,
  baglantiKopyala,
  aksiyonMenu,
}: Props) {
  const bgSinifi = kapakArkaplanSinifi(kapakRenk);
  const fgSinifi = kapakUstuMetinSinifi(kapakRenk);
  const renkliMi = bgSinifi !== null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b px-4 py-2.5 transition-colors sm:px-5",
        bgSinifi,
        fgSinifi,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-xs",
          renkliMi ? "opacity-80" : "text-muted-foreground",
        )}
      >
        <ListIcon className="size-3.5 shrink-0" />
        <span className="truncate">{projeAd}</span>
        <span className={renkliMi ? "opacity-60" : "text-muted-foreground/60"}>
          /
        </span>
        <span
          className={cn(
            "truncate font-medium",
            renkliMi ? "opacity-100" : "text-foreground/80",
          )}
        >
          {listeAd}
        </span>
        {kartKodu && (
          <span
            className={cn(
              "ml-1.5 shrink-0 font-mono text-[11px]",
              renkliMi ? "opacity-70" : "text-muted-foreground/70",
            )}
          >
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
        <span
          className={cn(
            "mx-1 h-4 w-px",
            renkliMi ? "bg-current opacity-30" : "bg-border",
          )}
        />
        <ResponsiveDialogClose
          render={
            <Button
              type="button"
              variant={renkliMi ? "ghost" : "destructive"}
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
