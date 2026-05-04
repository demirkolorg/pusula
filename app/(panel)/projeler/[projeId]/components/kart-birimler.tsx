"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import type { BirimTipi } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptimisticMutation, eylemMutasyonu } from "@/lib/optimistic";
import { BIRIM_TIP_LABEL, birimGorunenAd } from "@/lib/constants/birim";
import { birimSecenekleriniGetir } from "../../../ayarlar/birimler/actions";
import {
  kartBirimEkleEylem,
  kartBirimKaldirEylem,
  kartBirimleriEylem,
} from "../actions";
import { kartAktiviteleriKey } from "../aktivite/keys";

type Hedef = {
  birim_id: string;
  ad: string | null;
  tip: BirimTipi;
  eklenme_zamani: Date | string;
};

type Props = {
  kartId: string;
  // "tam" — Label ve açıklama göster (sol kolon kullanımı, geriye dönük varsayılan).
  // "kompakt" — başlık/açıklama gizli, popover içine yerleşmek için.
  gosterimMod?: "tam" | "kompakt";
};

const HIC = "__yok__";

export function KartBirimler({ kartId, gosterimMod = "tam" }: Props) {
  const queryKey = React.useMemo(
    () => ["kart-birimler", kartId] as const,
    [kartId],
  );

  const sorgu = useQuery({
    queryKey,
    queryFn: async (): Promise<Hedef[]> => {
      const r = await kartBirimleriEylem({ kart_id: kartId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });

  const birimSorgu = useQuery({
    queryKey: ["birim-secenekleri"],
    queryFn: async () => {
      const r = await birimSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });

  const [secili, setSecili] = React.useState<string>("");

  const ekleMut = useOptimisticMutation<
    { kart_id: string; birim_id: string },
    { kart_id: string; birim_id: string }
  >({
    queryKey,
    mutationFn: eylemMutasyonu(kartBirimEkleEylem),
    optimistic: (eski, vars) => {
      const v = (eski ?? []) as Hedef[];
      if (v.some((h) => h.birim_id === vars.birim_id)) return v;
      const k = (birimSorgu.data ?? []).find(
        (x) => x.id === vars.birim_id,
      );
      if (!k) return v;
      return [
        ...v,
        {
          birim_id: k.id,
          ad: k.ad,
          tip: k.tip,
          eklenme_zamani: new Date(),
        },
      ];
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Hedef birim eklenemedi",
  });

  const kaldirMut = useOptimisticMutation<
    { kart_id: string; birim_id: string },
    { kart_id: string; birim_id: string }
  >({
    queryKey,
    mutationFn: eylemMutasyonu(kartBirimKaldirEylem),
    optimistic: (eski, vars) => {
      const v = (eski ?? []) as Hedef[];
      return v.filter((h) => h.birim_id !== vars.birim_id);
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Hedef birim kaldırılamadı",
  });

  const ekle = () => {
    if (!secili) return;
    ekleMut.mutate({ kart_id: kartId, birim_id: secili });
    setSecili("");
  };

  const hedefler = sorgu.data ?? [];
  const hedefIdleri = new Set(hedefler.map((h) => h.birim_id));
  // Henüz eklenmemiş birimler
  const eklenebilirler = (birimSorgu.data ?? []).filter(
    (k) => !hedefIdleri.has(k.id),
  );

  return (
    <div className="grid gap-2">
      {gosterimMod === "tam" && (
        <>
          <Label>Birimler</Label>
          <p className="text-muted-foreground text-xs">
            Görevin yönlendirildiği ilçe birimlerı. Eklediğiniz birim
            çalışanları bu görevi kendi panellerinde görür.
          </p>
        </>
      )}

      <div className="flex flex-wrap gap-1">
        {hedefler.length === 0 ? (
          <span className="text-muted-foreground text-xs">
            Henüz birim yok.
          </span>
        ) : (
          hedefler.map((h) => (
            <Badge
              key={h.birim_id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{birimGorunenAd({ ad: h.ad, tip: h.tip })}</span>
              <span className="text-muted-foreground text-xs">
                · {BIRIM_TIP_LABEL[h.tip]}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="size-5 p-0"
                onClick={() =>
                  kaldirMut.mutate({
                    kart_id: kartId,
                    birim_id: h.birim_id,
                  })
                }
                aria-label={`${birimGorunenAd({ ad: h.ad, tip: h.tip })} kaldır`}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={secili || HIC}
          onValueChange={(v) => setSecili(v === HIC || !v ? "" : v)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue>
              {(v) => {
                if (!v || v === HIC) return "Birim ekle...";
                const k = eklenebilirler.find((x) => x.id === v);
                return k
                  ? birimGorunenAd({ ad: k.ad, tip: k.tip })
                  : "Birim ekle...";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={HIC}>—</SelectItem>
            {eklenebilirler.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {birimGorunenAd({ ad: k.ad, tip: k.tip })}
                {k.ad && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {BIRIM_TIP_LABEL[k.tip]}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={ekle}
          disabled={!secili}
          aria-label="Hedef birim ekle"
        >
          <Plus className="size-4" /> Ekle
        </Button>
      </div>
    </div>
  );
}
