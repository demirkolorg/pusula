"use client";

import * as React from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DosyaListeFiltre } from "../schemas";
import {
  aktifFiltreSayisi,
  filtreyiTemizle,
} from "../helpers/dosya-filtre";

const KATEGORI_SECENEKLERI: Array<{ deger: string; etiket: string }> = [
  { deger: "GORSEL", etiket: "Görsel" },
  { deger: "PDF", etiket: "PDF" },
  { deger: "OFIS_BELGESI", etiket: "Word" },
  { deger: "TABLO", etiket: "Excel" },
  { deger: "SUNUM", etiket: "PowerPoint" },
  { deger: "METIN", etiket: "Metin" },
  { deger: "ARSIV", etiket: "Arşiv" },
  { deger: "DIGER", etiket: "Diğer" },
];

const SIRALAMA_SECENEKLERI: Array<{ deger: string; etiket: string }> = [
  { deger: "yeni-eklenen", etiket: "Yeni eklenen" },
  { deger: "eski-eklenen", etiket: "Eski eklenen" },
  { deger: "ad-asc", etiket: "Ad (A → Z)" },
  { deger: "ad-desc", etiket: "Ad (Z → A)" },
  { deger: "boyut-desc", etiket: "Boyut (büyük → küçük)" },
  { deger: "boyut-asc", etiket: "Boyut (küçük → büyük)" },
  { deger: "son-indirme", etiket: "Son indirme" },
];

const TUMU = "__tumu__";

type Props = {
  filtre: DosyaListeFiltre;
  onChange: (filtre: DosyaListeFiltre) => void;
};

export function DosyaFiltreCubugu({ filtre, onChange }: Props) {
  const [aramaDegeri, setAramaDegeri] = React.useState(filtre.arama ?? "");

  // Debounce arama girişi (250ms)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const yeni = aramaDegeri.trim();
      if (yeni !== (filtre.arama ?? "")) {
        onChange({ ...filtre, arama: yeni.length > 0 ? yeni : undefined });
      }
    }, 250);
    return () => clearTimeout(t);
    // filtre referansı her render değişebilir; arama'ya odaklan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aramaDegeri]);

  const aktif = aktifFiltreSayisi(filtre);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="relative flex-1 min-w-0">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Dosyalarda ara…"
          value={aramaDegeri}
          onChange={(e) => setAramaDegeri(e.target.value)}
          className="h-11 pl-10"
          aria-label="Dosyalarda ara"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filtre.kategori ?? TUMU}
          onValueChange={(v) =>
            onChange({
              ...filtre,
              kategori: v === TUMU ? undefined : (v as DosyaListeFiltre["kategori"]),
            })
          }
        >
          <SelectTrigger className="h-11 min-w-[140px]" aria-label="Tür filtresi">
            <SelectValue placeholder="Tür" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TUMU}>Tüm türler</SelectItem>
            {KATEGORI_SECENEKLERI.map((k) => (
              <SelectItem key={k.deger} value={k.deger}>
                {k.etiket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtre.siralama ?? "yeni-eklenen"}
          onValueChange={(v) =>
            onChange({
              ...filtre,
              siralama: v as DosyaListeFiltre["siralama"],
            })
          }
        >
          <SelectTrigger className="h-11 min-w-[160px]" aria-label="Sıralama">
            <SelectValue placeholder="Sırala" />
          </SelectTrigger>
          <SelectContent>
            {SIRALAMA_SECENEKLERI.map((s) => (
              <SelectItem key={s.deger} value={s.deger}>
                {s.etiket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={filtre.silinmis ? "default" : "outline"}
          size="sm"
          className="h-11 px-3"
          onClick={() =>
            onChange({ ...filtre, silinmis: filtre.silinmis ? undefined : true })
          }
        >
          {filtre.silinmis ? "Çöp Kutusu" : "Çöp Kutusunu Göster"}
        </Button>

        {aktif > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 gap-1.5"
            onClick={() => {
              setAramaDegeri("");
              onChange(filtreyiTemizle());
            }}
            aria-label="Filtreleri temizle"
          >
            <XIcon className="size-4" />
            Temizle ({aktif})
          </Button>
        )}
      </div>
    </div>
  );
}
