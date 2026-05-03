"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
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
import type { HataSatiri } from "../actions";

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Istanbul",
});

function jsonGoster(deger: unknown): string {
  if (deger === null || deger === undefined) return "—";
  try {
    return JSON.stringify(deger, null, 2);
  } catch {
    return String(deger);
  }
}

type Props = {
  kayit: HataSatiri | null;
  kapat: () => void;
  cozumIsaretle: (not?: string) => void;
  yukleniyor?: boolean;
};

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
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge>{kayit.seviye}</Badge>
            <Badge variant="outline">{kayit.taraf}</Badge>
            <span className="line-clamp-1 text-sm font-normal">
              {kayit.mesaj}
            </span>
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">
              {TARIH_FORMAT.format(new Date(kayit.zaman))} ·{" "}
              {kayit.kullanici_ad ?? "—"}
            </span>
            <span className="text-muted-foreground block font-mono text-xs">
              {kayit.http_metod ? `${kayit.http_metod} ` : ""}
              {kayit.url ?? ""} · IP: {kayit.ip ?? "—"} · req:{" "}
              {kayit.request_id ?? "—"}
            </span>
          </DialogDescription>
        </DialogHeader>

        {kayit.stack && (
          <details open className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Stack Trace
            </summary>
            <pre className="bg-muted/40 mt-2 max-h-72 overflow-auto rounded p-2 text-xs">
              {kayit.stack}
            </pre>
          </details>
        )}

        {Boolean(kayit.istek_govdesi) && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              İstek Gövdesi
            </summary>
            <pre className="bg-muted/40 mt-2 max-h-48 overflow-auto rounded p-2 text-xs">
              {jsonGoster(kayit.istek_govdesi)}
            </pre>
          </details>
        )}

        {Boolean(kayit.istek_basliklari) && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              İstek Başlıkları
            </summary>
            <pre className="bg-muted/40 mt-2 max-h-48 overflow-auto rounded p-2 text-xs">
              {jsonGoster(kayit.istek_basliklari)}
            </pre>
          </details>
        )}

        {Boolean(kayit.ekstra) && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Ekstra Bağlam
            </summary>
            <pre className="bg-muted/40 mt-2 max-h-48 overflow-auto rounded p-2 text-xs">
              {jsonGoster(kayit.ekstra)}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <Label htmlFor="cozum_notu">Çözüm Notu</Label>
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

        <DialogFooter>
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
