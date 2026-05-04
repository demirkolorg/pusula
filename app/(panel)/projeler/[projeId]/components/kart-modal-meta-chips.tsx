"use client";

import * as React from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
  HashIcon,
  LinkIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { kartHedefKurumlariEylem } from "../actions";
import { useKartEtiketleri, useEtiketler } from "../etiket/hooks";
import { useKartUyeleri } from "../uye/hooks";
import { useKartIliskileri } from "../iliski/hooks";
import { EtiketPopover } from "../etiket/components/etiket-popover";
import { UyePopover } from "../uye/components/uye-popover";
import { IliskiPopover } from "../iliski/components/iliski-popover";
import { KartBitisPopover } from "./kart-bitis-popover";
import { KartKurumPopover } from "./kart-kurum-popover";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
});

type Props = {
  kartId: string;
  projeId: string;
  bitis: Date | string | null;
  bitisKaydet: (yeni: Date | null) => void;
};

// Sancak `meta-chip` strip'i — pill chip'ler: ICON · sayı/metin · (preview) · chevron.
// Sırası referansla aynı: Atananlar · Tarih · Etiketler · Kurumlar · İlişkili Kartlar.
export function KartModalMetaChips({
  kartId,
  projeId,
  bitis,
  bitisKaydet,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <UyeChipBaglanti kartId={kartId} projeId={projeId} />
      <BitisChip bitis={bitis} bitisKaydet={bitisKaydet} />
      <EtiketChipBaglanti kartId={kartId} projeId={projeId} />
      <KurumChipBaglanti kartId={kartId} />
      <IliskiChipBaglanti kartId={kartId} projeId={projeId} />
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

function UyeChipBaglanti({
  kartId,
  projeId,
}: {
  kartId: string;
  projeId: string;
}) {
  const sorgu = useKartUyeleri(kartId);
  const sayi = sorgu.data?.length ?? 0;
  return (
    <UyePopover
      kartId={kartId}
      projeId={projeId}
      trigger={
        <ChipButon
          icon={UserIcon}
          sayi={sayi}
          bosMu={sayi === 0}
          aria-label="Atananlar"
        />
      }
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

  // Tarih yaklaştıysa sancak'ta amber dot — 7 gün kuralı.
  // Şu anki zamanı render-pure tutmak için mount anında bir kez ölçüyoruz;
  // modal kısa süre açık kalır, milisaniye doğruluğu kritik değil.
  const [simdi] = React.useState(() => Date.now());
  const yaklasiyorMu = React.useMemo(() => {
    if (!bitis) return false;
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

function KurumChipBaglanti({ kartId }: { kartId: string }) {
  // KartHedefKurumlar ile aynı queryKey — cache paylaşımı.
  const sorgu = useQuery({
    queryKey: ["kart-hedef-kurumlar", kartId] as const,
    queryFn: async () => {
      const r = await kartHedefKurumlariEylem({ kart_id: kartId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
  const sayi = sorgu.data?.length ?? 0;
  return (
    <KartKurumPopover
      kartId={kartId}
      trigger={
        <ChipButon
          icon={HashIcon}
          sayi={sayi}
          bosMu={sayi === 0}
          aria-label="Kurumlar"
        />
      }
    />
  );
}

function IliskiChipBaglanti({
  kartId,
  projeId,
}: {
  kartId: string;
  projeId: string;
}) {
  const sorgu = useKartIliskileri(kartId);
  const sayi = sorgu.data?.length ?? 0;
  return (
    <IliskiPopover
      kartId={kartId}
      projeId={projeId}
      trigger={
        <ChipButon
          icon={LinkIcon}
          sayi={sayi}
          bosMu={sayi === 0}
          aria-label="İlişkili kartlar"
        />
      }
    />
  );
}
