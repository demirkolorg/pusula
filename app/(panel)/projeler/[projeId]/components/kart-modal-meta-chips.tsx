"use client";

import * as React from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
  HashIcon,
  PaletteIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { kapakArkaplanSinifi } from "@/lib/kapak-renk";
import { kartBirimleriEylem } from "../actions";
import { useKartEtiketleri, useEtiketler } from "../etiket/hooks";
import { useKartYetkilileri } from "../yetkili/hooks";
import { EtiketPopover } from "../etiket/components/etiket-popover";
import { YetkililerPaneliPopover } from "../yetkili/components/yetkililer-paneli";
import type { YetkiliKaynagi } from "../yetkili/yetkili-tipler";
import { KartBitisPopover } from "./kart-bitis-popover";
import { KartKapakPopover } from "./kart-kapak-popover";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

type Props = {
  kartId: string;
  projeId: string;
  yetkiliYonet: boolean;
  bitis: Date | string | null;
  bitisKaydet: (yeni: Date | null) => void;
  kapakRenk: string | null;
};

// Sancak `meta-chip` strip'i — pill chip'ler: ICON · sayı/metin · (preview) · chevron.
// Sırası referansla aynı: Yetkililer · Tarih · Etiketler · Birimler · Kapak.
export function KartModalMetaChips({
  kartId,
  projeId,
  yetkiliYonet,
  bitis,
  bitisKaydet,
  kapakRenk,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <YetkiliChipBaglanti
        kartId={kartId}
        projeId={projeId}
        yetkiliYonet={yetkiliYonet}
      />
      <BitisChip bitis={bitis} bitisKaydet={bitisKaydet} />
      <EtiketChipBaglanti kartId={kartId} projeId={projeId} />
      <BirimChipBaglanti
        kartId={kartId}
        projeId={projeId}
        yetkiliYonet={yetkiliYonet}
      />
      <KapakChipBaglanti
        kartId={kartId}
        projeId={projeId}
        yetkiliYonet={yetkiliYonet}
        kapakRenk={kapakRenk}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ortak chip kabuğu — sancak `meta-chip` görselinin birebir karşılığı
// ---------------------------------------------------------------------------

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  metin?: string;
  sayi?: number;
  bosMu?: boolean;
  onPreview?: React.ReactNode;
};

const ChipButon = React.forwardRef<HTMLButtonElement, ChipProps>(
  function ChipButon(
    { icon: Icon, metin, sayi, bosMu, onPreview, className, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "border-input hover:border-foreground/30 hover:bg-muted/60",
          "inline-flex h-[26px] items-center gap-1.5 rounded-full border bg-background pl-2 pr-1.5",
          "text-xs font-medium text-foreground/80 transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "data-[state=open]:bg-primary/10 data-[state=open]:border-primary data-[state=open]:text-primary",
          className,
        )}
        {...rest}
      >
        <Icon className="size-3" strokeWidth={1.8} />
        {!bosMu && metin && (
          <span className="text-foreground text-[11.5px]">{metin}</span>
        )}
        {!bosMu && typeof sayi === "number" && (
          <span className="text-foreground text-[11px] font-semibold tabular-nums">
            {sayi}
          </span>
        )}
        {bosMu && (
          <span className="text-muted-foreground/70 text-[11px]">—</span>
        )}
        {onPreview}
        <ChevronDownIcon className="size-2.5 opacity-60" strokeWidth={2} />
      </button>
    );
  },
);

// ---------------------------------------------------------------------------
// Chip varyantları
// ---------------------------------------------------------------------------

// Why aynı kaynak: yetkili kişiler ve birimler artık tek polimorfik panelde
// yönetilir. Hem `Yetkili` chip hem `Birim` chip aynı popover'ı açar — her
// iki alandaki tüm yetkilendirme tek yerden görünür.
function kartYetkiliKaynagi(
  kartId: string,
  projeId: string,
  yetkiliYonet: boolean,
): YetkiliKaynagi {
  return {
    tip: "kart",
    kartId,
    projeId,
    izinler: { birimYonet: yetkiliYonet, kisiYonet: yetkiliYonet },
  };
}

function YetkiliChipBaglanti({
  kartId,
  projeId,
  yetkiliYonet,
}: {
  kartId: string;
  projeId: string;
  yetkiliYonet: boolean;
}) {
  const sorgu = useKartYetkilileri(kartId);
  const sayi = sorgu.data?.length ?? 0;
  const trigger = (
    <ChipButon
      icon={UserIcon}
      sayi={sayi}
      bosMu={sayi === 0}
      aria-label="Yetkililer"
    />
  );
  if (!yetkiliYonet) return trigger;
  return (
    <YetkililerPaneliPopover
      kaynak={kartYetkiliKaynagi(kartId, projeId, yetkiliYonet)}
      side="bottom"
      align="start"
      trigger={trigger}
    />
  );
}

