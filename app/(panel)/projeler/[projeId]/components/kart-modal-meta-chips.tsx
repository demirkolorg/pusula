"use client";

import * as React from "react";
import {
  CalendarIcon,
  PaletteIcon,
  ShieldIcon,
  TagIcon,
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
  // ADR-0018 — kart tamamlandı bayrağı; bitiş geçmiş olsa bile tamamlanmış
  // kart "Gecikti" rozeti göstermez. BitisChip bu değere göre kırmızı vurgu
  // yapar.
  tamamlandi: boolean;
};

// Sancak `meta-chip` strip'i — pill chip'ler: ICON · sayı/metin · (preview) · chevron.
// Sırası: Yetkililer · Tarih · Etiketler · Kapak. (Yetkili chip'i hem kişi hem
// birim sayısının toplamını gösterir; tek panel her ikisini yönetir.)
export function KartModalMetaChips({
  kartId,
  projeId,
  yetkiliYonet,
  bitis,
  bitisKaydet,
  kapakRenk,
  tamamlandi,
}: Props) {
  return (
    <div className="-ml-2 flex flex-wrap items-center gap-0.5">
      <YetkiliChipBaglanti
        kartId={kartId}
        projeId={projeId}
        yetkiliYonet={yetkiliYonet}
      />
      <BitisChip
        bitis={bitis}
        bitisKaydet={bitisKaydet}
        tamamlandi={tamamlandi}
      />
      <EtiketChipBaglanti kartId={kartId} projeId={projeId} />
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
    const dolu = !bosMu && (typeof sayi === "number" ? sayi > 0 : Boolean(metin));
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "group inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "data-[state=open]:bg-muted data-[state=open]:text-foreground",
          dolu && "text-foreground",
          className,
        )}
        {...rest}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        {!bosMu && metin && (
          <span className="text-[12px]">{metin}</span>
        )}
        {!bosMu && typeof sayi === "number" && (
          <span className="text-[12px] font-semibold tabular-nums">{sayi}</span>
        )}
        {onPreview}
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
  const kisiSorgu = useKartYetkilileri(kartId);
  // Why: birim ve kişi yetkilileri tek panelde yönetiliyor; tek chip ikisinin
  // toplam sayısını gösterir. Adaptör ile aynı cache key'i paylaşır.
  const birimSorgu = useQuery({
    queryKey: ["kart-birimler", kartId] as const,
    queryFn: async () => {
      const r = await kartBirimleriEylem({ kart_id: kartId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });
  const sayi = (kisiSorgu.data?.length ?? 0) + (birimSorgu.data?.length ?? 0);
  const trigger = (
    <ChipButon
      icon={ShieldIcon}
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
  tamamlandi,
}: {
  bitis: Date | string | null;
  bitisKaydet: (yeni: Date | null) => void;
  tamamlandi: boolean;
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

  // ADR-0018 — bitiş geçmiş + tamamlanmamış: chip kırmızı + "Gecikti" preview.
  // SSR/hydration uyumu için `simdi` mount sonrası set edilir; ilk render
  // hydration uyumlu kalsın diye gecikmis hesabı simdi bağımlı.
  const gecikmis = React.useMemo(() => {
    if (tamamlandi) return false;
    if (simdi === null || !bitis) return false;
    const d = bitis instanceof Date ? bitis : new Date(bitis);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() < simdi;
  }, [bitis, simdi, tamamlandi]);

  return (
    <KartBitisPopover
      bitis={bitis}
      kaydet={bitisKaydet}
      trigger={
        <ChipButon
          icon={CalendarIcon}
          metin={metin}
          bosMu={!metin}
          aria-label={gecikmis ? "Bitiş tarihi geçti — Gecikti" : "Bitiş tarihi"}
          className={cn(
            gecikmis &&
              "text-red-700 bg-red-100 hover:bg-red-200 hover:text-red-900 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/60",
          )}
          onPreview={
            gecikmis ? (
              <span className="ml-0.5 rounded-sm bg-red-700 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-red-50">
                Gecikti
              </span>
            ) : (
              yaklasiyorMu && (
                <span
                  className="bg-amber-500 size-1.5 rounded-full"
                  aria-hidden
                />
              )
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
