"use client";

import {
  ArrowDown,
  ArrowRight,
  Calendar,
  Globe,
  Hash,
  Network,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMobil } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";
import { denetimIslemEtiketi } from "@/lib/constants/log";
import type { DenetimSatiri } from "../actions";

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Istanbul",
});

type Props = {
  kayit: DenetimSatiri | null;
  kapat: () => void;
};

type DiffSatiri = { alan: string; eski: unknown; yeni: unknown };

function jsonGoster(deger: unknown): string {
  if (deger === null || deger === undefined) return "—";
  if (typeof deger === "string") return deger;
  try {
    return JSON.stringify(deger, null, 2);
  } catch {
    return String(deger);
  }
}

function diffSatirlari(diff: unknown): DiffSatiri[] {
  if (!diff || typeof diff !== "object") return [];
  const sonuc: DiffSatiri[] = [];
  for (const [alan, deger] of Object.entries(diff as Record<string, unknown>)) {
    if (deger && typeof deger === "object" && "eski" in deger && "yeni" in deger) {
      const d = deger as { eski: unknown; yeni: unknown };
      sonuc.push({ alan, eski: d.eski, yeni: d.yeni });
    }
  }
  return sonuc;
}

function islemRengi(islem: string): "secondary" | "outline" | "destructive" {
  if (islem === "DELETE") return "destructive";
  if (islem === "CREATE") return "secondary";
  return "outline";
}

function MetaSatir({
  ikon: Ikon,
  etiket,
  deger,
}: {
  ikon: React.ComponentType<{ className?: string }>;
  etiket: string;
  deger: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 flex items-start gap-2.5 rounded-md border px-3 py-2">
      <Ikon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          {etiket}
        </p>
        <p className="break-words text-sm leading-tight">{deger}</p>
      </div>
    </div>
  );
}

function DegerKutusu({
  ton,
  icerik,
}: {
  ton: "eski" | "yeni";
  icerik: string;
}) {
  const eski = ton === "eski";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-md border",
        eski
          ? "border-destructive/25 bg-destructive/[0.03]"
          : "border-emerald-500/30 bg-emerald-500/[0.04]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-3 py-1.5 text-xs font-semibold",
          eski
            ? "border-destructive/20 bg-destructive/[0.06] text-destructive"
            : "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400",
        )}
      >
        <span className="font-mono text-base leading-none">
          {eski ? "−" : "+"}
        </span>
        <span>{eski ? "Eski" : "Yeni"}</span>
      </div>
      <pre className="bg-card/40 max-h-72 min-h-[2.5rem] overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[12.5px] leading-relaxed">
        {icerik || "—"}
      </pre>
    </div>
  );
}

function DiffKart({ satir }: { satir: DiffSatiri }) {
  const mobil = useMobil();
  const eski = jsonGoster(satir.eski);
  const yeni = jsonGoster(satir.yeni);

  return (
    <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
      <div className="bg-muted/40 flex items-center gap-2 border-b px-3 py-2">
        <Hash className="text-muted-foreground size-3.5 shrink-0" />
        <code className="font-mono text-xs font-semibold">{satir.alan}</code>
      </div>
      <div className="grid items-stretch gap-3 p-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-2">
        <DegerKutusu ton="eski" icerik={eski} />
        <div className="text-muted-foreground/60 flex items-center justify-center sm:px-1">
          {mobil ? (
            <ArrowDown className="size-4" />
          ) : (
            <ArrowRight className="size-4" />
          )}
        </div>
        <DegerKutusu ton="yeni" icerik={yeni} />
      </div>
    </div>
  );
}

