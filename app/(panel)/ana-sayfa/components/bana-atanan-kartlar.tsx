import Link from "next/link";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Folder, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kapakArkaplanSinifi, kapakUstuMetinSinifi } from "@/lib/kapak-renk";
import { cn } from "@/lib/utils";
import { ikonNormalize } from "@/lib/kapak-ikon";
import type { BenimKartSatirim } from "../schemas";

const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

const RELATIVE = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

// Bitiş tarihini "yarın", "3 gün gecikti", "12 May" gibi okunur metne çevir.
function bitisMetni(bitis: Date | null): { metin: string; gecikti: boolean } | null {
  if (!bitis) return null;
  const simdi = Date.now();
  const farkMs = new Date(bitis).getTime() - simdi;
  const farkGun = Math.round(farkMs / 86_400_000);

  if (farkGun < 0) {
    return {
      metin: RELATIVE.format(farkGun, "day"),
      gecikti: true,
    };
  }
  if (farkGun <= 7) {
    return { metin: RELATIVE.format(farkGun, "day"), gecikti: false };
  }
  return { metin: TARIH_KISA.format(bitis), gecikti: false };
}

function ProjeRozeti({
  ad,
  kapak_renk,
  kapak_ikon,
}: {
  ad: string;
  kapak_renk: string | null;
  kapak_ikon: string | null;
}) {
  const ikonAdi = ikonNormalize(kapak_ikon);
  return (
    <span
      className={cn(
        "inline-flex max-w-[180px] items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs",
        kapak_renk
          ? cn(kapakArkaplanSinifi(kapak_renk), kapakUstuMetinSinifi(kapak_renk))
          : "bg-muted text-muted-foreground",
      )}
    >
      {ikonAdi ? (
        <DynamicIcon name={ikonAdi} className="size-3 shrink-0" />
      ) : (
        <Folder className="size-3 shrink-0" />
      )}
      <span className="truncate">{ad}</span>
    </span>
  );
}

export function BanaAtananKartlar({
  kartlar,
}: {
  kartlar: readonly BenimKartSatirim[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Bana Atanan Kartlar</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {kartlar.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center text-sm">
            Sana atanmış açık kart yok.
          </div>
        ) : (
          <ul className="divide-y">
            {kartlar.map((k) => {
              const bitis = bitisMetni(k.bitis);
              return (
                <li key={k.id}>
                  <Link
                    href={`/projeler/${k.liste.proje.id}?kart=${k.id}`}
                    className="hover:bg-muted/50 flex items-start gap-3 p-3 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {bitis?.gecikti ? (
                        <AlertTriangle className="text-palet-kirmizi size-4" />
                      ) : (
                        <Clock className="text-muted-foreground size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium">
                        {k.baslik}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <ProjeRozeti
                          ad={k.liste.proje.ad}
                          kapak_renk={k.liste.proje.kapak_renk}
                          kapak_ikon={k.liste.proje.kapak_ikon}
                        />
                        <span className="text-muted-foreground text-xs">
                          {k.liste.ad}
                        </span>
                        {bitis ? (
                          <Badge
                            variant={bitis.gecikti ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {bitis.metin}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
