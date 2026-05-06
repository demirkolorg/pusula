"use client";

import * as React from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  FileWarning,
  Globe,
  Hash,
  Loader2,
  Network,
  TerminalSquare,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  hataSeviyeEtiketi,
  hataTarafEtiketi,
} from "@/lib/constants/log";
import type { HataSatiri } from "../actions";

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Istanbul",
});

function jsonGoster(deger: unknown): string {
  if (deger === null || deger === undefined) return "—";
  if (typeof deger === "string") return deger;
  try {
    return JSON.stringify(deger, null, 2);
  } catch {
    return String(deger);
  }
}

function seviyeRengi(
  seviye: string,
): "destructive" | "secondary" | "outline" {
  if (seviye === "FATAL" || seviye === "ERROR") return "destructive";
  if (seviye === "WARN") return "secondary";
  return "outline";
}

type Props = {
  kayit: HataSatiri | null;
  kapat: () => void;
  cozumIsaretle: (not?: string) => void;
  yukleniyor?: boolean;
};

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

function VeriBolum({
  baslik,
  veri,
  varsayilanAcik = false,
}: {
  baslik: string;
  veri: unknown;
  varsayilanAcik?: boolean;
}) {
  return (
    <details
      open={varsayilanAcik}
      className="group bg-card overflow-hidden rounded-lg border [&_summary::-webkit-details-marker]:hidden"
    >
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

function StackBolum({ stack }: { stack: string }) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
      <div className="bg-muted/40 flex items-center gap-2 border-b px-3 py-2">
        <TerminalSquare className="text-muted-foreground size-3.5 shrink-0" />
        <span className="text-xs font-semibold">Stack Trace</span>
      </div>
      <pre className="bg-card/40 max-h-96 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[12.5px] leading-relaxed">
        {stack}
      </pre>
    </div>
  );
}

function Baslik({ kayit }: { kayit: HataSatiri }) {
  const httpYolu = [kayit.http_metod, kayit.url].filter(Boolean).join(" ");
  return (
    <DialogHeader className="bg-muted/20 flex-shrink-0 space-y-3 border-b px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-semibold leading-tight">
          <Badge
            variant={seviyeRengi(kayit.seviye)}
            className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
          >
            {hataSeviyeEtiketi(kayit.seviye)}
          </Badge>
          <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
            {hataTarafEtiketi(kayit.taraf)}
          </Badge>
          {kayit.hata_tipi && (
            <span className="font-mono text-xs">{kayit.hata_tipi}</span>
          )}
          {kayit.cozuldu_mu && (
            <Badge
              variant="secondary"
              className="border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400"
            >
              Çözüldü
            </Badge>
          )}
        </DialogTitle>
        <p className="line-clamp-3 break-words text-base font-semibold">
          {kayit.mesaj}
        </p>
        <DialogDescription className="sr-only">
          Hata kaydı detayları
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
          deger={kayit.kullanici_ad ?? "—"}
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
              {httpYolu ||
                (kayit.http_durum ? String(kayit.http_durum) : "—")}
              {httpYolu && kayit.http_durum ? ` · ${kayit.http_durum}` : ""}
            </span>
          }
        />
      </div>

      {kayit.request_id && (
        <div className="bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-1.5">
          <Hash className="text-muted-foreground size-3.5 shrink-0" />
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
            Request ID
          </span>
          <code className="ml-auto truncate font-mono text-xs">
            {kayit.request_id}
          </code>
        </div>
      )}
    </DialogHeader>
  );
}

function Govde({
  kayit,
  not,
  setNot,
}: {
  kayit: HataSatiri;
  not: string;
  setNot: (deger: string) => void;
}) {
  const ekVeriVar =
    Boolean(kayit.istek_govdesi) ||
    Boolean(kayit.istek_basliklari) ||
    Boolean(kayit.ekstra) ||
    Boolean(kayit.user_agent);

  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
      {kayit.stack ? (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4" />
            Hata İzi
          </h3>
          <StackBolum stack={kayit.stack} />
        </section>
      ) : (
        <p className="bg-muted/30 text-muted-foreground rounded-md border px-3 py-2 text-xs">
          Bu kayıt için stack trace bulunmuyor.
        </p>
      )}

      {ekVeriVar && (
        <>
          <Separator />
          <section className="space-y-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <FileWarning className="size-3.5" />
              Bağlam
            </h3>
            <div className="space-y-2">
              {Boolean(kayit.istek_govdesi) && (
                <VeriBolum
                  baslik="İstek Gövdesi"
                  veri={kayit.istek_govdesi}
                />
              )}
              {Boolean(kayit.istek_basliklari) && (
                <VeriBolum
                  baslik="İstek Başlıkları"
                  veri={kayit.istek_basliklari}
                />
              )}
              {Boolean(kayit.ekstra) && (
                <VeriBolum baslik="Ekstra Bağlam" veri={kayit.ekstra} />
              )}
              {Boolean(kayit.user_agent) && (
                <VeriBolum baslik="User Agent" veri={kayit.user_agent} />
              )}
            </div>
          </section>
        </>
      )}

      <Separator />

      <section className="space-y-2">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Çözüm
        </h3>
        <div className="bg-card flex flex-col gap-2 rounded-lg border p-3">
          <Label htmlFor="cozum_notu" className="text-sm font-medium">
            Çözüm Notu
          </Label>
          <Textarea
            id="cozum_notu"
            rows={3}
            placeholder="Hatayı nasıl çözdünüz? Bağlantılı PR/issue?"
            value={not}
            onChange={(e) => setNot(e.target.value)}
            disabled={kayit.cozuldu_mu}
          />
          {kayit.cozuldu_mu && (
            <p className="text-muted-foreground text-xs">
              Bu hata zaten çözüldü olarak işaretlendi.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export function HataDetayDiyalog({
  kayit,
  kapat,
  cozumIsaretle,
  yukleniyor,
}: Props) {
  const [not, setNot] = React.useState("");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNot(kayit?.cozum_notu ?? "");
  }, [kayit]);

  if (!kayit) return null;

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
        <Govde kayit={kayit} not={not} setNot={setNot} />
        <DialogFooter className="bg-muted/20 flex-shrink-0 border-t px-5 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={kapat}>
            Kapat
          </Button>
          {!kayit.cozuldu_mu && (
            <Button
              type="button"
              onClick={() => cozumIsaretle(not || undefined)}
              disabled={yukleniyor}
            >
              {yukleniyor ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Kaydediliyor
                </>
              ) : (
                <>
                  <Check className="size-4" /> Çözüldü İşaretle
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
