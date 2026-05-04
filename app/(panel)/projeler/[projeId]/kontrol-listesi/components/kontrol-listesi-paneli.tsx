"use client";

import * as React from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { tempIdMi } from "@/lib/temp-id";
import { toast } from "@/lib/toast";
import {
  kartKontrolKey,
  tempId,
  useKartKontrolListeleri,
  useKontrolListesiGuncelle,
  useKontrolListesiOlustur,
  useKontrolListesiSil,
  useMaddeGuncelle,
  useMaddeOlustur,
  useMaddeSil,
} from "../hooks";
import type { KontrolListesiOzeti, MaddeOzeti } from "../services";

type Props = {
  kartId: string;
  yeniAcik: boolean;
  setYeniAcik: (v: boolean) => void;
};

export function KontrolListesiPaneli({ kartId, yeniAcik, setYeniAcik }: Props) {
  const sorgu = useKartKontrolListeleri(kartId);
  const olustur = useKontrolListesiOlustur(kartId);
  const [yeniListe, setYeniListe] = React.useState("");

  const yeniListeEkle = (e: React.FormEvent) => {
    e.preventDefault();
    const t = yeniListe.trim();
    if (!t) return;
    olustur.mutate({ id_taslak: tempId(), kart_id: kartId, ad: t });
    setYeniListe("");
    setYeniAcik(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {sorgu.data?.map((kl) => (
        <KontrolListesi key={kl.id} kl={kl} kartId={kartId} />
      ))}

      {yeniAcik && (
        <form
          onSubmit={yeniListeEkle}
          className="border-border/60 bg-card/30 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:p-4"
        >
          <Input
            autoFocus
            value={yeniListe}
            onChange={(e) => setYeniListe(e.target.value)}
            placeholder="Kontrol listesi adı"
            maxLength={120}
            className="h-9"
          />
          <div className="flex gap-2">
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
          </div>
        </form>
      )}
    </div>
  );
}

// =====================================================================
// Tek kontrol listesi — inline başlık düzenleme + onaylı silme
// =====================================================================

function KontrolListesi({
  kl,
  kartId,
}: {
  kl: KontrolListesiOzeti;
  kartId: string;
}) {
  const sil = useKontrolListesiSil(kartId);
  const guncelle = useKontrolListesiGuncelle(kartId);
  const [yeniMadde, setYeniMadde] = React.useState("");
  const [maddeAcik, setMaddeAcik] = React.useState(false);
  const [silmeAcik, setSilmeAcik] = React.useState(false);
  const [adDuzenle, setAdDuzenle] = React.useState(false);
  const [yeniAd, setYeniAd] = React.useState("");
  const olustur = useMaddeOlustur(kartId);
  const taslakMi = tempIdMi(kl.id);

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
    setMaddeAcik(false);
  };

  const adDuzenlemeyiAc = () => {
    setYeniAd(kl.ad);
    setAdDuzenle(true);
  };

  const adKaydet = () => {
    const t = yeniAd.trim();
    setAdDuzenle(false);
    if (!t || t === kl.ad) return;
    guncelle.mutate({ id: kl.id, ad: t });
  };

  const adIptal = () => {
    setAdDuzenle(false);
  };

  return (
    <section className="border-border/60 group/liste flex flex-col gap-3 rounded-lg border bg-card/30 p-3 sm:p-4">
      {/* Üst: liste adı (inline edit) + sayım chip + hover edit/sil */}
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
          {adDuzenle ? (
            <Input
              autoFocus
              value={yeniAd}
              onChange={(e) => setYeniAd(e.target.value)}
              onBlur={adKaydet}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  adIptal();
                }
              }}
              maxLength={120}
              className="h-7 flex-1 text-[15px] font-semibold"
              aria-label="Kontrol listesi adı"
            />
          ) : (
            <button
              type="button"
              onClick={() => !taslakMi && adDuzenlemeyiAc()}
              disabled={taslakMi}
              className={cn(
                "min-w-0 truncate rounded px-1 -mx-1 py-0.5 text-left text-[15px] font-semibold leading-tight transition",
                !taslakMi && "hover:bg-accent/40 cursor-text",
              )}
              title="Düzenlemek için tıklayın"
            >
              {kl.ad}
            </button>
          )}
          {!adDuzenle && toplam > 0 && (
            <span className="text-muted-foreground shrink-0 text-[11.5px] font-medium tabular-nums">
              {tamamlanan}/{toplam}
            </span>
          )}
        </div>
        {!adDuzenle && (
          <div className="flex items-center gap-0.5 opacity-0 transition group-hover/liste:opacity-100 focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={adDuzenlemeyiAc}
              aria-label="Kontrol listesini düzenle"
              disabled={taslakMi}
              className="text-muted-foreground hover:text-foreground"
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSilmeAcik(true)}
              aria-label="Kontrol listesini sil"
              disabled={taslakMi}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        )}
      </header>

      {/* Progress bar — yüzde sağda küçük chip */}
      <div className="flex items-center gap-2.5">
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full transition-all duration-300",
              yuzde === 100 ? "bg-emerald-500" : "bg-primary",
            )}
            style={{ width: `${yuzde}%` }}
          />
        </div>
        <span
          className={cn(
            "shrink-0 text-[11px] font-semibold tabular-nums",
            yuzde === 100 ? "text-emerald-600" : "text-muted-foreground",
          )}
        >
          %{yuzde}
        </span>
      </div>

      {/* Madde listesi — boşsa muted placeholder */}
      {toplam > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {kl.maddeler.map((m) => (
            <li key={m.id}>
              <Madde madde={m} kartId={kartId} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground/70 px-1 text-[12.5px] italic">
          Henüz madde yok
        </p>
      )}

      {/* Madde ekleme — kompakt link / inline form */}
      {maddeAcik ? (
        <form onSubmit={maddeEkle} className="flex flex-col gap-2 sm:flex-row">
          <Input
            autoFocus
            value={yeniMadde}
            onChange={(e) => setYeniMadde(e.target.value)}
            placeholder="Yeni madde metni..."
            maxLength={500}
            className="h-9"
          />
          <div className="flex gap-2">
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
              Vazgeç
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2 h-7 self-start px-2"
          onClick={() => setMaddeAcik(true)}
        >
          <PlusIcon className="size-3.5" /> Madde ekle
        </Button>
      )}

      {/* Silme onayı — yıkıcı, geri dönüşü yok (maddeler de gider) */}
      <AlertDialog open={silmeAcik} onOpenChange={setSilmeAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kontrol listesi silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{kl.ad}</span> listesi ve içindeki{" "}
              {toplam > 0 ? (
                <>
                  <span className="font-medium">{toplam}</span> madde kalıcı
                  olarak silinecek.
                </>
              ) : (
                "tüm içerik silinecek."
              )}{" "}
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                sil.mutate({ id: kl.id });
                setSilmeAcik(false);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// =====================================================================
// Tek madde — inline metin düzenleme + undo'lu silme
// =====================================================================

function Madde({ madde, kartId }: { madde: MaddeOzeti; kartId: string }) {
  const guncelle = useMaddeGuncelle(kartId);
  const sil = useMaddeSil(kartId);
  const olustur = useMaddeOlustur(kartId);
  const istemci = useQueryClient();
  const taslak = tempIdMi(madde.id);
  const [duzenle, setDuzenle] = React.useState(false);
  const [yeniMetin, setYeniMetin] = React.useState("");

  const duzenlemeyiAc = () => {
    setYeniMetin(madde.metin);
    setDuzenle(true);
  };

  const metniKaydet = () => {
    const t = yeniMetin.trim();
    setDuzenle(false);
    if (!t || t === madde.metin) return;
    guncelle.mutate({ id: madde.id, metin: t });
  };

  const metniIptal = () => {
    setDuzenle(false);
  };

  const sileBas = () => {
    // Undo için: silmeden önce mevcut madde snapshot'ı tut, gerial toast'ında
    // tekrar oluştur. Sunucuda ID değişebilir, taslak ID ile recreate edilir.
    const snapshot: MaddeOzeti = { ...madde };
    sil.mutate({ id: madde.id });
    toast.gerial("Madde silindi", {
      onUndo: () => {
        // Sırasıyla: cache'e geri ekle (anında), sonra server'a recreate
        const anahtar = kartKontrolKey(kartId);
        istemci.setQueryData<KontrolListesiOzeti[] | undefined>(
          anahtar,
          (eski) =>
            eski?.map((kl) =>
              kl.id === snapshot.kontrol_listesi_id
                ? { ...kl, maddeler: [...kl.maddeler, snapshot] }
                : kl,
            ),
        );
        olustur.mutate({
          id_taslak: tempId(),
          kontrol_listesi_id: snapshot.kontrol_listesi_id,
          metin: snapshot.metin,
          atanan_id: snapshot.atanan_id ?? undefined,
          bitis: snapshot.bitis ?? undefined,
        });
      },
    });
  };

  return (
    <div className="hover:bg-accent/40 group/madde flex min-h-9 items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors">
      <Checkbox
        checked={madde.tamamlandi_mi}
        onCheckedChange={(v) =>
          guncelle.mutate({
            id: madde.id,
            tamamlandi_mi: v === true,
          })
        }
        disabled={taslak || duzenle}
        aria-label={`${madde.metin} tamamlandı`}
      />
      {duzenle ? (
        <Input
          autoFocus
          value={yeniMetin}
          onChange={(e) => setYeniMetin(e.target.value)}
          onBlur={metniKaydet}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              metniIptal();
            }
          }}
          maxLength={500}
          className="h-7 flex-1 text-sm"
          aria-label="Madde metni"
        />
      ) : (
        <button
          type="button"
          onClick={() => !taslak && duzenlemeyiAc()}
          disabled={taslak}
          className={cn(
            "flex-1 rounded px-1 -mx-1 py-0.5 text-left text-sm leading-snug transition",
            !taslak && "hover:bg-accent/30 cursor-text",
            madde.tamamlandi_mi &&
              "text-muted-foreground/70 line-through decoration-muted-foreground/50",
          )}
          title="Düzenlemek için tıklayın"
        >
          {madde.metin}
        </button>
      )}
      {madde.atanan && !duzenle && (
        <span className="text-muted-foreground bg-muted/60 shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium">
          {madde.atanan.ad} {madde.atanan.soyad[0]}.
        </span>
      )}
      {!duzenle && (
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover/madde:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={duzenlemeyiAc}
            disabled={taslak}
            aria-label="Maddeyi düzenle"
            className="text-muted-foreground hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={sileBas}
            disabled={taslak}
            aria-label="Maddeyi sil"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
