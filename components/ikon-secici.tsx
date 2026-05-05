"use client";

import * as React from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { XIcon, SearchIcon } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMobil } from "@/hooks/use-breakpoint";
import { tr } from "@/lib/i18n/tr";
import { TUM_IKONLAR, type KapakIkonu } from "@/lib/kapak-ikon";
import { ikonlariFiltrele, satirlaraBol } from "./ikon-secici-helper";

type Props = {
  deger: KapakIkonu | null;
  onSec: (yeniDeger: KapakIkonu | null) => void;
  tetikleyici: React.ReactNode;
  // Tetikleyiciye basıldığında açılan popover hizası — proje formu için "start" iyi.
  align?: "start" | "center" | "end";
};

const HUCRE_PIKSEL = 40; // 40×40 hücre — hit-target ≥ 44 dış padding ile sağlanır
const SATIR_YUKSEKLIK = 44;

export function IkonSecici({ deger, onSec, tetikleyici, align = "start" }: Props) {
  const [acik, setAcik] = React.useState(false);

  const sec = (n: KapakIkonu | null) => {
    onSec(n);
    setAcik(false);
  };

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={(p) => <button type="button" {...p}>{tetikleyici}</button>} />
      <PopoverContent
        align={align}
        className="flex w-[320px] flex-col gap-2 p-2 sm:w-[440px]"
      >
        <IkonSeciciIcerik deger={deger} onSec={sec} otoFocus />
      </PopoverContent>
    </Popover>
  );
}

type IcerikProps = {
  deger: KapakIkonu | null;
  onSec: (yeniDeger: KapakIkonu | null) => void;
  otoFocus?: boolean;
  // Grid kapsayıcı yüksekliği — popover içinde 280px default, başka bağlamlarda
  // (inline embed) override edilebilir.
  gridYuksekligiSinifi?: string;
  // Sütun sayısını dışarıdan zorla — kapsayıcı dar olduğunda (örn. nested
  // popover içinde 320px width) yatay scroll oluşmasın diye.
  // Verilmezse responsive default: mobilde 7, desktop 10.
  kolonSayisi?: number;
};

/**
 * IkonSecici'nin search + virtualized grid içeriği — popover'sız.
 * Kullanım: nested popover'da yeniden render edilemediği için (base-ui
 * positioner içinde scroll container yüksekliği ölçülemiyor → liste boş
 * görünüyor), inline embed gereken bağlamlarda IkonSecici yerine bunu kullan.
 */
export function IkonSeciciIcerik({
  deger,
  onSec,
  otoFocus = false,
  gridYuksekligiSinifi = "h-[280px]",
  kolonSayisi: kolonSayisiOverride,
}: IcerikProps) {
  const [sorgu, setSorgu] = React.useState("");
  const mobil = useMobil();
  const kolonSayisi = kolonSayisiOverride ?? (mobil ? 7 : 10);
  const kapsayiciRef = React.useRef<HTMLDivElement | null>(null);

  const filtrelenmis = React.useMemo(
    () => ikonlariFiltrele(sorgu, TUM_IKONLAR),
    [sorgu],
  );
  const satirlar = React.useMemo(
    () => satirlaraBol(filtrelenmis, kolonSayisi),
    [filtrelenmis, kolonSayisi],
  );

  const sanal = useVirtualizer({
    count: satirlar.length,
    getScrollElement: () => kapsayiciRef.current,
    estimateSize: () => SATIR_YUKSEKLIK,
    overscan: 4,
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2"
          />
          <Input
            autoFocus={otoFocus}
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder={tr.proje.form.ikonAra}
            className="h-9 pl-8"
            aria-label={tr.proje.form.ikonAra}
          />
        </div>
        {deger && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSec(null)}
            aria-label={tr.proje.form.ikonTemizle}
            title={tr.proje.form.ikonTemizle}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      <div
        ref={kapsayiciRef}
        className={cn(
          "relative overflow-x-hidden overflow-y-auto rounded-md border",
          gridYuksekligiSinifi,
        )}
        role="grid"
        aria-rowcount={satirlar.length}
      >
        {filtrelenmis.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {tr.ortak.bos}
          </div>
        ) : (
          <div
            style={{ height: sanal.getTotalSize(), position: "relative", width: "100%" }}
          >
            {sanal.getVirtualItems().map((satir) => {
              const isimler = satirlar[satir.index] ?? [];
              return (
                <div
                  key={satir.key}
                  role="row"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: SATIR_YUKSEKLIK,
                    transform: `translateY(${satir.start}px)`,
                  }}
                  className="flex items-center justify-start gap-1 px-1"
                >
                  {isimler.map((isim) => (
                    <button
                      key={isim}
                      type="button"
                      onClick={() => onSec(isim)}
                      role="gridcell"
                      aria-label={`İkon: ${isim}`}
                      aria-selected={deger === isim}
                      title={isim}
                      className={cn(
                        "hover:bg-muted focus-visible:ring-ring inline-flex shrink-0 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none",
                        deger === isim &&
                          "bg-primary/10 text-primary ring-primary ring-2",
                      )}
                      style={{ width: HUCRE_PIKSEL, height: HUCRE_PIKSEL }}
                    >
                      <DynamicIcon name={isim} className="size-5" />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
