"use client";

import * as React from "react";
import { CheckCircle2, Circle, CircleDashed, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  TamamlamaYasak,
  ToggleModu,
} from "../kart-tamamla-kontrol";

type Boyut = "sm" | "md";

// ADR-0019 — Toggle aksiyon türü. Caller modu hesaplayıp doğru handler'ı
// geçer. `aktif` modda ham toggle; `onerilebilir`/`reddedildi` öneri verir;
// `onerildi` yetkisiz kullanıcı için sadece bilgi gösterir (tıklama kısıt).
type Aksiyon =
  | { tip: "tamamla"; sonraki: boolean }
  | { tip: "oneri-ver" }
  // Yetkili kullanıcı `onerildi` modunda KartMini'de tıklayınca modal açılsın
  // diye toggle bu aksiyonu üretmez (parent kart click handler'ı çalışır).
  // Bu Aksiyon yine de tip uyumu için var; toggle iç tıklamada üretmez.
  | { tip: "iptal" };

type Props = {
  tamamlandi: boolean;
  modu: ToggleModu;
  onAksiyon: (aksiyon: Aksiyon) => void;
  // ADR-0018 — sert blok (kontrol listesi yarım veya yetki-yok). modu="aktif"
  // iken bu prop önemli; diğer modlarda öneri akışı zaten farklı yetki ile
  // çalışır.
  yasak?: TamamlamaYasak | null;
  boyut?: Boyut;
  // KartMini'de hover-only; modal'da her zaman görünür.
  hoverdaGorunur?: boolean;
};

