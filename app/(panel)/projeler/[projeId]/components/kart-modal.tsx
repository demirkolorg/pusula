"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import {
  CalendarIcon,
  CheckSquareIcon,
  LinkIcon,
  PaperclipIcon,
  TagIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { toast } from "@/lib/toast";
import {
  projeDetayKey,
  useKartGeriYukle,
  useKartGuncelle,
  useKartSil,
  useProjeDetay,
} from "../hooks/detay-sorgulari";
import type { ListeKartOzeti, ProjeDetayOzeti } from "../services";
import { KartHedefKurumlar } from "./kart-hedef-kurumlar";
import { EtiketPopover } from "../etiket/components/etiket-popover";
import { EtiketRozet } from "../etiket/components/etiket-rozet";
import { useEtiketler, useKartEtiketleri } from "../etiket/hooks";

type Props = {
  kartId: string | null;
  projeId: string;
  kapat: () => void;
};

function kartiBul(
  detay: ProjeDetayOzeti | undefined,
  kartId: string | null,
): { kart: ListeKartOzeti; liste_ad: string } | null {
  if (!detay || !kartId) return null;
  for (const l of detay.listeler) {
    const k = l.kartlar.find((x) => x.id === kartId);
    if (k) return { kart: k, liste_ad: l.ad };
  }
  return null;
}

