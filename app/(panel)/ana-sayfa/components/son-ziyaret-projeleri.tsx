import Link from "next/link";
import { DynamicIcon } from "lucide-react/dynamic";
import { Folder, History, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kapakArkaplanSinifi, kapakUstuMetinSinifi } from "@/lib/kapak-renk";
import { ikonNormalize } from "@/lib/kapak-ikon";
import { cn } from "@/lib/utils";
import type { SonZiyaretProjeSatiri } from "../schemas";

export function SonZiyaretProjeleri({
  projeler,
}: {
  projeler: readonly SonZiyaretProjeSatiri[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" />
          Son Ziyaret Edilen
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {projeler.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center text-sm">
            Henüz ziyaret edilen proje yok.
          </div>
        ) : (
          <ul className="divide-y">
            {projeler.map((p) => {
              const ikonAdi = ikonNormalize(p.kapak_ikon);
              return (
                <li key={p.proje_id}>
                  <Link
                    href={`/projeler/${p.proje_id}`}
                    className="hover:bg-muted/50 flex items-center gap-3 p-3 transition-colors"
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        p.kapak_renk
                          ? cn(
                              kapakArkaplanSinifi(p.kapak_renk),
                              kapakUstuMetinSinifi(p.kapak_renk),
                            )
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {ikonAdi ? (
                        <DynamicIcon name={ikonAdi} className="size-4" />
                      ) : (
                        <Folder className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {p.ad}
                    </span>
                    {p.yildizli_mi ? (
                      <Star className="text-palet-amber size-4 shrink-0 fill-current" />
                    ) : null}
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
