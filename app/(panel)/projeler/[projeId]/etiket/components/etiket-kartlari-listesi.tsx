"use client";

/* eslint-disable react-hooks/set-state-in-effect -- mount sonrası
   "şimdi" referansı; Date.now() impure olduğu için doğrudan render'da
   çağrılamaz, useEffect içinde state'e alınır. */

import * as React from "react";
import Link from "next/link";
import { CalendarIcon, CheckCircle2, ListIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEtiketKartlari } from "../hooks";
import type { EtiketKartOzeti } from "../services";

type Props = {
  projeId: string;
  etiketId: string;
};

const SAYFA_BOYUTU = 20;

const TARIH_FORMATI = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const TARIH_SAAT_FORMATI = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

export function EtiketKartlariListesi({ projeId, etiketId }: Props) {
  const [sayfa, setSayfa] = React.useState(1);
  // Hydration-safe "şimdi": SSR'da null, mount sonrası set; bitisGecti
  // hesabı için referans (Date.now impure — Kural ihlalini önler).
  const [simdi, setSimdi] = React.useState<number | null>(null);
  React.useEffect(() => {
    setSimdi(Date.now());
  }, []);

  const sorgu = useEtiketKartlari(etiketId, sayfa, SAYFA_BOYUTU);

  const yukleniyor = sorgu.isLoading;
  const veri = sorgu.data;
  const kayitlar = veri?.kayitlar ?? [];
  const toplam = veri?.toplam ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));

  if (yukleniyor) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (kayitlar.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
        Bu etikete bağlı kart yok.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {toplam} kart bağlı
      </p>
      <ul className="flex flex-col gap-2">
        {kayitlar.map((k) => (
          <KartSatiri key={k.id} projeId={projeId} kart={k} simdi={simdi} />
        ))}
      </ul>
      {toplamSayfa > 1 && (
        <Sayfalama
          sayfa={sayfa}
          toplamSayfa={toplamSayfa}
          oncekiTikla={() => setSayfa((s) => Math.max(1, s - 1))}
          sonrakiTikla={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))}
        />
      )}
    </div>
  );
}

function KartSatiri({
  projeId,
  kart,
  simdi,
}: {
  projeId: string;
  kart: EtiketKartOzeti;
  simdi: number | null;
}) {
  const bitisGecti =
    simdi !== null &&
    kart.bitis !== null &&
    !kart.tamamlandi_mi &&
    new Date(kart.bitis).getTime() < simdi;

  return (
    <li>
      <Link
        href={`/projeler/${projeId}?kart=${kart.id}`}
        className={cn(
          "hover:bg-accent/40 flex flex-col gap-2 rounded-xl border p-3 transition-colors",
          kart.tamamlandi_mi && "opacity-70",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 items-start gap-2">
            {kart.tamamlandi_mi && (
              <CheckCircle2
                className="text-success mt-0.5 size-4 shrink-0"
                aria-label="Tamamlandı"
              />
            )}
            <span
              className={cn(
                "flex-1 font-medium leading-snug",
                kart.tamamlandi_mi && "line-through",
              )}
            >
              {kart.baslik}
            </span>
          </div>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <ListIcon className="size-3" />
            {kart.liste_adi}
          </span>
          {kart.bitis !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                bitisGecti && "text-destructive",
              )}
            >
              <CalendarIcon className="size-3" />
              {TARIH_FORMATI.format(new Date(kart.bitis))}
            </span>
          )}
          {kart.yetkili_sayisi > 0 && (
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="size-3" />
              {kart.yetkili_sayisi}
            </span>
          )}
          <span className="ml-auto">
            Güncel: {TARIH_SAAT_FORMATI.format(new Date(kart.guncelleme_zamani))}
          </span>
          {kart.tamamlandi_mi && (
            <Badge variant="secondary" className="ml-1">
              Tamamlandı
            </Badge>
          )}
        </div>
      </Link>
    </li>
  );
}

function Sayfalama({
  sayfa,
  toplamSayfa,
  oncekiTikla,
  sonrakiTikla,
}: {
  sayfa: number;
  toplamSayfa: number;
  oncekiTikla: () => void;
  sonrakiTikla: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-muted-foreground text-xs">
        Sayfa <span className="font-medium">{sayfa}</span> / {toplamSayfa}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={oncekiTikla}
          disabled={sayfa <= 1}
        >
          Önceki
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={sonrakiTikla}
          disabled={sayfa >= toplamSayfa}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
}
