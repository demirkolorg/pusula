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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useProjeAdayKullanicilar,
  useProjeUyeleri,
  useProjeyeUyeEkle,
  useProjeyeUyeKaldir,
} from "../uye/hooks";
import { UyeAvatar } from "../uye/components/uye-avatar";
import { BirimPaylasimListesi } from "./birim-paylasim-listesi";

type Props = {
  projeId: string;
  trigger?: React.ReactNode;
};

export function ProjePaylasimPopover({ projeId, trigger }: Props) {
  const [acik, setAcik] = React.useState(false);

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger
        render={
          (trigger as React.ReactElement | undefined) ?? (
            <Button size="sm" variant="outline">
              <Share2Icon className="size-4" /> Paylaşım
            </Button>
          )
        }
      />
      <PopoverContent side="bottom" align="start" className="w-96 p-0">
        <div className="grid gap-4 p-3">
          <section className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Building2Icon className="size-3.5" />
              <p className="text-sm font-medium">Birimler</p>
            </div>
            <p className="text-muted-foreground text-xs">
              Eklenen birimlerin personeli projeyi ve doğrudan paylaşılan alt
              listeleri/kartları görebilir.
            </p>
            <BirimPaylasimListesi
              kaynak={{ tip: "proje", id: projeId }}
              bosMetin="Bu proje henüz birimle paylaşılmamış."
            />
          </section>

          <section className="border-t pt-3">
            <div className="mb-2 flex items-center gap-1.5">
              <UserRoundIcon className="size-3.5" />
              <p className="text-sm font-medium">Üyeler</p>
            </div>
            <ProjeUyePaylasimi projeId={projeId} />
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProjeUyePaylasimi({ projeId }: { projeId: string }) {
  const [q, setQ] = React.useState("");
  const uyeler = useProjeUyeleri(projeId);
  const adaylar = useProjeAdayKullanicilar(projeId, q);
  const ekle = useProjeyeUyeEkle(projeId);
  const kaldir = useProjeyeUyeKaldir(projeId);
  const uyeSet = new Set((uyeler.data ?? []).map((uye) => uye.kullanici_id));
  const filtreliAdaylar = (adaylar.data ?? []).filter(
    (aday) => !uyeSet.has(aday.id),
  );

  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        {(uyeler.data ?? []).length === 0 ? (
          <p className="text-muted-foreground text-xs">Henüz üye yok.</p>
        ) : (
          <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto">
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
                    {uye.email}
                  </p>
                </div>
                <span className="text-muted-foreground text-[10px]">
                  {uye.seviye}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    kaldir.mutate({
                      proje_id: projeId,
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
      </div>

      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kişi ara"
          className="h-8 pl-7"
        />
      </div>

      <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
        {filtreliAdaylar.map((aday) => (
          <li key={aday.id}>
            <button
              type="button"
              disabled={ekle.isPending}
              onClick={() =>
                ekle.mutate({
                  proje_id: projeId,
                  kullanici_id: aday.id,
                  seviye: "NORMAL",
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
