"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

function jsonGoster(deger: unknown): string {
  if (deger === null || deger === undefined) return "—";
  try {
    return JSON.stringify(deger, null, 2);
  } catch {
    return String(deger);
  }
}

function diffSatirlari(diff: unknown): { alan: string; eski: unknown; yeni: unknown }[] {
  if (!diff || typeof diff !== "object") return [];
  const sonuc: { alan: string; eski: unknown; yeni: unknown }[] = [];
  for (const [alan, deger] of Object.entries(diff as Record<string, unknown>)) {
    if (deger && typeof deger === "object" && "eski" in deger && "yeni" in deger) {
      const d = deger as { eski: unknown; yeni: unknown };
      sonuc.push({ alan, eski: d.eski, yeni: d.yeni });
    }
  }
  return sonuc;
}

export function DenetimDiffDiyalog({ kayit, kapat }: Props) {
  if (!kayit) return null;
  const diffler = diffSatirlari(kayit.diff);

  return (
    <Dialog open={!!kayit} onOpenChange={(o) => (o ? null : kapat())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge>{kayit.islem}</Badge>
            <span>{kayit.kaynak_tip}</span>
            {kayit.kaynak_id && (
              <span className="text-muted-foreground font-mono text-xs">
                {kayit.kaynak_id}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">
              {TARIH_FORMAT.format(new Date(kayit.zaman))} ·{" "}
              {kayit.kullanici_ad ?? "Sistem"}
            </span>
            <span className="text-muted-foreground block font-mono text-xs">
              {kayit.http_metod} {kayit.http_yol} · IP: {kayit.ip ?? "—"} ·
              req: {kayit.request_id ?? "—"}
            </span>
          </DialogDescription>
        </DialogHeader>

        {diffler.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Değişen Alanlar</h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Alan</th>
                    <th className="px-3 py-2 text-left">Eski</th>
                    <th className="px-3 py-2 text-left">Yeni</th>
                  </tr>
                </thead>
                <tbody>
                  {diffler.map((d) => (
                    <tr key={d.alan} className="border-t align-top">
                      <td className="px-3 py-2 font-mono text-xs">{d.alan}</td>
                      <td className="px-3 py-2">
                        <pre className="text-destructive whitespace-pre-wrap break-all text-xs">
                          {jsonGoster(d.eski)}
                        </pre>
                      </td>
                      <td className="px-3 py-2">
                        <pre className="text-primary whitespace-pre-wrap break-all text-xs">
                          {jsonGoster(d.yeni)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Eski Veri (tam)
          </summary>
          <pre className="bg-muted/40 mt-2 max-h-72 overflow-auto rounded p-2 text-xs">
            {jsonGoster(kayit.eski_veri)}
          </pre>
        </details>

        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Yeni Veri (tam)
          </summary>
          <pre className="bg-muted/40 mt-2 max-h-72 overflow-auto rounded p-2 text-xs">
            {jsonGoster(kayit.yeni_veri)}
          </pre>
        </details>

        {Boolean(kayit.meta) && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">Meta</summary>
            <pre className="bg-muted/40 mt-2 max-h-48 overflow-auto rounded p-2 text-xs">
              {jsonGoster(kayit.meta)}
            </pre>
          </details>
        )}
      </DialogContent>
    </Dialog>
  );
}