function BitisChip({
  bitis,
  bitisKaydet,
}: {
  bitis: Date | string | null;
  bitisKaydet: (yeni: Date | null) => void;
}) {
  const metin = React.useMemo(() => {
    if (!bitis) return undefined;
    const d = bitis instanceof Date ? bitis : new Date(bitis);
    return Number.isNaN(d.getTime()) ? undefined : TARIH_BICIM.format(d);
  }, [bitis]);

  const [simdi, setSimdi] = React.useState<number | null>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setSimdi(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const yaklasiyorMu = React.useMemo(() => {
    if (simdi === null || !bitis) return false;
    const d = bitis instanceof Date ? bitis : new Date(bitis);
    if (Number.isNaN(d.getTime())) return false;
    const fark = (d.getTime() - simdi) / (1000 * 60 * 60 * 24);
    return fark >= 0 && fark <= 7;
  }, [bitis, simdi]);

  return (
    <KartBitisPopover
      bitis={bitis}
      kaydet={bitisKaydet}
      trigger={
        <ChipButon
          icon={CalendarIcon}
          metin={metin}
          bosMu={!metin}
          aria-label="Bitiş tarihi"
          onPreview={
            yaklasiyorMu && (
              <span
                className="bg-amber-500 size-1.5 rounded-full"
                aria-hidden
              />
            )
          }
        />
      }
    />
  );
}

function EtiketChipBaglanti({
  kartId,
  projeId,
}: {
  kartId: string;
  projeId: string;
}) {
  const seciliQ = useKartEtiketleri(kartId);
  const tumQ = useEtiketler(projeId);
  const seciliSet = React.useMemo(
    () => new Set(seciliQ.data ?? []),
    [seciliQ.data],
  );
  const seciliEtiketler = React.useMemo(
    () => (tumQ.data ?? []).filter((e) => seciliSet.has(e.id)),
    [tumQ.data, seciliSet],
  );
  const sayi = seciliEtiketler.length;
  return (
    <EtiketPopover
      kartId={kartId}
      projeId={projeId}
      trigger={
        <ChipButon
          icon={TagIcon}
          sayi={sayi}
          bosMu={sayi === 0}
          aria-label="Etiketler"
          onPreview={
            sayi > 0 && (
              <span className="flex items-center gap-0.5">
                {seciliEtiketler.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: e.renk }}
                    aria-hidden
                  />
                ))}
              </span>
            )
          }
        />
      }
    />
  );
}

function BirimChipBaglanti({
  kartId,
  projeId,
  yetkiliYonet,
}: {
  kartId: string;
  projeId: string;
  yetkiliYonet: boolean;
}) {
  // Adaptör'le aynı cache key — chip ve panel tek cache paylaşır.
  const sorgu = useQuery({
    queryKey: ["kart-birimler", kartId] as const,
    queryFn: async () => {
      const r = await kartBirimleriEylem({ kart_id: kartId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
  const sayi = sorgu.data?.length ?? 0;
  const trigger = (
    <ChipButon
      icon={HashIcon}
      sayi={sayi}
      bosMu={sayi === 0}
      aria-label="Yetkili birimler"
    />
  );
  if (!yetkiliYonet) return trigger;
  return (
    <YetkililerPaneliPopover
      kaynak={kartYetkiliKaynagi(kartId, projeId, yetkiliYonet)}
      side="bottom"
      align="start"
      trigger={trigger}
    />
  );
}

function KapakChipBaglanti({
  kartId,
  projeId,
  yetkiliYonet,
  kapakRenk,
}: {
  kartId: string;
  projeId: string;
  yetkiliYonet: boolean;
  kapakRenk: string | null;
}) {
  const sinif = kapakArkaplanSinifi(kapakRenk);
  const trigger = (
    <ChipButon
      icon={PaletteIcon}
      bosMu={!sinif}
      aria-label="Kapak rengi"
      onPreview={
        sinif && (
          <span
            className={cn("size-2.5 rounded-full", sinif)}
            aria-hidden
          />
        )
      }
    />
  );
  return (
    <KartKapakPopover
      kartId={kartId}
      projeId={projeId}
      mevcut={kapakRenk}
      duzenleyebilir={yetkiliYonet}
      trigger={trigger}
    />
  );
}
