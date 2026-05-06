"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMobil } from "@/hooks/use-breakpoint";
import { DosyaFiltreCubugu } from "./dosya-filtre-cubugu";
import { DosyaTablo } from "./dosya-tablo";
import { DosyaMobilKartListesi } from "./dosya-mobil-kart-listesi";
import { DosyaDetayCekmecesi } from "./dosya-detay-cekmecesi";
import { useDosyaListesi } from "../hooks/kullan-dosya-listesi";
import { filtreyiSorguStringeyeCevir } from "../helpers/dosya-filtre";
import type { DosyaListeFiltre } from "../schemas";
import type { DosyaListeSonuc } from "../services";

type Props = {
  ilkFiltre: DosyaListeFiltre;
  ilkSayfa: DosyaListeSonuc;
};

export function DosyalarIstemci({ ilkFiltre, ilkSayfa }: Props) {
  const router = useRouter();
  const mobil = useMobil();

  const [filtre, setFiltre] = React.useState<DosyaListeFiltre>(ilkFiltre);
  const [seciliId, setSeciliId] = React.useState<string | null>(null);
  const [cekmeceAcik, setCekmeceAcik] = React.useState(false);

  // Filtre değişince URL'i güncelle (paylaşılabilir link, browser back için)
  React.useEffect(() => {
    const qs = filtreyiSorguStringeyeCevir(filtre);
    const yol = qs ? `/dosyalar?${qs}` : "/dosyalar";
    router.replace(yol, { scroll: false });
    // router referansı stabil; filtre dışındaki dep gereksiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtre]);

  const sorgu = useDosyaListesi(
    filtre,
    // İlk render'da SSR'dan gelen sayfayı kullan; filtre değişince refetch
    JSON.stringify(filtre) === JSON.stringify(ilkFiltre) ? ilkSayfa : null,
  );

  const tumSatirlar = React.useMemo(
    () => sorgu.data?.pages.flatMap((p) => p.satirlar) ?? [],
    [sorgu.data],
  );

  const seciliyiAc = (id: string) => {
    setSeciliId(id);
    setCekmeceAcik(true);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <DosyaFiltreCubugu filtre={filtre} onChange={setFiltre} />

        {sorgu.isLoading && tumSatirlar.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Yükleniyor…
          </p>
        ) : sorgu.error ? (
          <p className="text-destructive py-12 text-center text-sm">
            {sorgu.error.message}
          </p>
        ) : mobil ? (
          <DosyaMobilKartListesi
            satirlar={tumSatirlar}
            seciliId={seciliId}
            onSec={seciliyiAc}
          />
        ) : (
          <DosyaTablo
            satirlar={tumSatirlar}
            seciliId={seciliId}
            onSec={seciliyiAc}
          />
        )}

        {sorgu.hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sorgu.isFetchingNextPage}
              onClick={() => sorgu.fetchNextPage()}
              className="min-h-[44px]"
            >
              {sorgu.isFetchingNextPage
                ? "Yükleniyor…"
                : "Daha fazla göster"}
            </Button>
          </div>
        )}
      </div>

      <DosyaDetayCekmecesi
        dosyaId={seciliId}
        acik={cekmeceAcik}
        onKapat={() => setCekmeceAcik(false)}
      />
    </>
  );
}
