"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  BellIcon,
  CalendarClockIcon,
  CheckCheckIcon,
  CheckSquareIcon,
  MessageSquareIcon,
  PaperclipIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useBildirimler,
  useBildirimOkuduIsaretle,
  useTumunuOkuduIsaretle,
} from "../hooks";
import type { BildirimOzeti } from "../services";
import type { BildirimTipi, BildirimleriListele } from "../schemas";

const TARIH_TAM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const TIP_IKON: Record<
  BildirimTipi,
  React.ComponentType<{ className?: string }>
> = {
  YORUM_MENTION: MessageSquareIcon,
  KART_UYE_ATAMA: UsersIcon,
  MADDE_ATAMA: CheckSquareIcon,
  BITIS_YAKLASIYOR: CalendarClockIcon,
  BITIS_GECTI: AlertTriangleIcon,
  YORUM_EKLENDI: MessageSquareIcon,
  EKLENTI_YUKLENDI: PaperclipIcon,
};

const TIP_RENK: Record<BildirimTipi, string> = {
  YORUM_MENTION: "bg-blue-100 text-blue-700",
  KART_UYE_ATAMA: "bg-purple-100 text-purple-700",
  MADDE_ATAMA: "bg-emerald-100 text-emerald-700",
  BITIS_YAKLASIYOR: "bg-amber-100 text-amber-700",
  BITIS_GECTI: "bg-red-100 text-red-700",
  YORUM_EKLENDI: "bg-blue-100 text-blue-700",
  EKLENTI_YUKLENDI: "bg-slate-100 text-slate-700",
};

export function BildirimlerSayfaIcerik() {
  const [filtre, setFiltre] = React.useState<BildirimleriListele["filtre"]>(
    "hepsi",
  );
  const sorgu = useBildirimler(filtre);
  const tumunu = useTumunuOkuduIsaretle();
  const isaretle = useBildirimOkuduIsaretle();

  const filtreler: { id: BildirimleriListele["filtre"]; etiket: string }[] = [
    { id: "hepsi", etiket: "Tümü" },
    { id: "okunmamis", etiket: "Okunmamış" },
    { id: "okunmus", etiket: "Okunmuş" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="bg-background flex w-fit items-center gap-0.5 rounded-md border p-[3px]">
          {filtreler.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium",
                filtre === f.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={filtre === f.id}
            >
              {f.etiket}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => tumunu.mutate({})}
          disabled={tumunu.isPending}
        >
          <CheckCheckIcon className="size-3.5" /> Tümünü okundu işaretle
        </Button>
      </div>

      {sorgu.isLoading ? (
        <p className="text-muted-foreground text-sm">Yükleniyor…</p>
      ) : (sorgu.data?.length ?? 0) === 0 ? (
        <div className="border-muted flex flex-col items-center gap-2 rounded-md border border-dashed py-12 text-center">
          <BellIcon className="text-muted-foreground/60 size-6" />
          <p className="text-muted-foreground text-sm">
            {filtre === "okunmamis"
              ? "Tüm bildirimler okundu."
              : filtre === "okunmus"
                ? "Henüz okunmuş bildirim yok."
                : "Henüz bildirim yok."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorgu.data?.map((b) => (
            <li key={b.id}>
              <BildirimSatiri
                bildirim={b}
                tikla={() => {
                  if (!b.okundu_mu) isaretle.mutate({ ids: [b.id] });
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BildirimSatiri({
  bildirim,
  tikla,
}: {
  bildirim: BildirimOzeti;
  tikla: () => void;
}) {
  const Ikon = TIP_IKON[bildirim.tip];
  const linkHedefi =
    bildirim.kart_id && bildirim.proje_id
      ? `/projeler/${bildirim.proje_id}?kart=${bildirim.kart_id}`
      : "#";

  return (
    <Link
      href={linkHedefi}
      onClick={tikla}
      className={cn(
        "hover:bg-accent/50 flex items-start gap-3 rounded-md border p-3",
        !bildirim.okundu_mu && "bg-blue-50/50 dark:bg-blue-950/20",
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
          TIP_RENK[bildirim.tip],
        )}
      >
        <Ikon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-tight",
            !bildirim.okundu_mu ? "text-foreground font-medium" : "text-foreground/90",
          )}
        >
          {bildirim.baslik}
        </p>
        {bildirim.ozet && (
          <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
            {bildirim.ozet}
          </p>
        )}
        <time className="text-muted-foreground/70 mt-1.5 block text-[11px] tabular-nums">
          {TARIH_TAM.format(new Date(bildirim.olusturma_zamani))}
        </time>
      </div>
      {!bildirim.okundu_mu && (
        <span
          className="bg-primary mt-2 size-2 shrink-0 rounded-full"
          aria-label="Okunmamış"
        />
      )}
    </Link>
  );
}
