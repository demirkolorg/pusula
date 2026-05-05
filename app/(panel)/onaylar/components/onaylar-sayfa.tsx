"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  kartTamamlamaOnayEylem,
  kartTamamlamaReddetEylem,
} from "../../projeler/[projeId]/actions";
import {
  maddeTamamlamaOnayEylem,
  maddeTamamlamaReddetEylem,
} from "../../projeler/[projeId]/kontrol-listesi/actions";
import { projeDetayKey } from "../../projeler/[projeId]/hooks/detay-sorgulari";
import { kartKontrolKey } from "../../projeler/[projeId]/kontrol-listesi/hooks";
import {
  bekleyenKartKey,
  bekleyenMaddeKey,
  bekleyenSayimKey,
  useBekleyenKartOnerileri,
  useBekleyenMaddeOnerileri,
  useBekleyenOneriSayimi,
} from "../hooks";
import { BekleyenKartKarti } from "./bekleyen-kart-karti";
import { BekleyenMaddeKarti } from "./bekleyen-madde-karti";
import { OnaylarSegment } from "./onaylar-segment";

type Sekme = "kart" | "madde";

export function OnaylarSayfa() {
  const [aktifSekme, setAktifSekme] = React.useState<Sekme>("kart");
  const istemci = useQueryClient();
  // Proje filtresi MVP'de yok — null = tüm projeler. UI ileride select ile
  // çoklu seçim ekler; helper hook bunu zaten destekliyor.
  const projeFiltresi: string | null = null;

  const sayimSorgu = useBekleyenOneriSayimi();
  const kartSorgu = useBekleyenKartOnerileri(projeFiltresi);
  const maddeSorgu = useBekleyenMaddeOnerileri(projeFiltresi);

  const tumKartlar = React.useMemo(
    () => kartSorgu.data?.pages.flatMap((p) => p.oğeler) ?? [],
    [kartSorgu.data],
  );
  const tumMaddeler = React.useMemo(
    () => maddeSorgu.data?.pages.flatMap((p) => p.oğeler) ?? [],
    [maddeSorgu.data],
  );

  // Onay/Red sonrası ilgili tüm cache'leri invalidate et:
  // - bekleyen onaylar listesi (bu sayfa)
  // - sayım (sidebar badge)
  // - proje detay (eğer açıksa kart cache güncellensin)
  const sonraInvalidate = React.useCallback(
    async (projeId: string, _kartId: string) => {
      await Promise.all([
        istemci.invalidateQueries({ queryKey: bekleyenKartKey(null) }),
        istemci.invalidateQueries({ queryKey: bekleyenKartKey(projeId) }),
        istemci.invalidateQueries({ queryKey: bekleyenMaddeKey(null) }),
        istemci.invalidateQueries({ queryKey: bekleyenMaddeKey(projeId) }),
        istemci.invalidateQueries({ queryKey: bekleyenSayimKey }),
        istemci.invalidateQueries({ queryKey: projeDetayKey(projeId) }),
      ]);
    },
    [istemci],
  );

  const sonraInvalidateMadde = React.useCallback(
    async (kartId: string, projeId: string) => {
      await Promise.all([
        sonraInvalidate(projeId, kartId),
        istemci.invalidateQueries({ queryKey: kartKontrolKey(kartId) }),
      ]);
    },
    [istemci, sonraInvalidate],
  );

  const kartOnayla = async (kartId: string, projeId: string) => {
    const r = await kartTamamlamaOnayEylem({ id: kartId });
    if (r.basarili) {
      toast.basari("Öneri onaylandı, kart tamamlandı");
      await sonraInvalidate(projeId, kartId);
    } else {
      toast.hata(r.hata);
    }
  };
  const kartReddet = async (
    kartId: string,
    projeId: string,
    sebep: string | null,
  ) => {
    const r = await kartTamamlamaReddetEylem({ id: kartId, sebep });
    if (r.basarili) {
      toast.bilgi("Öneri reddedildi");
      await sonraInvalidate(projeId, kartId);
    } else {
      toast.hata(r.hata);
    }
  };
  const maddeOnayla = async (
    maddeId: string,
    kartId: string,
    projeId: string,
  ) => {
    const r = await maddeTamamlamaOnayEylem({ id: maddeId });
    if (r.basarili) {
      toast.basari("Madde önerisi onaylandı");
      await sonraInvalidateMadde(kartId, projeId);
    } else {
      toast.hata(r.hata);
    }
  };
  const maddeReddet = async (
    maddeId: string,
    kartId: string,
    projeId: string,
    sebep: string | null,
  ) => {
    const r = await maddeTamamlamaReddetEylem({ id: maddeId, sebep });
    if (r.basarili) {
      toast.bilgi("Madde önerisi reddedildi");
      await sonraInvalidateMadde(kartId, projeId);
    } else {
      toast.hata(r.hata);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tamamlama Onayları</h1>
          <p className="text-muted-foreground text-sm">
            Yetkililerin tamamlandığını bildirdiği kart ve maddeleri burada
            inceleyip onaylayın veya reddedin.
          </p>
        </div>
      </div>

      <OnaylarSegment
        aktif={aktifSekme}
        setAktif={setAktifSekme}
        sekmeler={[
          {
            kod: "kart" as const,
            etiket: "Kartlar",
            sayi: sayimSorgu.data?.kart,
          },
          {
            kod: "madde" as const,
            etiket: "Maddeler",
            sayi: sayimSorgu.data?.madde,
          },
        ]}
      />

      {aktifSekme === "kart" ? (
        <div className="flex flex-col gap-2">
          {kartSorgu.isLoading ? (
            <BosDurum metin="Yükleniyor..." />
          ) : tumKartlar.length === 0 ? (
            <BosDurum metin="Bekleyen kart önerisi yok." />
          ) : (
            <>
              {tumKartlar.map((k) => (
                <BekleyenKartKarti
                  key={k.id}
                  kart={k}
                  onayDisabledSebebi={
                    k.madde_toplam > 0 && k.madde_tamamlanan < k.madde_toplam
                      ? `Kontrol listesinde ${k.madde_toplam - k.madde_tamamlanan} madde tamamlanmadan kart kapatılamaz.`
                      : null
                  }
                  onOnayla={() => kartOnayla(k.id, k.proje_id)}
                  onReddet={(sebep) => kartReddet(k.id, k.proje_id, sebep)}
                />
              ))}
              {kartSorgu.hasNextPage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-center mt-2"
                  onClick={() => kartSorgu.fetchNextPage()}
                  disabled={kartSorgu.isFetchingNextPage}
                >
                  {kartSorgu.isFetchingNextPage ? "Yükleniyor..." : "Daha fazla"}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {maddeSorgu.isLoading ? (
            <BosDurum metin="Yükleniyor..." />
          ) : tumMaddeler.length === 0 ? (
            <BosDurum metin="Bekleyen madde önerisi yok." />
          ) : (
            <>
              {tumMaddeler.map((m) => (
                <BekleyenMaddeKarti
                  key={m.id}
                  madde={m}
                  onOnayla={() => maddeOnayla(m.id, m.kart_id, m.proje_id)}
                  onReddet={(sebep) =>
                    maddeReddet(m.id, m.kart_id, m.proje_id, sebep)
                  }
                />
              ))}
              {maddeSorgu.hasNextPage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-center mt-2"
                  onClick={() => maddeSorgu.fetchNextPage()}
                  disabled={maddeSorgu.isFetchingNextPage}
                >
                  {maddeSorgu.isFetchingNextPage ? "Yükleniyor..." : "Daha fazla"}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BosDurum({ metin }: { metin: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-sm">
      <ClipboardCheckIcon className="text-muted-foreground/60 size-8" />
      <span>{metin}</span>
    </div>
  );
}
