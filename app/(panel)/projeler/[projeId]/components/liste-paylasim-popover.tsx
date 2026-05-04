"use client";

import * as React from "react";
import {
  Building2Icon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import { UyeAvatar } from "../uye/components/uye-avatar";
import {
  listeAdayKisilerEylem,
  listeUyeEkleEylem,
  listeUyeKaldirEylem,
  listeUyeleriEylem,
} from "../actions";
import type { AdayKisiPaylasim, KisiPaylasimOzeti } from "../paylasim";
import { BirimPaylasimListesi } from "./birim-paylasim-listesi";

type Props = {
  listeId: string;
  trigger: React.ReactNode;
};

function listeUyeleriKey(listeId: string) {
  return ["liste-uyeleri", listeId] as const;
}

function listeAdayKey(listeId: string, q: string) {
  return ["liste-aday-kisiler", listeId, q] as const;
}

export function ListePaylasimPopover({ listeId, trigger }: Props) {
  const [acik, setAcik] = React.useState(false);

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side="right"
        align="start"
        className="w-96 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-4 p-3">
          <section className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Building2Icon className="size-3.5" />
              <p className="text-sm font-medium">Birimler</p>
            </div>
            <BirimPaylasimListesi
              kaynak={{ tip: "liste", id: listeId }}
              bosMetin="Bu liste henüz birimle paylaşılmamış."
            />
          </section>

          <section className="border-t pt-3">
            <div className="mb-2 flex items-center gap-1.5">
              <UserRoundIcon className="size-3.5" />
              <p className="text-sm font-medium">Kişiler</p>
            </div>
            <ListeKisiPaylasimi listeId={listeId} />
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ListeKisiPaylasimi({ listeId }: { listeId: string }) {
  const [q, setQ] = React.useState("");

  const uyeler = useQuery({
    queryKey: listeUyeleriKey(listeId),
    queryFn: async (): Promise<KisiPaylasimOzeti[]> => {
      const sonuc = await listeUyeleriEylem({ liste_id: listeId });
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    staleTime: 30_000,
  });

  const adaylar = useQuery({
    queryKey: listeAdayKey(listeId, q),
    queryFn: async (): Promise<AdayKisiPaylasim[]> => {
      const sonuc = await listeAdayKisilerEylem({ liste_id: listeId, q });
      if (!sonuc.basarili) throw new Error(sonuc.hata);
      return sonuc.veri;
    },
    staleTime: 30_000,
  });

  const ekle = useOptimisticMutation<
    { liste_id: string; kullanici_id: string; uye_ozeti?: AdayKisiPaylasim },
    { liste_id: string; uye: KisiPaylasimOzeti }
  >({
    queryKey: [listeUyeleriKey(listeId), ["liste-aday-kisiler", listeId]] as const,
    mutationFn: ({ uye_ozeti: _uyeOzeti, ...girdi }) =>
      eylemMutasyonu(listeUyeEkleEylem)(girdi),
    optimisticMap: [
      {
        queryKey: listeUyeleriKey(listeId),
        update: (eski, vars) => {
          const liste = (eski as KisiPaylasimOzeti[] | undefined) ?? [];
          if (liste.some((uye) => uye.kullanici_id === vars.kullanici_id)) {
            return liste;
          }
          const aday = vars.uye_ozeti;
          if (!aday) return liste;
          return [
            ...liste,
            {
              kullanici_id: aday.id,
              ad: aday.ad,
              soyad: aday.soyad,
              email: aday.email,
              birim_ad: aday.birim_ad,
              eklenme_zamani: new Date(),
            },
          ];
        },
      },
    ],
    swap: (eski, vars, yanit) => {
      const liste = (eski as KisiPaylasimOzeti[] | undefined) ?? [];
      return liste.map((uye) =>
        uye.kullanici_id === vars.kullanici_id ? yanit.uye : uye,
      );
    },
    hataMesaji: "Kişi eklenemedi",
  });

  const kaldir = useOptimisticMutation<
    { liste_id: string; kullanici_id: string },
    { liste_id: string; kullanici_id: string }
  >({
    queryKey: listeUyeleriKey(listeId),
    mutationFn: eylemMutasyonu(listeUyeKaldirEylem),
    optimistic: (eski, vars) => {
      const liste = (eski as KisiPaylasimOzeti[] | undefined) ?? [];
      return liste.filter((uye) => uye.kullanici_id !== vars.kullanici_id);
    },
    hataMesaji: "Kişi kaldırılamadı",
  });

  const uyeSet = new Set((uyeler.data ?? []).map((uye) => uye.kullanici_id));
  const filtreliAdaylar = (adaylar.data ?? []).filter(
    (aday) => !uyeSet.has(aday.id),
  );

  return (
    <div className="grid gap-2">
      {(uyeler.data ?? []).length === 0 ? (
        <p className="text-muted-foreground text-xs">Henüz kişi yok.</p>
      ) : (
        <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto">
          {uyeler.data?.map((uye) => (
            <li
              key={uye.kullanici_id}
              className="bg-muted/40 flex items-center gap-2 rounded px-2 py-1.5"
            >
              <UyeAvatar ad={uye.ad} soyad={uye.soyad} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {uye.ad} {uye.soyad}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {uye.birim_ad ?? uye.email}
                </p>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() =>
                  kaldir.mutate({
                    liste_id: listeId,
                    kullanici_id: uye.kullanici_id,
                  })
                }
                aria-label={`${uye.ad} ${uye.soyad} kaldır`}
              >
                <XIcon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kişi ara"
          className="h-8 pl-7"
        />
      </div>

      <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto">
        {filtreliAdaylar.map((aday) => (
          <li key={aday.id}>
            <button
              type="button"
              disabled={ekle.isPending}
              onClick={() =>
                ekle.mutate({
                  liste_id: listeId,
                  kullanici_id: aday.id,
                  uye_ozeti: aday,
                })
              }
              className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UyeAvatar ad={aday.ad} soyad={aday.soyad} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {aday.ad} {aday.soyad}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {aday.birim_ad ?? aday.email}
                </p>
              </div>
              <PlusIcon className="text-muted-foreground size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ListePaylasimTrigger() {
  return (
    <Button size="icon-sm" variant="ghost" aria-label="Liste paylaşımı">
      <Share2Icon className="size-4" />
    </Button>
  );
}