function tarihInputDegeri(d: Date | null): string {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

export function KartModal({ kartId, projeId, kapat }: Props) {
  return (
    <ResponsiveDialog open={!!kartId} onOpenChange={(a) => !a && kapat()}>
      {/* Trello-tarzı geniş modal — Kural 13 desktop center modal,
          Kural 9 mobile-first: mobil'de Sheet (alttan), desktop'ta Dialog (max-w-4xl). */}
      <ResponsiveDialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:!max-w-4xl">
        {kartId ? (
          <KartModalIcerik kartId={kartId} projeId={projeId} kapat={kapat} />
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function KartModalIcerik({ kartId, projeId, kapat }: { kartId: string; projeId: string; kapat: () => void }) {
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const sorgu = useProjeDetay(projeId);
  const bulunan = kartiBul(sorgu.data, kartId);

  const guncelle = useKartGuncelle(anahtar);
  const sil = useKartSil(anahtar);
  const geriYukle = useKartGeriYukle(anahtar);

  const [baslik, setBaslik] = React.useState(bulunan?.kart.baslik ?? "");
  const [aciklama, setAciklama] = React.useState(
    bulunan?.kart.aciklama ?? "",
  );
  const [bitis, setBitis] = React.useState<string>(
    tarihInputDegeri(bulunan?.kart.bitis ?? null),
  );

  const ozelKartId = bulunan?.kart.id;
  // Kart id değişince form'u sıfırla; aynı kart için her render'da reset etme.
  React.useEffect(() => {
    if (!bulunan) return;
    setBaslik(bulunan.kart.baslik);
    setAciklama(bulunan.kart.aciklama ?? "");
    setBitis(tarihInputDegeri(bulunan.kart.bitis));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 'bulunan' bilerek dependency'de yok
  }, [ozelKartId]);

  if (!bulunan) {
    return (
      <>
        <ResponsiveDialogHeader className="border-b p-4">
          <ResponsiveDialogTitle>Kart bulunamadı</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Bu kart silinmiş veya başka bir projeye taşınmış olabilir.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
      </>
    );
  }

  const baslikKaydet = () => {
    if (!baslik.trim() || baslik === bulunan.kart.baslik) return;
    guncelle.mutate({ id: bulunan.kart.id, baslik: baslik.trim() });
  };

  const aciklamaKaydet = () => {
    if (aciklama === (bulunan.kart.aciklama ?? "")) return;
    guncelle.mutate({
      id: bulunan.kart.id,
      aciklama: aciklama || null,
    });
  };

  const bitisKaydet = () => {
    const yeni = bitis ? new Date(bitis) : null;
    const eski = bulunan.kart.bitis
      ? new Date(bulunan.kart.bitis).toISOString().slice(0, 10)
      : "";
    if (bitis === eski) return;
    guncelle.mutate({ id: bulunan.kart.id, bitis: yeni });
  };

  const sileBas = () => {
    sil.mutate({ id: bulunan.kart.id });
    toast.gerial("Kart silindi", {
      onUndo: () =>
        geriYukle.mutate(
          { id: bulunan.kart.id },
          { onSuccess: () => toast.basari("Kart geri yüklendi") },
        ),
    });
    kapat();
  };

  return (
    <>
      <ResponsiveDialogHeader className="border-b p-4">
        <p className="text-muted-foreground text-xs">{bulunan.liste_ad}</p>
        <ResponsiveDialogTitle className="sr-only">
          {bulunan.kart.baslik}
        </ResponsiveDialogTitle>
        <Input
          aria-label="Kart başlığı"
          value={baslik}
          onChange={(e) => setBaslik(e.target.value)}
          onBlur={baslikKaydet}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="!h-auto border-0 bg-transparent !px-0 !py-1 text-base font-semibold shadow-none focus-visible:ring-0 sm:text-lg"
        />
        <KartEtiketRozetleri kartId={bulunan.kart.id} projeId={projeId} />
        <ResponsiveDialogDescription className="sr-only">
          Kart detayları — başlık, açıklama, hedef kurumlar ve diğer alanlar.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[1fr_220px]">
        {/* Sol kolon: ana içerik */}
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="grid gap-2">
            <Label htmlFor="kart-aciklama">Açıklama</Label>
            <Textarea
              id="kart-aciklama"
              rows={5}
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              onBlur={aciklamaKaydet}
              placeholder="Kart hakkında not..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kart-bitis">
              <CalendarIcon className="mr-1 inline size-3" /> Bitiş Tarihi
            </Label>
            <Input
              id="kart-bitis"
              type="date"
              value={bitis}
              onChange={(e) => setBitis(e.target.value)}
              onBlur={bitisKaydet}
              className="max-w-xs"
            />
          </div>

          <KartHedefKurumlar kartId={bulunan.kart.id} />

          {/* S4'te eklenecek: Yorumlar timeline'ı */}
        </div>

        {/* Sağ sidebar: Trello "Add to card" panel — S4 modülleri buraya bağlanacak */}
        <aside className="flex flex-col gap-3 border-t bg-muted/30 p-4 md:border-l md:border-t-0">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Karta Ekle
          </p>
          <div className="flex flex-col gap-1.5">
            <EtiketPopover
              kartId={bulunan.kart.id}
              projeId={projeId}
              trigger={
                <Button variant="ghost" className="justify-start">
                  <TagIcon className="size-4" /> Etiketler
                </Button>
              }
            />
            <SidebarBtn icon={UsersIcon} label="Üyeler" yakinda />
            <SidebarBtn icon={CheckSquareIcon} label="Kontrol Listesi" yakinda />
            <SidebarBtn icon={PaperclipIcon} label="Eklenti" yakinda />
            <SidebarBtn icon={LinkIcon} label="İlişkili Kart" yakinda />
          </div>

          <p className="text-muted-foreground mt-2 text-xs font-medium uppercase tracking-wide">
            İşlemler
          </p>
          <Button
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive"
            onClick={sileBas}
          >
            <Trash2Icon className="size-4" /> Kartı Sil
          </Button>
        </aside>
      </div>
    </>
  );
}

function KartEtiketRozetleri({
  kartId,
  projeId,
}: {
  kartId: string;
  projeId: string;
}) {
  const tum = useEtiketler(projeId);
  const seciliQ = useKartEtiketleri(kartId);
  const seciliSet = React.useMemo(
    () => new Set(seciliQ.data ?? []),
    [seciliQ.data],
  );
  const seciliEtiketler = React.useMemo(
    () => (tum.data ?? []).filter((e) => seciliSet.has(e.id)),
    [tum.data, seciliSet],
  );
  if (seciliEtiketler.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {seciliEtiketler.map((e) => (
        <EtiketRozet key={e.id} etiket={e} />
      ))}
    </div>
  );
}

function SidebarBtn({
  icon: Icon,
  label,
  yakinda,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  yakinda?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      className="justify-start"
      disabled={yakinda}
      onClick={() => yakinda && toast.bilgi(`${label} — yakında eklenecek (S4)`)}
    >
      <Icon className="size-4" /> {label}
      {yakinda && (
        <span className="text-muted-foreground ml-auto text-xs">Yakında</span>
      )}
    </Button>
  );
}
