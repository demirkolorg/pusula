"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderTreeIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobil } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";
import { DosyaFiltreCubugu } from "./dosya-filtre-cubugu";
import { DosyaTablo } from "./dosya-tablo";
import { DosyaMobilKartListesi } from "./dosya-mobil-kart-listesi";
import { DosyaDetayCekmecesi } from "./dosya-detay-cekmecesi";
import { ProjeKlasorGrid } from "./proje-klasor-grid";
import { ProjeIcerik } from "./proje-icerik";
import { useDosyaListesi } from "../hooks/kullan-dosya-listesi";
import { useProjeKlasorListesi } from "../hooks/kullan-proje-klasor-listesi";
import { filtreyiSorguStringeyeCevir } from "../helpers/dosya-filtre";
import type { DosyaListeFiltre } from "../schemas";
import type { DosyaListeSonuc } from "../services";
import type { ProjeKlasoru } from "../services-proje-gorunumu";

type Gorunum = "proje" | "liste";

type Props = {
  ilkFiltre: DosyaListeFiltre;
  ilkSayfa: DosyaListeSonuc;
  ilkProjeKlasorleri: ProjeKlasoru[];
};

const VARSAYILAN_GORUNUM: Gorunum = "proje";

function gorunumOku(deger: string | null): Gorunum {
  return deger === "liste" ? "liste" : VARSAYILAN_GORUNUM;
}

export function DosyalarIstemci({
  ilkFiltre,
  ilkSayfa,
  ilkProjeKlasorleri,
}: Props) {
  const router = useRouter();
  const aramaParams = useSearchParams();
  const mobil = useMobil();

  const [gorunum, setGorunum] = React.useState<Gorunum>(() =>
    gorunumOku(aramaParams.get("gorunum")),
  );
  const [acikProjeId, setAcikProjeId] = React.useState<string | null>(() =>
    aramaParams.get("proje"),
  );

  const [filtre, setFiltre] = React.useState<DosyaListeFiltre>(ilkFiltre);
  const [seciliId, setSeciliId] = React.useState<string | null>(null);
  const [cekmeceAcik, setCekmeceAcik] = React.useState(false);

  // URL senkronu — geçerli görünüm + (proje görünümünde) açık proje +
  // (liste görünümünde) filtre. Sayfa yenileme ve geri/ileri korunur.
  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (gorunum !== VARSAYILAN_GORUNUM) sp.set("gorunum", gorunum);
    if (gorunum === "proje" && acikProjeId) sp.set("proje", acikProjeId);
    if (gorunum === "liste") {
      const fq = filtreyiSorguStringeyeCevir(filtre);
      if (fq) {
        for (const [k, v] of new URLSearchParams(fq).entries()) sp.set(k, v);
      }
    }
    const qs = sp.toString();
    const yol = qs ? `/dosyalar?${qs}` : "/dosyalar";
    router.replace(yol, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gorunum, acikProjeId, filtre]);

  const seciliyiAc = React.useCallback((id: string) => {
    setSeciliId(id);
    setCekmeceAcik(true);
  }, []);

  return (
    <>
      <GorunumSekmeleri aktif={gorunum} onDegis={setGorunum} />

      {gorunum === "proje" ? (
        <ProjeGorunumu
          acikProjeId={acikProjeId}
          onProjeAc={setAcikProjeId}
          onGeri={() => setAcikProjeId(null)}
          onDosyaSec={seciliyiAc}
          seciliDosyaId={seciliId}
          ilkKlasorler={ilkProjeKlasorleri}
        />
      ) : (
        <ListeGorunumu
          mobil={mobil}
          filtre={filtre}
          ilkFiltre={ilkFiltre}
          ilkSayfa={ilkSayfa}
          seciliId={seciliId}
          onFiltreDegis={setFiltre}
          onDosyaSec={seciliyiAc}
        />
      )}

      <DosyaDetayCekmecesi
        dosyaId={seciliId}
        acik={cekmeceAcik}
        onKapat={() => setCekmeceAcik(false)}
      />
    </>
  );
}

function GorunumSekmeleri({
  aktif,
  onDegis,
}: {
  aktif: Gorunum;
  onDegis: (g: Gorunum) => void;
}) {
  const sekmeler: Array<{
    deger: Gorunum;
    etiket: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { deger: "proje", etiket: "Proje Görünümü", Icon: FolderTreeIcon },
    { deger: "liste", etiket: "Liste Görünümü", Icon: ListIcon },
  ];
  return (
    <div role="tablist" className="border-b -mt-1 flex items-center gap-1">
      {sekmeler.map((s) => {
        const aktifMi = aktif === s.deger;
        const Icon = s.Icon;
        return (
          <button
            key={s.deger}
            type="button"
            role="tab"
            aria-selected={aktifMi}
            onClick={() => onDegis(s.deger)}
            className={cn(
              "relative flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm transition-colors",
              aktifMi
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span>{s.etiket}</span>
            {aktifMi && (
              <span className="bg-primary absolute bottom-[-1px] left-0 right-0 h-[2px]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ProjeGorunumu({
  acikProjeId,
  onProjeAc,
  onGeri,
  onDosyaSec,
  seciliDosyaId,
  ilkKlasorler,
}: {
  acikProjeId: string | null;
  onProjeAc: (id: string) => void;
  onGeri: () => void;
  onDosyaSec: (id: string) => void;
  seciliDosyaId: string | null;
  ilkKlasorler: ProjeKlasoru[];
}) {
  const sorgu = useProjeKlasorListesi(ilkKlasorler);

  if (acikProjeId) {
    return (
      <ProjeIcerik
        projeId={acikProjeId}
        onGeri={onGeri}
        onDosyaSec={onDosyaSec}
        seciliDosyaId={seciliDosyaId}
      />
    );
  }

  if (sorgu.error) {
    return (
      <p className="text-destructive py-12 text-center text-sm">
        {sorgu.error.message}
      </p>
    );
  }

  return (
    <ProjeKlasorGrid
      klasorler={sorgu.data ?? []}
      onProjeAc={onProjeAc}
      isLoading={sorgu.isLoading}
    />
  );
}

function ListeGorunumu({
  mobil,
  filtre,
  ilkFiltre,
  ilkSayfa,
  seciliId,
  onFiltreDegis,
  onDosyaSec,
}: {
  mobil: boolean;
  filtre: DosyaListeFiltre;
  ilkFiltre: DosyaListeFiltre;
  ilkSayfa: DosyaListeSonuc;
  seciliId: string | null;
  onFiltreDegis: (f: DosyaListeFiltre) => void;
  onDosyaSec: (id: string) => void;
}) {
  const sorgu = useDosyaListesi(
    filtre,
    JSON.stringify(filtre) === JSON.stringify(ilkFiltre) ? ilkSayfa : null,
  );

  const tumSatirlar = React.useMemo(
    () => sorgu.data?.pages.flatMap((p) => p.satirlar) ?? [],
    [sorgu.data],
  );

  return (
    <div className="flex flex-col gap-3">
      <DosyaFiltreCubugu filtre={filtre} onChange={onFiltreDegis} />

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
          onSec={onDosyaSec}
        />
      ) : (
        <DosyaTablo
          satirlar={tumSatirlar}
          seciliId={seciliId}
          onSec={onDosyaSec}
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
  );
}
