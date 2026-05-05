"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2Icon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useOptimisticMutation } from "@/lib/optimistic";
import { BIRIM_TIP_LABEL, birimGorunenAd } from "@/lib/constants/birim";
import { birimSecenekleriniGetir } from "../../../../ayarlar/birimler/actions";
import { birimAdaptor, extraBirimKeys } from "../yetkili-adaptor";
import { optimistikBirimEkle } from "../yetkili-optimistic";
import type {
  YetkiliBirimOzeti,
  YetkiliBirimSecenegi,
  YetkiliKaynagi,
} from "../yetkili-tipler";

type Props = {
  acik: boolean;
  acikDegis: (acik: boolean) => void;
  kaynak: YetkiliKaynagi;
  mevcutBirimIdleri: ReadonlyArray<string>;
};

const BIRIM_SECENEK_KEY = ["birim-secenekleri"] as const;

export function YetkiliBirimEkleDialog({
  acik,
  acikDegis,
  kaynak,
  mevcutBirimIdleri,
}: Props) {
  const adaptor = React.useMemo(() => birimAdaptor(kaynak), [kaynak]);
  const ekKeys = React.useMemo(() => extraBirimKeys(kaynak), [kaynak]);
  const [arama, setArama] = React.useState("");

  const secenekler = useQuery({
    queryKey: BIRIM_SECENEK_KEY,
    queryFn: async (): Promise<YetkiliBirimSecenegi[]> => {
      const r = await birimSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 60_000,
    enabled: acik,
  });

  const ekle = useOptimisticMutation<
    { birim_id: string; secenek: YetkiliBirimSecenegi },
    { birim_id: string }
  >({
    queryKey: adaptor.queryKey,
    mutationFn: ({ birim_id }) => adaptor.ekle(birim_id),
    optimistic: (eski, vars) =>
      optimistikBirimEkle(eski as YetkiliBirimOzeti[] | undefined, {
        id: vars.secenek.id,
        ad: vars.secenek.ad,
        tip: vars.secenek.tip,
      }),
    ekInvalidate: ekKeys,
    hataMesaji: "Birim yetkisi verilemedi",
    basariMesaji: "Birim yetkisi verildi",
  });

  const handleAcikDegis = (yeni: boolean) => {
    if (!yeni) setArama("");
    acikDegis(yeni);
  };

  const mevcutSet = React.useMemo(
    () => new Set(mevcutBirimIdleri),
    [mevcutBirimIdleri],
  );
  const aramaQ = arama.trim().toLocaleLowerCase("tr");
  const eklenebilirler = (secenekler.data ?? [])
    .filter((b) => !mevcutSet.has(b.id))
    .filter((b) => {
      if (!aramaQ) return true;
      const ad = birimGorunenAd({ ad: b.ad, tip: b.tip }).toLocaleLowerCase(
        "tr",
      );
      const tipEt = BIRIM_TIP_LABEL[b.tip].toLocaleLowerCase("tr");
      return ad.includes(aramaQ) || tipEt.includes(aramaQ);
    });

  const yukleniyor = secenekler.isLoading;

  return (
    <ResponsiveDialog open={acik} onOpenChange={handleAcikDegis}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <span
              className="bg-muted flex size-8 items-center justify-center rounded-md"
              aria-hidden
            >
              <Building2Icon className="size-4" />
            </span>
            Birim yetkisi ekle
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Eklenen birimin tüm personeli erişim kazanır.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-3">
          <div className="relative">
            <SearchIcon
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Birim adı veya tipi yazın..."
              className="h-9 pl-9"
              autoFocus
            />
          </div>

          <div className="border-border bg-card max-h-72 min-h-32 overflow-y-auto rounded-md border">
            {yukleniyor ? (
              <BosDurum metin="Yükleniyor..." />
            ) : eklenebilirler.length === 0 ? (
              <BosDurum
                metin={
                  aramaQ
                    ? "Eşleşen birim bulunamadı."
                    : "Eklenebilecek birim kalmadı."
                }
              />
            ) : (
              <ul className="divide-border divide-y">
                {eklenebilirler.map((birim) => {
                  const ad = birimGorunenAd({ ad: birim.ad, tip: birim.tip });
                  return (
                    <li key={birim.id}>
                      <button
                        type="button"
                        disabled={ekle.isPending}
                        onClick={() => {
                          ekle.mutate({ birim_id: birim.id, secenek: birim });
                        }}
                        className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
                        <PlusIcon
                          className="text-muted-foreground size-4 shrink-0"
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            render={
              <Button type="button" variant="outline">
                Kapat
              </Button>
            }
          />
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function BosDurum({ metin }: { metin: string }) {
  return (
    <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
      <p className="italic">{metin}</p>
    </div>
  );
}
