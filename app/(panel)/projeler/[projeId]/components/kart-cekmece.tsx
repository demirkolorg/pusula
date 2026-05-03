"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { CalendarIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

export function KartCekmece({ kartId, projeId, kapat }: Props) {
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

  // Açılan kart değişince form alanlarını eşitle (effect setState — compiler
  // uyumlu değil; başka çözüm: kart id ile re-key.).
  const ozelKartId = bulunan?.kart.id;
  // Bilinçli: form değerlerini sadece kart id değiştiğinde sıfırla; bulunan
  // referansı her render'da yeni obje olsa bile form'u yeniden basmak istemiyoruz.
  React.useEffect(() => {
    if (!bulunan) return;
    setBaslik(bulunan.kart.baslik);
    setAciklama(bulunan.kart.aciklama ?? "");
    setBitis(tarihInputDegeri(bulunan.kart.bitis));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 'bulunan' bilerek dependency'de yok
  }, [ozelKartId]);

  if (!kartId || !bulunan) {
    return (
      <Sheet open={!!kartId} onOpenChange={(a) => !a && kapat()}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Kart bulunamadı</SheetTitle>
            <SheetDescription>
              Bu kart silinmiş veya başka bir projeye taşınmış olabilir.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
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
    <Sheet open={!!kartId} onOpenChange={(a) => !a && kapat()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-base">{bulunan.liste_ad}</SheetTitle>
          <SheetDescription>
            Kart detayları — yorumlar, eklentiler ve etiketler S4&apos;te eklenecek.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="kart-baslik">Başlık</Label>
            <Input
              id="kart-baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              onBlur={baslikKaydet}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kart-aciklama">Açıklama</Label>
            <Textarea
              id="kart-aciklama"
              rows={6}
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
            />
          </div>

          <KartHedefKurumlar kartId={bulunan.kart.id} />
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={sileBas}>
            <Trash2Icon className="size-4" /> Sil
          </Button>
          <Button onClick={kapat}>Kapat</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
