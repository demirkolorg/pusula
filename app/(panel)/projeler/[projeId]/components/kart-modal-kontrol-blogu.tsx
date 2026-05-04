"use client";

import * as React from "react";
import { CheckIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKartKontrolListeleri } from "../kontrol-listesi/hooks";
import { KontrolListesiPaneli } from "../kontrol-listesi/components/kontrol-listesi-paneli";
import { KartModalSectionBaslik } from "./kart-modal-section-baslik";

type Props = { kartId: string };

// Sancak'taki "Kontrol Listesi" bloğu — section header'da sağda 80px progress
// bar + tamamlanan/toplam sayısı (accent-text). Bizdeki KontrolListesiPaneli
// kendi içinde liste başına progress gösteriyor; bu blok onların toplamını
// section header'da tek satırda özetler. "Liste ekle" butonu da aynı satırda.
export function KartModalKontrolBlogu({ kartId }: Props) {
  const sorgu = useKartKontrolListeleri(kartId);
  const [yeniAcik, setYeniAcik] = React.useState(false);
  const ozet = React.useMemo(() => {
    const tum = sorgu.data ?? [];
    const tamamlanan = tum.reduce(
      (s, kl) => s + kl.maddeler.filter((m) => m.tamamlandi_mi).length,
      0,
    );
    const toplam = tum.reduce((s, kl) => s + kl.maddeler.length, 0);
    return { tamamlanan, toplam };
  }, [sorgu.data]);

  const yuzde = ozet.toplam === 0 ? 0 : Math.round((ozet.tamamlanan / ozet.toplam) * 100);
  const ekstra = (
    <>
      {ozet.toplam > 0 && (
        <>
          <span
            className={cn(
              "bg-muted relative h-1 w-20 overflow-hidden rounded-full",
            )}
            aria-hidden
          >
            <span
              className="bg-primary absolute inset-y-0 left-0 transition-[width] duration-300"
              style={{ width: `${yuzde}%` }}
            />
          </span>
          <span className="text-primary text-[11.5px] font-semibold tabular-nums">
            {ozet.tamamlanan}/{ozet.toplam}
          </span>
        </>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2 text-[11.5px] border-dashed"
        onClick={() => setYeniAcik(true)}
        disabled={yeniAcik}
        aria-label="Kontrol listesi ekle"
      >
        <PlusIcon className="size-3.5" /> Liste ekle
      </Button>
    </>
  );

  return (
    <div className="flex flex-col gap-2.5">
      <KartModalSectionBaslik
        icon={CheckIcon}
        baslik="Kontrol Listesi"
        ekstra={ekstra}
      />
      <KontrolListesiPaneli
        kartId={kartId}
        yeniAcik={yeniAcik}
        setYeniAcik={setYeniAcik}
      />
    </div>
  );
}
