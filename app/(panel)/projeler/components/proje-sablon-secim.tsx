"use client";

// Yeni proje wizard'ı — Adım 1: şablon seç.
// Boş Proje + sistem şablonları + kullanıcının kendi şablonları kart-grid.
// ADR-0021: 2-adım wizard ("Şablon seç → Proje detayları").

import { DynamicIcon } from "lucide-react/dynamic";
import { FolderKanbanIcon, ShieldCheckIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { kapakKutusuSiniflari } from "@/lib/kapak-renk";
import { cn } from "@/lib/utils";
import { useSablonlar } from "@/app/(panel)/ayarlar/sablonlar/hooks/sablon-sorgulari";
import type { SablonOzet } from "@/app/(panel)/ayarlar/sablonlar/services";

type Props = {
  onSec: (sablon: SablonOzet) => void;
};

export function ProjeSablonSecim({ onSec }: Props) {
  const { data: sablonlar, isLoading } = useSablonlar();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!sablonlar || sablonlar.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        Henüz şablon yok.
      </div>
    );
  }

  // "Boş Proje" sistem şablonunu en başa al — vurgulanan davranış.
  const bos = sablonlar.find((s) => s.sistem_kodu === "bos");
  const digerleri = sablonlar.filter((s) => s.sistem_kodu !== "bos");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {bos && <SablonSecimKart sablon={bos} onSec={onSec} vurgu />}
      {digerleri.map((s) => (
        <SablonSecimKart key={s.id} sablon={s} onSec={onSec} />
      ))}
    </div>
  );
}

function SablonSecimKart({
  sablon,
  onSec,
  vurgu = false,
}: {
  sablon: SablonOzet;
  onSec: (sablon: SablonOzet) => void;
  vurgu?: boolean;
}) {
  const kutuSinifi = kapakKutusuSiniflari(sablon.kapak_renk ?? null);
  const ikonAdi = sablon.kapak_ikon || "folder-kanban";

  return (
    <button
      type="button"
      onClick={() => onSec(sablon)}
      className={cn(
        "bg-card hover:border-foreground/40 hover:shadow-sm active:bg-muted/50 flex h-full min-h-[44px] flex-col items-start gap-3 rounded-lg border p-3 text-left transition-all",
        vurgu && "border-primary/40",
      )}
    >
      <div className="flex w-full items-start gap-2.5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            kutuSinifi,
          )}
        >
          <DynamicIcon
            name={ikonAdi as never}
            className="h-5 w-5"
            fallback={() => <FolderKanbanIcon className="h-5 w-5" />}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-medium">{sablon.ad}</h4>
            {sablon.sistem_mi && (
              <ShieldCheckIcon className="text-muted-foreground h-3 w-3 shrink-0" />
            )}
          </div>
          {sablon.aciklama && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
              {sablon.aciklama}
            </p>
          )}
        </div>
      </div>

      <div className="w-full border-t pt-2.5">
        <div className="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wide">
          {sablon.listeler.length === 0
            ? "Liste yok — sıfırdan başla"
            : `${sablon.listeler.length} liste`}
        </div>
        {sablon.listeler.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sablon.listeler.map((l) => (
              <span
                key={l.id}
                className="bg-muted text-foreground/80 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]"
              >
                {l.ad}
                {l.wip_limit && (
                  <span className="text-muted-foreground text-[9px]">
                    · {l.wip_limit}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
