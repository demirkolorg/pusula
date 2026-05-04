"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import type { KurumTipi } from "@prisma/client";
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
import { KURUM_TIP_LABEL, kurumGorunenAd } from "@/lib/constants/kurum";
import { kurumSecenekleriniGetir } from "../../../ayarlar/kurumlar/actions";
import {
  kartHedefKurumEkleEylem,
  kartHedefKurumKaldirEylem,
  kartHedefKurumlariEylem,
} from "../actions";
import { kartAktiviteleriKey } from "../aktivite/keys";

type Hedef = {
  kurum_id: string;
  ad: string | null;
  tip: KurumTipi;
  eklenme_zamani: Date | string;
};

type Props = {
  kartId: string;
  // "tam" — Label ve açıklama göster (sol kolon kullanımı, geriye dönük varsayılan).
  // "kompakt" — başlık/açıklama gizli, popover içine yerleşmek için.
  gosterimMod?: "tam" | "kompakt";
};

const HIC = "__yok__";

export function KartHedefKurumlar({ kartId, gosterimMod = "tam" }: Props) {
  const queryKey = React.useMemo(
    () => ["kart-hedef-kurumlar", kartId] as const,
    [kartId],
  );

  const sorgu = useQuery({
    queryKey,
    queryFn: async (): Promise<Hedef[]> => {
      const r = await kartHedefKurumlariEylem({ kart_id: kartId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });

  const kurumSorgu = useQuery({
    queryKey: ["kurum-secenekleri"],
    queryFn: async () => {
      const r = await kurumSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
  });

  const [secili, setSecili] = React.useState<string>("");

  const ekleMut = useOptimisticMutation<
    { kart_id: string; hedef_kurum_id: string },
    { kart_id: string; hedef_kurum_id: string }
  >({
    queryKey,
    mutationFn: eylemMutasyonu(kartHedefKurumEkleEylem),
    optimistic: (eski, vars) => {
      const v = (eski ?? []) as Hedef[];
      if (v.some((h) => h.kurum_id === vars.hedef_kurum_id)) return v;
      const k = (kurumSorgu.data ?? []).find(
        (x) => x.id === vars.hedef_kurum_id,
      );
      if (!k) return v;
      return [
        ...v,
        {
          kurum_id: k.id,
          ad: k.ad,
          tip: k.tip,
          eklenme_zamani: new Date(),
        },
      ];
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Hedef kurum eklenemedi",
  });

  const kaldirMut = useOptimisticMutation<
    { kart_id: string; hedef_kurum_id: string },
    { kart_id: string; hedef_kurum_id: string }
  >({
    queryKey,
    mutationFn: eylemMutasyonu(kartHedefKurumKaldirEylem),
    optimistic: (eski, vars) => {
      const v = (eski ?? []) as Hedef[];
      return v.filter((h) => h.kurum_id !== vars.hedef_kurum_id);
    },
    ekInvalidate: [kartAktiviteleriKey(kartId)],
    hataMesaji: "Hedef kurum kaldırılamadı",
  });

  const ekle = () => {
    if (!secili) return;
    ekleMut.mutate({ kart_id: kartId, hedef_kurum_id: secili });
    setSecili("");
  };

  const hedefler = sorgu.data ?? [];
  const hedefIdleri = new Set(hedefler.map((h) => h.kurum_id));
  // Henüz eklenmemiş kurumlar
  const eklenebilirler = (kurumSorgu.data ?? []).filter(
    (k) => !hedefIdleri.has(k.id),
  );

  return (
    <div className="grid gap-2">
      {gosterimMod === "tam" && (
        <>
          <Label>Hedef Kurumlar</Label>
          <p className="text-muted-foreground text-xs">
            Görevin yönlendirildiği ilçe kurumları. Eklediğiniz kurum
            çalışanları bu görevi kendi panellerinde görür.
          </p>
        </>
      )}

      <div className="flex flex-wrap gap-1">
        {hedefler.length === 0 ? (
          <span className="text-muted-foreground text-xs">
            Henüz hedef kurum yok.
          </span>
        ) : (
          hedefler.map((h) => (
            <Badge
              key={h.kurum_id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{kurumGorunenAd({ ad: h.ad, tip: h.tip })}</span>
              <span className="text-muted-foreground text-xs">
                · {KURUM_TIP_LABEL[h.tip]}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="size-5 p-0"
                onClick={() =>
                  kaldirMut.mutate({
                    kart_id: kartId,
                    hedef_kurum_id: h.kurum_id,
                  })
                }
                aria-label={`${kurumGorunenAd({ ad: h.ad, tip: h.tip })} kaldır`}
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
                if (!v || v === HIC) return "Kurum ekle...";
                const k = eklenebilirler.find((x) => x.id === v);
                return k
                  ? kurumGorunenAd({ ad: k.ad, tip: k.tip })
                  : "Kurum ekle...";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={HIC}>—</SelectItem>
            {eklenebilirler.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {kurumGorunenAd({ ad: k.ad, tip: k.tip })}
                {k.ad && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {KURUM_TIP_LABEL[k.tip]}
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
          aria-label="Hedef kurum ekle"
        >
          <Plus className="size-4" /> Ekle
        </Button>
      </div>
    </div>
  );
}
