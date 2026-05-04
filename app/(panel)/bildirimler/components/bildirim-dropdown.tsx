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
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { SOCKET } from "@/lib/socket-events";
import { useSocket, useSocketEvent } from "@/hooks/use-socket";
import {
  bildirimListeKey,
  bildirimOkunmamisKey,
  useBildirimler,
  useBildirimOkuduIsaretle,
  useOkunmamisSayisi,
  useTumunuOkuduIsaretle,
} from "../hooks";
import type { BildirimOzeti } from "../services";
import type { BildirimTipi } from "../schemas";

const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const RELATIVE = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

function relatifZaman(d: Date): string {
  const fark = (Date.now() - new Date(d).getTime()) / 1000;
  if (fark < 60) return "şimdi";
  if (fark < 3600) return RELATIVE.format(-Math.round(fark / 60), "minute");
  if (fark < 86_400) return RELATIVE.format(-Math.round(fark / 3600), "hour");
  if (fark < 86_400 * 7) return RELATIVE.format(-Math.round(fark / 86_400), "day");
  return TARIH_KISA.format(new Date(d));
}

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

export function BildirimDropdown() {
  const [acik, setAcik] = React.useState(false);
  const sayiQ = useOkunmamisSayisi();
  const sayi = sayiQ.data ?? 0;
  const istemci = useQueryClient();

  // Socket bağlantısını başlat ve realtime bildirim dinle.
  useSocket();
  useSocketEvent<{
    id: string;
    tip: BildirimTipi;
    baslik: string;
    ozet: string | null;
    kart_id: string | null;
    proje_id: string | null;
  }>(
    SOCKET.BILDIRIM_YENI,
    (zarf) => {
      // Cache invalidate — listede ve sayıda anında güncellesin
      istemci.invalidateQueries({ queryKey: bildirimOkunmamisKey });
      istemci.invalidateQueries({ queryKey: bildirimListeKey("hepsi") });
      istemci.invalidateQueries({ queryKey: bildirimListeKey("okunmamis") });
      // Anlık toast bilgi (geçici) — kullanıcı dropdown'u açmadan da farkına varsın
      toast.bilgi(zarf.veri.baslik, {
        aciklama: zarf.veri.ozet ?? undefined,
      });
    },
    // Bildirim üreten ≠ alıcı (services dedupe ediyor); self-filter kapalı.
    { selfFilter: false },
  );

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              sayi > 0 ? `Bildirimler (${sayi} okunmamış)` : "Bildirimler"
            }
            className="relative cursor-pointer"
          >
            <BellIcon className="size-4" />
            {sayi > 0 && (
              <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-medium leading-none">
                {sayi > 99 ? "99+" : sayi}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[360px] p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <BildirimDropdownIcerik kapat={() => setAcik(false)} />
      </PopoverContent>
    </Popover>
  );
}

function BildirimDropdownIcerik({ kapat }: { kapat: () => void }) {
  const sorgu = useBildirimler("hepsi");
  const tumunu = useTumunuOkuduIsaretle();
  const isaretle = useBildirimOkuduIsaretle();
  const okunmamisVar = (sorgu.data ?? []).some((b) => !b.okundu_mu);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <p className="text-sm font-medium">Bildirimler</p>
        <Button
          variant="ghost"
          size="sm"
          disabled={!okunmamisVar}
          onClick={() => tumunu.mutate({})}
          className="h-7 text-xs"
        >
          <CheckCheckIcon className="size-3" /> Tümünü okundu işaretle
        </Button>
      </div>

      {sorgu.isLoading ? (
        <p className="text-muted-foreground p-4 text-xs">Yükleniyor…</p>
      ) : (sorgu.data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground/80 p-6 text-center text-xs">
          Henüz bildirim yok.
        </p>
      ) : (
        <ul className="max-h-[400px] overflow-y-auto">
          {sorgu.data?.map((b) => (
            <li key={b.id}>
              <BildirimSatiri
                bildirim={b}
                tikla={() => {
                  if (!b.okundu_mu) isaretle.mutate({ ids: [b.id] });
                  kapat();
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          render={<Link href="/bildirimler" onClick={kapat} />}
        >
          Tümünü görüntüle
        </Button>
      </div>
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
      : "/bildirimler";

  return (
    <Link
      href={linkHedefi}
      onClick={tikla}
      className={cn(
        "hover:bg-accent flex items-start gap-2 border-b px-3 py-2.5 last:border-b-0",
        !bildirim.okundu_mu && "bg-blue-50/50 dark:bg-blue-950/20",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full",
          TIP_RENK[bildirim.tip],
        )}
      >
        <Ikon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[12.5px] leading-tight",
            !bildirim.okundu_mu ? "text-foreground font-medium" : "text-foreground/90",
          )}
        >
          {bildirim.baslik}
        </p>
        {bildirim.ozet && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11.5px] leading-snug">
            {bildirim.ozet}
          </p>
        )}
        <time className="text-muted-foreground/70 mt-1 block text-[10.5px]">
          {relatifZaman(bildirim.olusturma_zamani)}
        </time>
      </div>
      {!bildirim.okundu_mu && (
        <span
          className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
          aria-label="Okunmamış"
        />
      )}
    </Link>
  );
}
