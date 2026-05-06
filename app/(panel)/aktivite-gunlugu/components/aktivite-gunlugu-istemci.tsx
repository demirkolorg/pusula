"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AktiviteDetayDiyalog } from "@/app/(panel)/ana-sayfa/components/aktivite-detay-diyalog";
import type { AktiviteOzeti } from "@/lib/aktivite/tipler";
import {
  AKTIVITE_GUNLUGU_VARSAYILAN_FILTRE,
  type AktiviteGunluguFiltre,
} from "../schemas";
import type { AktiviteGunluguSatiri, AktiviteGunluguSayfasi } from "../services";
import { useAktiviteGunlugu } from "../hooks/aktivite-sorgulari";
import { AktiviteFiltreleri } from "./aktivite-filtreleri";
import { AktiviteSatiri } from "./aktivite-satiri";

function filtreUrl(filtre: AktiviteGunluguFiltre): string {
  const params = new URLSearchParams();
  if (filtre.kapsam !== "tum") params.set("kapsam", filtre.kapsam);
  if (filtre.arama) params.set("arama", filtre.arama);
  if (filtre.islem) params.set("islem", filtre.islem);
  if (filtre.kaynak_tip) params.set("kaynak_tip", filtre.kaynak_tip);
  return params.toString();
}

function csvDegeri(deger: string): string {
  return `"${deger.replaceAll('"', '""')}"`;
}

function csvUret(kayitlar: AktiviteGunluguSatiri[]): string {
  const baslik = ["Zaman", "Kullanıcı", "İşlem", "Kaynak", "Anlatı"];
  const satirlar = kayitlar.map((a) => [
    new Date(a.zaman).toISOString(),
    a.anlati.kim,
    a.islem,
    a.kaynak_tip,
    a.anlati.metin,
  ]);
  return [baslik, ...satirlar]
    .map((satir) => satir.map(csvDegeri).join(","))
    .join("\n");
}

function indirCsv(kayitlar: AktiviteGunluguSatiri[]) {
  const blob = new Blob([csvUret(kayitlar)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aktivite-gunlugu.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function AktiviteGunluguIstemci({
  ilkFiltre,
  ilkSayfa,
  kaynakTipleri,
  disaAktarabilir,
}: {
  ilkFiltre: AktiviteGunluguFiltre;
  ilkSayfa: AktiviteGunluguSayfasi;
  kaynakTipleri: string[];
  disaAktarabilir: boolean;
}) {
  const router = useRouter();
  const [filtre, setFiltre] = React.useState(ilkFiltre);
  const [secili, setSecili] = React.useState<AktiviteOzeti | null>(null);
  const ilkFiltreKey = React.useMemo(() => JSON.stringify(ilkFiltre), [ilkFiltre]);
  const filtreKey = React.useMemo(() => JSON.stringify(filtre), [filtre]);
  const sorgu = useAktiviteGunlugu(filtre, ilkSayfa, filtreKey === ilkFiltreKey);
  const kayitlar = React.useMemo(
    () => sorgu.data?.pages.flatMap((sayfa) => sayfa.kayitlar) ?? [],
    [sorgu.data],
  );
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sanal = useVirtualizer({
    count: kayitlar.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 92,
    overscan: 8,
  });

  function filtreDegisti(sonraki: AktiviteGunluguFiltre) {
    const { cursor: _cursor, ...temizSonraki } = sonraki;
    const temiz = {
      ...AKTIVITE_GUNLUGU_VARSAYILAN_FILTRE,
      ...temizSonraki,
    };
    setFiltre(temiz);
    const query = filtreUrl(temiz);
    router.replace(query ? `/aktivite-gunlugu?${query}` : "/aktivite-gunlugu");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AktiviteFiltreleri
        filtre={filtre}
        kaynakTipleri={kaynakTipleri}
        disaAktarabilir={disaAktarabilir}
        filtreDegisti={filtreDegisti}
        disaAktar={() => indirCsv(kayitlar)}
      />

      <div
        ref={scrollRef}
        className="min-h-[420px] flex-1 overflow-auto rounded-b-md border-x border-b"
      >
        {sorgu.isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center gap-2 text-sm">
            <Loader2Icon className="size-4 animate-spin" />
            Yükleniyor...
          </div>
        ) : kayitlar.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            Kapsamınıza uyan aktivite bulunamadı.
          </div>
        ) : (
          <div
            className="relative w-full"
            style={{ height: sanal.getTotalSize() }}
          >
            {sanal.getVirtualItems().map((sanalSatir) => {
              const aktivite = kayitlar[sanalSatir.index];
              if (!aktivite) return null;
              return (
                <div
                  key={aktivite.id}
                  ref={sanal.measureElement}
                  className="absolute left-0 top-0 w-full"
                  style={{
                    transform: `translateY(${sanalSatir.start}px)`,
                  }}
                >
                  <AktiviteSatiri
                    aktivite={aktivite}
                    detayAc={(a) => setSecili(a)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center py-4">
        <Button
          type="button"
          variant="outline"
          disabled={!sorgu.hasNextPage || sorgu.isFetchingNextPage}
          onClick={() => void sorgu.fetchNextPage()}
        >
          {sorgu.isFetchingNextPage && <Loader2Icon className="size-4 animate-spin" />}
          {sorgu.hasNextPage ? "Daha eski aktiviteleri yükle" : "Tüm kayıtlar yüklendi"}
        </Button>
      </div>

      <AktiviteDetayDiyalog kayit={secili} kapat={() => setSecili(null)} />
    </div>
  );
}
