"use client";

import * as React from "react";
import { CheckSquareIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { tempIdMi } from "@/lib/temp-id";
import {
  tempId,
  useKartKontrolListeleri,
  useKontrolListesiOlustur,
  useKontrolListesiSil,
  useMaddeGuncelle,
  useMaddeOlustur,
  useMaddeSil,
} from "../hooks";
import type { KontrolListesiOzeti, MaddeOzeti } from "../services";

type Props = { kartId: string };

export function KontrolListesiPaneli({ kartId }: Props) {
  const sorgu = useKartKontrolListeleri(kartId);
  const olustur = useKontrolListesiOlustur(kartId);
  const [yeniListe, setYeniListe] = React.useState("");
  const [yeniAcik, setYeniAcik] = React.useState(false);

  const yeniListeEkle = (e: React.FormEvent) => {
    e.preventDefault();
    const t = yeniListe.trim();
    if (!t) return;
    olustur.mutate({ id_taslak: tempId(), kart_id: kartId, ad: t });
    setYeniListe("");
    setYeniAcik(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {sorgu.data?.map((kl) => (
        <KontrolListesi key={kl.id} kl={kl} kartId={kartId} />
      ))}

      {yeniAcik ? (
        <form onSubmit={yeniListeEkle} className="flex gap-2">
          <Input
            autoFocus
            value={yeniListe}
            onChange={(e) => setYeniListe(e.target.value)}
            placeholder="Kontrol listesi adı"
            maxLength={120}
          />
          <Button type="submit" size="sm" disabled={!yeniListe.trim()}>
            Ekle
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setYeniListe("");
              setYeniAcik(false);
            }}
          >
            Vazgeç
          </Button>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setYeniAcik(true)}
        >
          <CheckSquareIcon className="size-3.5" /> Kontrol listesi ekle
        </Button>
      )}
    </div>
  );
}

// =====================================================================
// Tek kontrol listesi
// =====================================================================

function KontrolListesi({
  kl,
  kartId,
}: {
  kl: KontrolListesiOzeti;
  kartId: string;
}) {
  const sil = useKontrolListesiSil(kartId);
  const [yeniMadde, setYeniMadde] = React.useState("");
  const [maddeAcik, setMaddeAcik] = React.useState(false);
  const olustur = useMaddeOlustur(kartId);

  const tamamlanan = kl.maddeler.filter((m) => m.tamamlandi_mi).length;
  const toplam = kl.maddeler.length;
  const yuzde = toplam === 0 ? 0 : Math.round((tamamlanan / toplam) * 100);

  const maddeEkle = (e: React.FormEvent) => {
    e.preventDefault();
    const t = yeniMadde.trim();
    if (!t) return;
    olustur.mutate({
      id_taslak: tempId(),
      kontrol_listesi_id: kl.id,
      metin: t,
    });
    setYeniMadde("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{kl.ad}</p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => sil.mutate({ id: kl.id })}
          aria-label="Kontrol listesini sil"
          disabled={tempIdMi(kl.id)}
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-10 text-right text-[11px]">
          {yuzde}%
        </span>
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${yuzde}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {kl.maddeler.map((m) => (
          <li key={m.id}>
            <Madde madde={m} kartId={kartId} />
          </li>
        ))}
      </ul>

      {maddeAcik ? (
        <form onSubmit={maddeEkle} className="flex gap-2">
          <Input
            autoFocus
            value={yeniMadde}
            onChange={(e) => setYeniMadde(e.target.value)}
            placeholder="Madde metni"
            maxLength={500}
          />
          <Button type="submit" size="sm" disabled={!yeniMadde.trim()}>
            Ekle
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setYeniMadde("");
              setMaddeAcik(false);
            }}
          >
            Kapat
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setMaddeAcik(true)}
        >
          <PlusIcon className="size-3" /> Madde ekle
        </Button>
      )}
    </div>
  );
}

// =====================================================================
// Tek madde
// =====================================================================

function Madde({ madde, kartId }: { madde: MaddeOzeti; kartId: string }) {
  const guncelle = useMaddeGuncelle(kartId);
  const sil = useMaddeSil(kartId);
  const taslak = tempIdMi(madde.id);

  return (
    <div className="hover:bg-accent/30 flex items-center gap-2 rounded px-1 py-1">
      <Checkbox
        checked={madde.tamamlandi_mi}
        onCheckedChange={(v) =>
          guncelle.mutate({
            id: madde.id,
            tamamlandi_mi: v === true,
          })
        }
        disabled={taslak}
        aria-label={`${madde.metin} tamamlandı`}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          madde.tamamlandi_mi && "text-muted-foreground line-through",
        )}
      >
        {madde.metin}
      </span>
      {madde.atanan && (
        <span className="text-muted-foreground text-[10px]">
          {madde.atanan.ad} {madde.atanan.soyad[0]}.
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => sil.mutate({ id: madde.id })}
        disabled={taslak}
        aria-label="Maddeyi sil"
        className="opacity-0 group-hover:opacity-100"
      >
        <Trash2Icon className="size-3" />
      </Button>
    </div>
  );
}
