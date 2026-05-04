"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import type { BirimKategorisi, BirimTipi } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptimisticMutation } from "@/lib/optimistic";
import { BIRIM_TIP_LABEL, birimGorunenAd } from "@/lib/constants/birim";
import { birimSecenekleriniGetir } from "../../../ayarlar/birimler/actions";
import {
  listeBirimEkleEylem,
  listeBirimKaldirEylem,
  listeBirimleriEylem,
  projeBirimEkleEylem,
  projeBirimKaldirEylem,
  projeBirimleriEylem,
} from "../actions";
import type { BirimPaylasimOzeti } from "../paylasim";

type Kaynak =
  | { tip: "proje"; id: string }
  | { tip: "liste"; id: string };

type BirimSecenegi = {
  id: string;
  ad: string | null;
  kategori: BirimKategorisi;
  tip: BirimTipi;
};

type Props = {
  kaynak: Kaynak;
  bosMetin?: string;
};

const HIC = "__yok__";

async function birimleriGetir(kaynak: Kaynak): Promise<BirimPaylasimOzeti[]> {
  const sonuc =
    kaynak.tip === "proje"
      ? await projeBirimleriEylem({ proje_id: kaynak.id })
      : await listeBirimleriEylem({ liste_id: kaynak.id });
  if (!sonuc.basarili) throw new Error(sonuc.hata);
  return sonuc.veri;
}

function ekleMutationFn(kaynak: Kaynak, birimId: string) {
  return kaynak.tip === "proje"
    ? projeBirimEkleEylem({ proje_id: kaynak.id, birim_id: birimId })
    : listeBirimEkleEylem({ liste_id: kaynak.id, birim_id: birimId });
}

function kaldirMutationFn(kaynak: Kaynak, birimId: string) {
  return kaynak.tip === "proje"
    ? projeBirimKaldirEylem({ proje_id: kaynak.id, birim_id: birimId })
    : listeBirimKaldirEylem({ liste_id: kaynak.id, birim_id: birimId });
}

export function BirimPaylasimListesi({
  kaynak,
  bosMetin = "Henüz birim yok.",
}: Props) {
  const kaynakTip = kaynak.tip;
  const kaynakId = kaynak.id;
  const anahtar = React.useMemo(
    () => ["paylasim-birimleri", kaynakTip, kaynakId] as const,
    [kaynakTip, kaynakId],
  );
  const [secili, setSecili] = React.useState("");

  const birimler = useQuery({
    queryKey: anahtar,
    queryFn: () => birimleriGetir(kaynak),
    staleTime: 30_000,
  });

  const secenekler = useQuery({
    queryKey: ["birim-secenekleri"],
    queryFn: async (): Promise<BirimSecenegi[]> => {
      const sonuc = await birimSecenekleriniGetir(undefined);
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    staleTime: 60_000,
  });

  const ekle = useOptimisticMutation<
    { birim_id: string },
    { birim_id: string }
  >({
    queryKey: anahtar,
    mutationFn: async ({ birim_id }) => {
      const sonuc = await ekleMutationFn(kaynak, birim_id);
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return { birim_id };
    },
    optimistic: (eski, vars) => {
      const liste = (eski as BirimPaylasimOzeti[] | undefined) ?? [];
      if (liste.some((birim) => birim.birim_id === vars.birim_id)) return liste;
      const secenek = (secenekler.data ?? []).find(
        (birim) => birim.id === vars.birim_id,
      );
      if (!secenek) return liste;
      return [
        ...liste,
        {
          birim_id: secenek.id,
          ad: secenek.ad,
          tip: secenek.tip,
          eklenme_zamani: new Date(),
        },
      ];
    },
    hataMesaji: "Birim eklenemedi",
  });

  const kaldir = useOptimisticMutation<
    { birim_id: string },
    { birim_id: string }
  >({
    queryKey: anahtar,
    mutationFn: async ({ birim_id }) => {
      const sonuc = await kaldirMutationFn(kaynak, birim_id);
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return { birim_id };
    },
    optimistic: (eski, vars) => {
      const liste = (eski as BirimPaylasimOzeti[] | undefined) ?? [];
      return liste.filter((birim) => birim.birim_id !== vars.birim_id);
    },
    hataMesaji: "Birim kaldırılamadı",
  });

  const seciliBirimler = birimler.data ?? [];
  const seciliSet = new Set(seciliBirimler.map((birim) => birim.birim_id));
  const eklenebilirler = (secenekler.data ?? []).filter(
    (birim) => !seciliSet.has(birim.id),
  );

  const seciliEkle = () => {
    if (!secili) return;
    ekle.mutate({ birim_id: secili });
    setSecili("");
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1">
        {birimler.isLoading ? (
          <span className="text-muted-foreground text-xs">Yükleniyor...</span>
        ) : seciliBirimler.length === 0 ? (
          <span className="text-muted-foreground text-xs">{bosMetin}</span>
        ) : (
          seciliBirimler.map((birim) => (
            <Badge
              key={birim.birim_id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{birimGorunenAd({ ad: birim.ad, tip: birim.tip })}</span>
              <span className="text-muted-foreground text-xs">
                {BIRIM_TIP_LABEL[birim.tip]}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="size-5 p-0"
                onClick={() => kaldir.mutate({ birim_id: birim.birim_id })}
                aria-label={`${birimGorunenAd({
                  ad: birim.ad,
                  tip: birim.tip,
                })} kaldır`}
              >
                <XIcon className="size-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={secili || HIC}
          onValueChange={(deger) =>
            setSecili(!deger || deger === HIC ? "" : deger)
          }
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Birim ekle..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={HIC}>Seçim yok</SelectItem>
            {eklenebilirler.map((birim) => (
              <SelectItem key={birim.id} value={birim.id}>
                {birimGorunenAd({ ad: birim.ad, tip: birim.tip })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={seciliEkle}
          disabled={!secili}
        >
          <PlusIcon className="size-4" /> Ekle
        </Button>
      </div>
    </div>
  );
}
