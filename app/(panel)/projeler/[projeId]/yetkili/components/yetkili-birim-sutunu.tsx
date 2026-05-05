"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2Icon, PlusIcon, XIcon } from "lucide-react";
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
import { birimSecenekleriniGetir } from "../../../../ayarlar/birimler/actions";
import {
  birimAdaptor,
  extraBirimKeys,
} from "../yetkili-adaptor";
import {
  optimistikBirimEkle,
  optimistikBirimKaldir,
} from "../yetkili-optimistic";
import {
  birimAciklamasi,
  type YetkiliBirimOzeti,
  type YetkiliBirimSecenegi,
  type YetkiliKaynagi,
} from "../yetkili-tipler";

type Props = {
  kaynak: YetkiliKaynagi;
};

const HIC = "__yok__";
const BIRIM_SECENEK_KEY = ["birim-secenekleri"] as const;

export function YetkiliBirimSutunu({ kaynak }: Props) {
  const adaptor = React.useMemo(() => birimAdaptor(kaynak), [kaynak]);
  const yonetebilir = kaynak.izinler.birimYonet;
  const [secili, setSecili] = React.useState("");

  const birimler = useQuery({
    queryKey: adaptor.queryKey,
    queryFn: adaptor.listele,
    staleTime: 30_000,
  });

  const secenekler = useQuery({
    queryKey: BIRIM_SECENEK_KEY,
    queryFn: async (): Promise<YetkiliBirimSecenegi[]> => {
      const r = await birimSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
    enabled: yonetebilir,
  });

  const ekKeys = React.useMemo(() => extraBirimKeys(kaynak), [kaynak]);

  const ekle = useOptimisticMutation<
    { birim_id: string },
    { birim_id: string }
  >({
    queryKey: adaptor.queryKey,
    mutationFn: ({ birim_id }) => adaptor.ekle(birim_id),
    optimistic: (eski, vars) => {
      const secenek = (secenekler.data ?? []).find(
        (b) => b.id === vars.birim_id,
      );
      if (!secenek) return (eski as YetkiliBirimOzeti[] | undefined) ?? [];
      return optimistikBirimEkle(eski as YetkiliBirimOzeti[] | undefined, {
        id: secenek.id,
        ad: secenek.ad,
        tip: secenek.tip,
      });
    },
    ekInvalidate: ekKeys,
    hataMesaji: "Birim yetkisi verilemedi",
  });

  const kaldir = useOptimisticMutation<
    { birim_id: string },
    { birim_id: string }
  >({
    queryKey: adaptor.queryKey,
    mutationFn: ({ birim_id }) => adaptor.kaldir(birim_id),
    optimistic: (eski, vars) =>
      optimistikBirimKaldir(
        eski as YetkiliBirimOzeti[] | undefined,
        vars.birim_id,
      ),
    ekInvalidate: ekKeys,
    hataMesaji: "Birim yetkisi kaldırılamadı",
  });

  const mevcutlar = birimler.data ?? [];
  const mevcutSet = new Set(mevcutlar.map((b) => b.birim_id));
  const eklenebilirler = (secenekler.data ?? []).filter(
    (b) => !mevcutSet.has(b.id),
  );

  const seciliEkle = () => {
    if (!secili) return;
    ekle.mutate({ birim_id: secili });
    setSecili("");
  };

  const yukleniyor = birimler.isLoading;
  const adetMetni = yukleniyor ? "..." : mevcutlar.length;

  return (
    <section className="grid gap-3">
      <header className="grid gap-1">
        <div className="flex items-center gap-1.5">
          <Building2Icon className="size-3.5" />
          <h3 className="text-sm font-medium">Birimler</h3>
        </div>
        <p className="text-muted-foreground text-[11px]">
          {birimAciklamasi(kaynak)}
        </p>
      </header>

      <div>
        <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
          <span>Yetkili birimler</span>
          <span className="bg-muted text-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
            {adetMetni}
          </span>
        </div>
        {yukleniyor ? (
          <p className="text-muted-foreground text-xs">Yükleniyor...</p>
        ) : mevcutlar.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">
            Henüz birim yetkisi verilmemiş.
          </p>
        ) : (
          <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto">
            {mevcutlar.map((birim) => {
              const ad = birimGorunenAd({ ad: birim.ad, tip: birim.tip });
              return (
                <li
                  key={birim.birim_id}
                  className="bg-muted/40 hover:bg-muted/70 group flex items-center gap-2 rounded px-2 py-1.5"
                >
                  <span
                    className="bg-background flex size-7 shrink-0 items-center justify-center rounded"
                    aria-hidden
                  >
                    <Building2Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{ad}</p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {BIRIM_TIP_LABEL[birim.tip]}
                    </p>
                  </div>
                  {yonetebilir ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="size-6 opacity-60 group-hover:opacity-100"
                      onClick={() =>
                        kaldir.mutate({ birim_id: birim.birim_id })
                      }
                      aria-label={`${ad} yetkisini kaldır`}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {yonetebilir ? (
        <div className="bg-muted/20 rounded-md border border-dashed p-2">
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide">
            <PlusIcon className="size-3" />
            <span>Birim yetkisi ekle</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={secili || HIC}
              onValueChange={(deger) =>
                setSecili(!deger || deger === HIC ? "" : deger)
              }
            >
              <SelectTrigger className="bg-background h-8 flex-1">
                <SelectValue placeholder="Birim seçin..." />
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
          {eklenebilirler.length === 0 && !secenekler.isLoading ? (
            <p className="text-muted-foreground mt-1.5 text-[11px]">
              Eklenebilecek birim kalmadı.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
