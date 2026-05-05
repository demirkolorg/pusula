"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2Icon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOptimisticMutation } from "@/lib/optimistic";
import { BIRIM_TIP_LABEL, birimGorunenAd } from "@/lib/constants/birim";
import { birimAdaptor, extraBirimKeys } from "../yetkili-adaptor";
import { optimistikBirimKaldir } from "../yetkili-optimistic";
import {
  birimAciklamasi,
  type YetkiliBirimOzeti,
  type YetkiliKaynagi,
} from "../yetkili-tipler";
import { YetkiliBirimEkleDialog } from "./yetkili-birim-ekle-dialog";

type Props = {
  kaynak: YetkiliKaynagi;
};

export function YetkiliBirimSutunu({ kaynak }: Props) {
  const adaptor = React.useMemo(() => birimAdaptor(kaynak), [kaynak]);
  const yonetebilir = kaynak.izinler.birimYonet;
  const [ekleAcik, setEkleAcik] = React.useState(false);

  const birimler = useQuery({
    queryKey: adaptor.queryKey,
    queryFn: adaptor.listele,
    staleTime: 30_000,
  });

  const ekKeys = React.useMemo(() => extraBirimKeys(kaynak), [kaynak]);

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

  const mevcutlar = React.useMemo(
    () => birimler.data ?? [],
    [birimler.data],
  );
  const mevcutIdleri = React.useMemo(
    () => mevcutlar.map((b) => b.birim_id),
    [mevcutlar],
  );
  const yukleniyor = birimler.isLoading;

  return (
    <section className="grid gap-3">
      <header className="grid gap-1">
        <div className="flex items-center gap-1.5">
          <Building2Icon className="size-3.5" />
          <h3 className="text-sm font-medium">Birimler</h3>
        </div>
        <p className="text-muted-foreground text-xs">
          {birimAciklamasi(kaynak)}
        </p>
      </header>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <SutunBasliği
            metin="Yetkili birimler"
            sayi={yukleniyor ? null : mevcutlar.length}
          />
          {yonetebilir ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEkleAcik(true)}
            >
              <PlusIcon className="size-3.5" /> Ekle
            </Button>
          ) : null}
        </div>

        {yukleniyor ? (
          <p className="text-muted-foreground text-xs">Yükleniyor...</p>
        ) : mevcutlar.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">
            Henüz birim yetkisi verilmemiş.
          </p>
        ) : (
          <ul className="border-border bg-card divide-border max-h-64 divide-y overflow-y-auto rounded-md border">
            {mevcutlar.map((birim) => {
              const ad = birimGorunenAd({ ad: birim.ad, tip: birim.tip });
              return (
                <li
                  key={birim.birim_id}
                  className="hover:bg-accent group flex items-center gap-3 px-3 py-2.5 transition-colors"
                >
                  <span
                    className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md"
                    aria-hidden
                  >
                    <Building2Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ad}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {BIRIM_TIP_LABEL[birim.tip]}
                    </p>
                  </div>
                  {yonetebilir ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() =>
                        kaldir.mutate({ birim_id: birim.birim_id })
                      }
                      aria-label={`${ad} yetkisini kaldır`}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {yonetebilir ? (
        <YetkiliBirimEkleDialog
          acik={ekleAcik}
          acikDegis={setEkleAcik}
          kaynak={kaynak}
          mevcutBirimIdleri={mevcutIdleri}
        />
      ) : null}
    </section>
  );
}

function SutunBasliği({ metin, sayi }: { metin: string; sayi: number | null }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
      <span>{metin}</span>
      <span className="bg-muted text-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums">
        {sayi ?? "..."}
      </span>
    </div>
  );
}
