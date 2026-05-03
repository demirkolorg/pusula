"use client";

import * as React from "react";
import { CheckIcon, PencilIcon, PlusIcon, TagIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { tempId } from "@/lib/temp-id";
import { toast } from "@/lib/toast";
import {
  ETIKET_RENKLERI,
  type EtiketRenk,
} from "../schemas";
import {
  useEtiketler,
  useEtiketOlustur,
  useEtiketGuncelle,
  useEtiketSil,
  useKartaEtiketEkle,
  useKartaEtiketKaldir,
  useKartEtiketleri,
} from "../hooks";
import { EtiketRozet } from "./etiket-rozet";
import type { EtiketOzeti } from "../services";

type Props = {
  kartId: string;
  projeId: string;
  // Sidebar butonu olarak render — özel trigger
  trigger: React.ReactNode;
};

type Mod =
  | { tip: "liste" }
  | { tip: "yeni" }
  | { tip: "duzenle"; etiket: EtiketOzeti };

export function EtiketPopover({ kartId, projeId, trigger }: Props) {
  const [acik, setAcik] = React.useState(false);
  const [mod, setMod] = React.useState<Mod>({ tip: "liste" });

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side="left"
        align="start"
        className="w-72 p-0"
        // Form içinde Enter basıldığında popover kapansın istemiyoruz
        onClick={(e) => e.stopPropagation()}
      >
        {mod.tip === "liste" && (
          <PopoverListe
            kartId={kartId}
            projeId={projeId}
            yeniAc={() => setMod({ tip: "yeni" })}
            duzenleAc={(e) => setMod({ tip: "duzenle", etiket: e })}
            kapat={() => setAcik(false)}
          />
        )}
        {mod.tip === "yeni" && (
          <PopoverForm
            projeId={projeId}
            geri={() => setMod({ tip: "liste" })}
          />
        )}
        {mod.tip === "duzenle" && (
          <PopoverForm
            projeId={projeId}
            etiket={mod.etiket}
            geri={() => setMod({ tip: "liste" })}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

// =====================================================================
// Liste modu — kart için etiket seçimi
// =====================================================================

function PopoverListe({
  kartId,
  projeId,
  yeniAc,
  duzenleAc,
  kapat: _kapat,
}: {
  kartId: string;
  projeId: string;
  yeniAc: () => void;
  duzenleAc: (e: EtiketOzeti) => void;
  kapat: () => void;
}) {
  const etiketler = useEtiketler(projeId);
  const seciliQ = useKartEtiketleri(kartId);
  const ekle = useKartaEtiketEkle(kartId, projeId);
  const kaldir = useKartaEtiketKaldir(kartId, projeId);

  const seciliSet = React.useMemo(
    () => new Set(seciliQ.data ?? []),
    [seciliQ.data],
  );

  const toggle = (etiketId: string) => {
    if (seciliSet.has(etiketId)) {
      kaldir.mutate({ kart_id: kartId, etiket_id: etiketId });
    } else {
      ekle.mutate({ kart_id: kartId, etiket_id: etiketId });
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Etiketler</p>
      </div>

      {etiketler.isLoading ? (
        <p className="text-muted-foreground text-xs">Yükleniyor…</p>
      ) : (etiketler.data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground text-xs">Henüz etiket yok.</p>
      ) : (
        <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
          {etiketler.data?.map((e) => {
            const seciliMi = seciliSet.has(e.id);
            return (
              <li key={e.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={cn(
                    "hover:bg-accent flex h-8 flex-1 items-center gap-2 rounded px-2 text-left",
                    seciliMi && "bg-accent/50",
                  )}
                  aria-pressed={seciliMi}
                >
                  <span
                    className="size-3 rounded"
                    style={{ backgroundColor: e.renk }}
                  />
                  <span className="flex-1 truncate text-sm">{e.ad}</span>
                  {seciliMi && <CheckIcon className="size-3.5" />}
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => duzenleAc(e)}
                  aria-label={`${e.ad} etiketini düzenle`}
                >
                  <PencilIcon className="size-3" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="outline" size="sm" onClick={yeniAc}>
        <PlusIcon className="size-3" /> Yeni etiket
      </Button>
    </div>
  );
}

// =====================================================================
// Yeni / düzenle formu
// =====================================================================

function PopoverForm({
  projeId,
  etiket,
  geri,
}: {
  projeId: string;
  etiket?: EtiketOzeti;
  geri: () => void;
}) {
  const duzenleme = !!etiket;
  const [ad, setAd] = React.useState(etiket?.ad ?? "");
  const [renk, setRenk] = React.useState<EtiketRenk>(
    (etiket?.renk as EtiketRenk) ?? ETIKET_RENKLERI[0],
  );

  const olustur = useEtiketOlustur(projeId);
  const guncelle = useEtiketGuncelle(projeId);
  const sil = useEtiketSil(projeId);

  const yukleniyor = olustur.isPending || guncelle.isPending || sil.isPending;

  const kaydet = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const adKirpilmis = ad.trim();
    if (!adKirpilmis) {
      toast.uyari("Etiket adı zorunlu");
      return;
    }
    if (duzenleme && etiket) {
      await guncelle.mutateAsync({ id: etiket.id, ad: adKirpilmis, renk });
    } else {
      await olustur.mutateAsync({
        id_taslak: tempId(),
        proje_id: projeId,
        ad: adKirpilmis,
        renk,
      });
    }
    geri();
  };

  const sileBas = async () => {
    if (!etiket) return;
    await sil.mutateAsync({ id: etiket.id });
    geri();
  };

  return (
    <form onSubmit={kaydet} className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={geri}
          aria-label="Geri"
        >
          <XIcon className="size-3.5" />
        </Button>
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <TagIcon className="size-3.5" />
          {duzenleme ? "Etiketi düzenle" : "Yeni etiket"}
        </p>
        <span className="w-7" />
      </div>

      <div className="flex justify-center py-1">
        <EtiketRozet
          etiket={{ ad: ad || (duzenleme ? etiket!.ad : "Önizleme"), renk }}
          boyut="md"
        />
      </div>

      <div>
        <label htmlFor="etiket-ad" className="text-xs font-medium">
          Ad
        </label>
        <Input
          id="etiket-ad"
          autoFocus
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          maxLength={40}
          placeholder="Örn. Acil"
        />
      </div>

      <div>
        <p className="text-xs font-medium">Renk</p>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {ETIKET_RENKLERI.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRenk(r)}
              className={cn(
                "ring-offset-popover h-7 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                renk === r && "ring-2 ring-foreground ring-offset-2",
              )}
              style={{ backgroundColor: r }}
              aria-label={`Renk ${r}`}
              aria-pressed={renk === r}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={yukleniyor} className="flex-1">
          {duzenleme ? "Güncelle" : "Oluştur"}
        </Button>
        {duzenleme && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={sileBas}
            disabled={yukleniyor}
            aria-label="Etiketi sil"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        )}
      </div>
    </form>
  );
}
