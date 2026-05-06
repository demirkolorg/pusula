"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEtiketDetay, useEtiketRealtime, useEtiketSil } from "../hooks";
import type { EtiketYetkileri } from "./etiket-listesi-istemci";
import { EtiketRozet } from "./etiket-rozet";
import { EtiketFormDialog } from "./etiket-form-dialog";
import { EtiketSilDiyalog } from "./etiket-sil-diyalog";

const TARIH_FORMATI = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

type Props = {
  projeId: string;
  etiketId: string;
  yetkiler: EtiketYetkileri;
};

export function EtiketDetayBaslik({ projeId, etiketId, yetkiler }: Props) {
  const router = useRouter();
  // Proje room'una katıl + etiket eventlerini dinle (silinince yönlendir)
  useEtiketRealtime(projeId);

  const sorgu = useEtiketDetay(etiketId);
  const sil = useEtiketSil(projeId);
  const [duzenleAcik, setDuzenleAcik] = React.useState(false);
  const [silAcik, setSilAcik] = React.useState(false);

  // Etiket başka sekmede silinmişse veya bu sekmede silindiyse listeye dön.
  React.useEffect(() => {
    if (sorgu.isError && !sorgu.isFetching) {
      router.replace(`/projeler/${projeId}/etiket`);
    }
  }, [sorgu.isError, sorgu.isFetching, router, projeId]);

  const veri = sorgu.data;

  if (sorgu.isLoading || !veri) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span
              className="size-6 shrink-0 rounded"
              style={{ backgroundColor: veri.renk }}
              aria-hidden
            />
            <h1 className="text-2xl font-semibold">{veri.ad}</h1>
            <EtiketRozet etiket={veri} boyut="sm" />
          </div>
          <p className="text-muted-foreground text-sm">
            {veri.kart_sayisi} karta atanmış · Oluşturuldu:{" "}
            {TARIH_FORMATI.format(new Date(veri.olusturma_zamani))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDuzenleAcik(true)}
            disabled={!yetkiler.duzenle}
          >
            <Pencil className="size-4" /> Düzenle
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSilAcik(true)}
            disabled={!yetkiler.sil}
          >
            <Trash2 className="text-destructive size-4" /> Sil
          </Button>
        </div>
      </div>

      <EtiketFormDialog
        acik={duzenleAcik}
        kapat={() => setDuzenleAcik(false)}
        projeId={projeId}
        duzenlenen={veri}
      />
      <EtiketSilDiyalog
        kayit={
          silAcik
            ? {
                id: veri.id,
                ad: veri.ad,
                renk: veri.renk,
                kart_sayisi: veri.kart_sayisi,
              }
            : null
        }
        kapat={() => setSilAcik(false)}
        onayla={(id) => {
          sil.mutate(
            { id },
            {
              onSuccess: () => {
                router.push(`/projeler/${projeId}/etiket`);
              },
            },
          );
          setSilAcik(false);
        }}
        yukleniyor={sil.isPending}
      />
    </>
  );
}
