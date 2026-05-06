"use client";

import * as React from "react";
import { FolderIcon, KanbanIcon, SearchIcon, StarIcon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { kapakMetinSinifi } from "@/lib/kapak-renk";
import { ikonMu } from "@/lib/kapak-ikon";
import type { ProjeKlasoru } from "../services-proje-gorunumu";

// Proje görünümünün ana ekranı: kullanıcının erişebildiği projeler için
// Windows Explorer'daki klasör grid'i benzeri kartlar. Tıklanan kart
// proje içeriğine drilldown'lar.

type Props = {
  klasorler: ProjeKlasoru[];
  onProjeAc: (projeId: string) => void;
  isLoading?: boolean;
};

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export function ProjeKlasorGrid({ klasorler, onProjeAc, isLoading }: Props) {
  const [arama, setArama] = React.useState("");

  const filtreli = React.useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    if (!q) return klasorler;
    return klasorler.filter((k) =>
      k.ad.toLocaleLowerCase("tr").includes(q),
    );
  }, [arama, klasorler]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-md">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Projelerde ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="h-11 pl-10"
          aria-label="Projelerde ara"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Yükleniyor…
        </p>
      ) : filtreli.length === 0 ? (
        <BosDurum aramaVar={arama.length > 0} />
      ) : (
        <ul
          role="list"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {filtreli.map((k) => (
            <li key={k.id}>
              <KlasorKart klasor={k} onAc={() => onProjeAc(k.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KlasorKart({
  klasor,
  onAc,
}: {
  klasor: ProjeKlasoru;
  onAc: () => void;
}) {
  const renkSinifi =
    kapakMetinSinifi(klasor.kapak_renk) ?? "text-muted-foreground";
  const ikon = ikonMu(klasor.kapak_ikon) ? klasor.kapak_ikon : null;

  return (
    <button
      type="button"
      onClick={onAc}
      onDoubleClick={onAc}
      className={cn(
        "group bg-card flex w-full flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors min-h-[44px]",
        "hover:border-primary/50 hover:bg-muted/40 focus-visible:border-primary focus-visible:outline-none",
      )}
      aria-label={`${klasor.ad} projesini aç`}
    >
      <div className="relative size-16" aria-hidden>
        {/* Folder şekli — proje renginde dolu */}
        <FolderIcon
          className={cn("size-16 fill-current", renkSinifi)}
          strokeWidth={1.25}
        />
        {/* Folder gövdesinin görsel merkezine hizalı küçük proje ikonu.
            Lucide FolderIcon viewBox 0 0 24 24'te gövde y≈9..20 aralığında;
            görsel orta y≈14.5 → 16px ikona göre pt-1.5 (~6px aşağı) ofset. */}
        <span className="absolute inset-0 flex items-center justify-center pt-1.5 text-white">
          {ikon ? (
            <DynamicIcon name={ikon} className="size-5" />
          ) : (
            <KanbanIcon className="size-5" />
          )}
        </span>
        {klasor.yildizli_mi && (
          <StarIcon
            className="text-secondary absolute -top-0.5 -right-0.5 size-4"
            fill="currentColor"
            aria-label="Yıldızlı"
          />
        )}
      </div>
      <div className="min-w-0 w-full">
        <p
          className="truncate text-xs font-medium"
          title={klasor.ad}
        >
          {klasor.ad}
        </p>
        <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
          {klasor.dosya_sayisi === 0
            ? "Dosya yok"
            : `${klasor.dosya_sayisi} dosya`}
          {klasor.son_dosya_zamani && (
            <>
              {" · "}
              {TARIH_BICIM.format(klasor.son_dosya_zamani)}
            </>
          )}
        </p>
      </div>
    </button>
  );
}

function BosDurum({ aramaVar }: { aramaVar: boolean }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
      <FolderIcon className="mx-auto size-10 opacity-40" />
      <p className="mt-3 text-sm">
        {aramaVar
          ? "Aramayla eşleşen proje yok."
          : "Henüz dosyası olan bir projeniz yok."}
      </p>
    </div>
  );
}