export function KartTamamlaToggle({
  tamamlandi,
  modu,
  onAksiyon,
  yasak = null,
  boyut = "sm",
  hoverdaGorunur = false,
}: Props) {
  const ikonSinifi = boyut === "sm" ? "size-4" : "size-5";
  const hitSinifi = boyut === "sm" ? "size-6" : "size-8";

  // Mod bazlı görsel + tooltip + tıklama davranışı.
  // disabled bayrağı: yasak varsa (modu=aktif kontekstinde) veya modu=onerildi
  // (zaten bekliyor — yeni öneri verilemez, yetkili banner'dan onaylar).
  const meta = React.useMemo<{
    aria: string;
    tooltipBaslik: string;
    tooltipDetay: string | null;
    icerik: React.ReactNode;
    sinifSet: string;
    onClick: () => void;
    disabled: boolean;
  }>(() => {
    // Tamamlandı = modu="aktif" (helper bunu garanti ediyor).
    if (tamamlandi) {
      const aria = "Tamamlanmadı olarak işaretle";
      return {
        aria,
        tooltipBaslik: aria,
        tooltipDetay: yasak?.mesaj ?? null,
        icerik: (
          <CheckCircle2 className={cn(ikonSinifi, "fill-emerald-500/15")} />
        ),
        sinifSet:
          "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
        onClick: () => {
          if (yasak) {
            toast.uyari(yasak.mesaj);
            return;
          }
          onAksiyon({ tip: "tamamla", sonraki: false });
        },
        disabled: yasak !== null,
      };
    }

    if (modu.tip === "aktif") {
      const aria = "Tamamlandı olarak işaretle";
      return {
        aria,
        tooltipBaslik: aria,
        tooltipDetay: yasak?.mesaj ?? null,
        icerik: <Circle className={ikonSinifi} strokeWidth={1.75} />,
        sinifSet: "text-muted-foreground hover:text-foreground hover:bg-muted",
        onClick: () => {
          if (yasak) {
            toast.uyari(yasak.mesaj);
            return;
          }
          onAksiyon({ tip: "tamamla", sonraki: true });
        },
        disabled: yasak !== null,
      };
    }

    if (modu.tip === "onerilebilir") {
      const aria = "Tamamlandığını bildir";
      return {
        aria,
        tooltipBaslik: aria,
        // Kontrol listesi yarımsa öneri verilemez — kullanıcı sebebi tooltip'te
        // okur; tıklarsa toast.uyari ile aynı mesaj gösterilir (ADR-0018 + 0019
        // ortak ön koşul).
        tooltipDetay: yasak?.mesaj ?? null,
        icerik: <Circle className={ikonSinifi} strokeWidth={1.75} />,
        sinifSet: "text-muted-foreground hover:text-foreground hover:bg-muted",
        onClick: () => {
          if (yasak) {
            toast.uyari(yasak.mesaj);
            return;
          }
          onAksiyon({ tip: "oneri-ver" });
        },
        disabled: yasak !== null,
      };
    }

    if (modu.tip === "onerildi") {
      const aria = "Tamamlama önerisi onay bekliyor";
      return {
        aria,
        tooltipBaslik: aria,
        tooltipDetay: modu.onerenAd ?? null,
        icerik: (
          <CircleDashed
            className={cn(ikonSinifi, "fill-amber-500/15 text-amber-600 dark:text-amber-400")}
            strokeWidth={2}
          />
        ),
        sinifSet:
          "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300",
        onClick: () => {
          // Bekleyen öneride toggle yeni bir aksiyon üretmez — modal'a
          // yönlendirir (KartMini'de zaten kart click açar). Yetkili
          // kullanıcı banner'dan Onayla/Reddet seçer.
          toast.bilgi("Bekleyen öneri için modal'ı açın.");
        },
        disabled: true,
      };
    }

    // modu.tip === "reddedildi" (yetkisiz kullanıcı; yetkili `aktif`'e düşer)
    const aria = "Tamamlama önerisi reddedildi — yeniden bildir";
    // Yeniden öneri akışı da kontrol listesi yarımken bloklanır — aksi halde
    // kullanıcı reddedildi sonrası yarım kontrol listesi ile yine öneri
    // gönderir (server zaten reddeder, ama UX için önden uyar).
    const yasakDetay = yasak?.mesaj ?? null;
    const sebepDetay = modu.sebep ? `Sebep: ${modu.sebep}` : null;
    return {
      aria,
      tooltipBaslik: aria,
      tooltipDetay: yasakDetay ?? sebepDetay,
      icerik: (
        <CircleX
          className={cn(ikonSinifi, "text-red-600 dark:text-red-400")}
          strokeWidth={2}
        />
      ),
      sinifSet:
        "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300",
      onClick: () => {
        if (yasak) {
          toast.uyari(yasak.mesaj);
          return;
        }
        onAksiyon({ tip: "oneri-ver" });
      },
      disabled: yasak !== null,
    };
  }, [tamamlandi, modu, yasak, ikonSinifi, onAksiyon]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            // Why: KartMini'de toggle modal'ı açan kart click handler'ının içinde
            // duruyor. Tıklama yukarı sızarsa modal açılır; bu da Trello davranışını
            // kırar.
            onClick={(e) => {
              e.stopPropagation();
              meta.onClick();
            }}
            onPointerDown={(e) => {
              // dnd-kit pointer sensor 5px hareket sonrası drag başlatır;
              // toggle'ın içinde drag asla başlamasın.
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
              }
            }}
            aria-disabled={meta.disabled}
            aria-label={meta.aria}
            aria-pressed={tamamlandi}
            className={cn(
              "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-[width,opacity,margin] duration-150 ease-out",
              // Hover-only görünürlük: tamamlanmamış + (aktif veya önerilebilir).
              // Width + opacity transition ile yumuşak aç/kapa: kapalıyken
              // genişlik 0 → başlık sola yaslanır; açıkken hit alanına genişler.
              // Klavye erişilebilirliği için kart group'unda focus-within da
              // tetikler. Diğer modlarda (önerildi/reddedildi/tamamlandı) her
              // zaman görünür — kullanıcı durumu kart'ın görünümünden algılar.
              hoverdaGorunur &&
                !tamamlandi &&
                (modu.tip === "aktif" || modu.tip === "onerilebilir")
                ? cn(
                    "w-0 -ml-1.5 opacity-0",
                    "group-hover/kart:opacity-100 group-focus-within/kart:opacity-100",
                    boyut === "sm"
                      ? "group-hover/kart:w-6 group-hover/kart:ml-0 group-focus-within/kart:w-6 group-focus-within/kart:ml-0"
                      : "group-hover/kart:w-8 group-hover/kart:ml-0 group-focus-within/kart:w-8 group-focus-within/kart:ml-0",
                  )
                : hitSinifi,
              meta.sinifSet,
              meta.disabled && "cursor-not-allowed",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            )}
          >
            {meta.icerik}
          </button>
        }
      />
      <TooltipContent className="flex flex-col items-start gap-0.5 text-left">
        <span className="font-medium">{meta.tooltipBaslik}</span>
        {meta.tooltipDetay && (
          <span className="text-background/80">{meta.tooltipDetay}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
