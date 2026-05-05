"use client";

import * as React from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  PALET_RENKLERI,
  kapakArkaplanSinifi,
  kapakEtiketi,
  type KapakRenk,
  KAPAK_RENK_TOKENLERI,
} from "@/lib/kapak-renk";
import { ikonMu, type KapakIkonu } from "@/lib/kapak-ikon";
import { IkonSeciciIcerik } from "@/components/ikon-secici";
import {
  projeDetayKey,
  useProjeDetayGuncelle,
} from "../hooks/detay-sorgulari";

type Props = {
  projeId: string;
  ad: string;
  kapakRenk: string | null;
  kapakIkon: string | null;
  duzenleyebilir: boolean;
};

// Header sol bloğundaki renkli kare — tıklayınca renk paleti + ikon picker
// popover'ı açılır. Yetki yoksa salt görsel; tıklama yok.
// Optimistic update useProjeDetayGuncelle (Kural 107-108).
export function ProjeBaslikIkonPopover({
  projeId,
  ad,
  kapakRenk,
  kapakIkon,
  duzenleyebilir,
}: Props) {
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const guncelle = useProjeDetayGuncelle(anahtar);
  const [acik, setAcik] = React.useState(false);

  const ikon: KapakIkonu | null = ikonMu(kapakIkon) ? kapakIkon : null;
  const kapakSinifi = kapakArkaplanSinifi(kapakRenk);

  const renkSec = (yeni: KapakRenk | null) => {
    if (yeni === kapakRenk) return;
    guncelle.mutate(
      { id: projeId, kapak_renk: yeni },
      {
        onSuccess: () =>
          toast.basari(yeni ? "Kapak rengi güncellendi" : "Kapak rengi kaldırıldı"),
      },
    );
  };

  const ikonSec = (yeni: KapakIkonu | null) => {
    if (yeni === kapakIkon) return;
    guncelle.mutate(
      { id: projeId, kapak_ikon: yeni },
      {
        onSuccess: () =>
          toast.basari(yeni ? "Kapak ikonu güncellendi" : "Kapak ikonu kaldırıldı"),
      },
    );
  };

  const onizleme = (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md sm:size-10",
        kapakSinifi ?? "bg-muted",
      )}
      aria-hidden="true"
    >
      {ikon && (
        <DynamicIcon
          name={ikon}
          className={cn(
            "size-5",
            kapakSinifi ? "text-white/90" : "text-muted-foreground",
          )}
        />
      )}
    </div>
  );

  if (!duzenleyebilir) {
    return onizleme;
  }

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger
        render={(p) => (
          <button
            type="button"
            aria-label={`${ad} kapak ayarları`}
            title="Kapak rengi ve ikonu düzenle"
            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-md"
            {...p}
          >
            {onizleme}
          </button>
        )}
      />
      <PopoverContent align="start" className="w-[320px] p-3 sm:w-[360px]">
        <div className="grid gap-3">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
              Renk
            </p>
            <RenkPaletiKucuk deger={kapakRenk} onSec={renkSec} />
          </div>
          <div className="grid gap-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              İkon
            </p>
            {/* Nested popover yerine inline embed — base-ui positioner içinde
                virtualizer scroll container yüksekliğini ölçemediği için liste
                görünmüyordu. */}
            <IkonSeciciIcerik
              deger={ikon}
              onSec={ikonSec}
              gridYuksekligiSinifi="h-[260px]"
              // Popover içerik genişliği ~320-360px → 7 sütun × 40px = 280px sığar.
              // Yoksa 10 sütun × 40 = 400px taşar, yatay scroll oluşur.
              kolonSayisi={7}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Header'a sığan kompakt 7 sütunlu renk paleti — proje formundaki ile aynı palet,
// optimistic single-select.
function RenkPaletiKucuk({
  deger,
  onSec,
}: {
  deger: string | null;
  onSec: (yeni: KapakRenk | null) => void;
}) {
  const seciliMi = (r: string) =>
    deger !== null && (KAPAK_RENK_TOKENLERI as readonly string[]).includes(r) && deger === r;
  return (
    <div className="grid grid-cols-7 gap-1.5">
      <button
        type="button"
        onClick={() => onSec(null)}
        className={cn(
          "border-input hover:border-foreground inline-flex size-8 items-center justify-center rounded-md border bg-transparent text-xs",
          !deger && "border-foreground",
        )}
        aria-label="Renk yok"
        aria-pressed={!deger}
      >
        —
      </button>
      {PALET_RENKLERI.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onSec(r)}
          className={cn(
            "hover:ring-foreground inline-flex size-8 items-center justify-center rounded-md text-white ring-2 ring-transparent transition",
            kapakArkaplanSinifi(r),
            seciliMi(r) && "ring-foreground",
          )}
          aria-label={`Renk: ${kapakEtiketi(r) ?? r}`}
          aria-pressed={seciliMi(r)}
          title={kapakEtiketi(r) ?? r}
        >
          {seciliMi(r) ? "✓" : ""}
        </button>
      ))}
    </div>
  );
}