function VeriBolum({ baslik, veri }: { baslik: string; veri: unknown }) {
  return (
    <details className="group bg-card overflow-hidden rounded-lg border [&_summary::-webkit-details-marker]:hidden">
      <summary className="hover:bg-muted/40 flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-colors">
        <span className="flex items-center gap-2">
          <span
            className="text-muted-foreground transition-transform group-open:rotate-90"
            aria-hidden
          >
            ▸
          </span>
          {baslik}
        </span>
        <span className="text-muted-foreground text-xs group-open:hidden">
          Göster
        </span>
        <span className="text-muted-foreground hidden text-xs group-open:inline">
          Gizle
        </span>
      </summary>
      <div className="border-t p-3">
        <pre className="bg-muted/40 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md p-3 font-mono text-xs leading-relaxed">
          {jsonGoster(veri)}
        </pre>
      </div>
    </details>
  );
}

function Baslik({ kayit }: { kayit: DenetimSatiri }) {
  return (
    <DialogHeader className="bg-muted/20 flex-shrink-0 space-y-3 border-b px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-semibold leading-tight">
          <Badge
            variant={islemRengi(kayit.islem)}
            className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
          >
            {denetimIslemEtiketi(kayit.islem)}
          </Badge>
          <span className="font-mono text-xs">{kayit.kaynak_tip}</span>
        </DialogTitle>
        {kayit.kaynak_etiket && (
          <p className="line-clamp-2 break-words text-base font-semibold">
            {kayit.kaynak_etiket}
          </p>
        )}
        <DialogDescription className="sr-only">
          Denetim kaydı detayları
        </DialogDescription>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetaSatir
          ikon={Calendar}
          etiket="Zaman"
          deger={
            <span className="font-mono text-xs">
              {TARIH_FORMAT.format(new Date(kayit.zaman))}
            </span>
          }
        />
        <MetaSatir
          ikon={User}
          etiket="Kullanıcı"
          deger={kayit.kullanici_ad ?? "Sistem"}
        />
        <MetaSatir
          ikon={Network}
          etiket="IP"
          deger={<span className="font-mono text-xs">{kayit.ip ?? "—"}</span>}
        />
        <MetaSatir
          ikon={Globe}
          etiket="HTTP"
          deger={
            <span className="font-mono text-xs">
              {[kayit.http_metod, kayit.http_yol].filter(Boolean).join(" ") ||
                "—"}
            </span>
          }
        />
      </div>
    </DialogHeader>
  );
}

function Govde({
  kayit,
  diffler,
}: {
  kayit: DenetimSatiri;
  diffler: DiffSatiri[];
}) {
  const tamVeriVar = Boolean(kayit.eski_veri) || Boolean(kayit.yeni_veri);
  const hicbirSeyYok =
    diffler.length === 0 && !kayit.eski_veri && !kayit.yeni_veri && !kayit.meta;

  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
      {diffler.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              Değişen Alanlar
              <Badge variant="outline" className="text-[10px]">
                {diffler.length}
              </Badge>
            </h3>
          </div>
          <div className="space-y-3">
            {diffler.map((d) => (
              <DiffKart key={d.alan} satir={d} />
            ))}
          </div>
        </section>
      )}

      {hicbirSeyYok && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Bu kayıt için ek detay yok.
        </p>
      )}

      {tamVeriVar && (
        <>
          {diffler.length > 0 && <Separator />}
          <section className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Tam Veri
            </h3>
            <div className="space-y-2">
              {Boolean(kayit.eski_veri) && (
                <VeriBolum baslik="Eski Veri" veri={kayit.eski_veri} />
              )}
              {Boolean(kayit.yeni_veri) && (
                <VeriBolum baslik="Yeni Veri" veri={kayit.yeni_veri} />
              )}
              {Boolean(kayit.meta) && (
                <VeriBolum baslik="Meta" veri={kayit.meta} />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export function DenetimDiffDiyalog({ kayit, kapat }: Props) {
  if (!kayit) return null;
  const diffler = diffSatirlari(kayit.diff);

  return (
    <Dialog open={!!kayit} onOpenChange={(o) => (o ? null : kapat())}>
      <DialogContent
        className={cn(
          "flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0",
          "w-[calc(100vw-1.5rem)]",
          "sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl",
        )}
      >
        <Baslik kayit={kayit} />
        <Govde kayit={kayit} diffler={diffler} />
      </DialogContent>
    </Dialog>
  );
}
