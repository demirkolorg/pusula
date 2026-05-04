"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
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
import { KartModalHeader } from "./kart-modal-header";
import { KartModalAksiyonMenusu } from "./kart-modal-aksiyon-menusu";
import { KartModalBaslik } from "./kart-modal-baslik";
import { KartModalMetaChips } from "./kart-modal-meta-chips";
import { KartModalAciklama } from "./kart-modal-aciklama";
import { KartModalKontrolBlogu } from "./kart-modal-kontrol-blogu";
import { KartModalYanPanel } from "./kart-modal-yan-panel";

type Props = {
  kartId: string | null;
  projeId: string;
  kapat: () => void;
};

function kartiBul(
  detay: ProjeDetayOzeti | undefined,
  kartId: string | null,
): {
  kart: ListeKartOzeti;
  liste_ad: string;
  proje_ad: string;
} | null {
  if (!detay || !kartId) return null;
  for (const l of detay.listeler) {
    const k = l.kartlar.find((x) => x.id === kartId);
    if (k) return { kart: k, liste_ad: l.ad, proje_ad: detay.ad };
  }
  return null;
}

export function KartModal({ kartId, projeId, kapat }: Props) {
  return (
    <ResponsiveDialog open={!!kartId} onOpenChange={(a) => !a && kapat()}>
      {/* Modal viewport'un %70'ini kaplar (genişlik + yükseklik). DialogContent
          default'undaki `sm:max-w-sm` üzerine yazmak için inline style ile
          genişlik zorlanır; max-w override'ı da none ile temizlenir.
          Kural 13 — mobilde Sheet (alttan), desktop'ta center modal. */}
      <ResponsiveDialogContent
        showCloseButton={false}
        style={{ width: "70vw", maxWidth: "1200px", height: "85vh", maxHeight: "85vh" }}
        className="flex flex-col gap-0 overflow-hidden p-0 sm:!max-w-none"
      >
        {kartId ? (
          <KartModalIcerik kartId={kartId} projeId={projeId} kapat={kapat} />
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function KartModalIcerik({
  kartId,
  projeId,
  kapat,
}: {
  kartId: string;
  projeId: string;
  kapat: () => void;
}) {
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

  const ozelKartId = bulunan?.kart.id;
  // Kart id değişince form'u sıfırla; aynı kart için her render'da reset etme.
  React.useEffect(() => {
    if (!bulunan) return;
    setBaslik(bulunan.kart.baslik);
    setAciklama(bulunan.kart.aciklama ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 'bulunan' bilerek dependency'de yok
  }, [ozelKartId]);

  if (!bulunan) {
    return (
      <ResponsiveDialogHeader className="border-b p-4">
        <ResponsiveDialogTitle>Kart bulunamadı</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Bu kart silinmiş veya başka bir projeye taşınmış olabilir.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
    );
  }

  const kart = bulunan.kart;

  const baslikKaydet = () => {
    if (!baslik.trim() || baslik === kart.baslik) return;
    guncelle.mutate({ id: kart.id, baslik: baslik.trim() });
  };

  const aciklamaKaydet = () => {
    if (aciklama === (kart.aciklama ?? "")) return;
    guncelle.mutate({ id: kart.id, aciklama: aciklama || null });
  };

  const bitisKaydet = (yeni: Date | null) => {
    guncelle.mutate({ id: kart.id, bitis: yeni });
  };

  const baglantiKopyala = () => {
    try {
      const url = `${window.location.origin}/projeler/${projeId}?kart=${kart.id}`;
      void navigator.clipboard.writeText(url);
      toast.basari("Kart bağlantısı kopyalandı");
    } catch {
      toast.hata("Bağlantı kopyalanamadı");
    }
  };

  const kodKopyala = () => {
    try {
      void navigator.clipboard.writeText(kart.id);
      toast.basari("Kart kodu kopyalandı");
    } catch {
      toast.hata("Kod kopyalanamadı");
    }
  };

  const arsivToggle = () => {
    const sonraki = !kart.arsiv_mi;
    guncelle.mutate({ id: kart.id, arsiv_mi: sonraki });
    toast.bilgi(sonraki ? "Kart arşivlendi" : "Kart arşivden çıkarıldı");
  };

  const sileBas = () => {
    sil.mutate({ id: kart.id });
    toast.gerial("Kart silindi", {
      onUndo: () =>
        geriYukle.mutate(
          { id: kart.id },
          { onSuccess: () => toast.basari("Kart geri yüklendi") },
        ),
    });
    kapat();
  };

  return (
    <>
      {/* Erişilebilirlik: KartModalBaslik görsel başlığı; aria gereksinimleri
          için Title/Description sr-only kalıyor. */}
      <ResponsiveDialogTitle className="sr-only">
        {kart.baslik}
      </ResponsiveDialogTitle>
      <ResponsiveDialogDescription className="sr-only">
        Kart detayları — başlık, açıklama, üyeler, etiketler, kontrol listesi,
        ekler ve yorumlar.
      </ResponsiveDialogDescription>

      <KartModalHeader
        projeAd={bulunan.proje_ad}
        listeAd={bulunan.liste_ad}
        baglantiKopyala={baglantiKopyala}
        aksiyonMenu={
          <KartModalAksiyonMenusu
            arsivMi={kart.arsiv_mi}
            baglantiKopyala={baglantiKopyala}
            kodKopyala={kodKopyala}
            arsivToggle={arsivToggle}
            sileBas={sileBas}
          />
        }
      />

      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[1fr_360px]">
        {/* Sol kolon: başlık scroll içinde sticky kalır, scroll edildikçe
            kart başlığı görünürlüğü kaybolmasın. */}
        <div className="flex flex-col overflow-y-auto">
          <div className="bg-background sticky top-0 z-10 px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
            <KartModalBaslik
              baslik={baslik}
              setBaslik={setBaslik}
              kaydet={baslikKaydet}
            />
          </div>

          <div className="flex flex-col gap-[22px] px-4 pb-4 sm:px-6 sm:pb-5">
            <KartModalMetaChips
              kartId={kart.id}
              projeId={projeId}
              bitis={kart.bitis}
              bitisKaydet={bitisKaydet}
            />

            <KartModalAciklama
              aciklama={aciklama}
              setAciklama={setAciklama}
              kaydet={aciklamaKaydet}
            />

            <KartModalKontrolBlogu kartId={kart.id} />
          </div>
        </div>

        {/* Sağ sidebar: sekmeli yan panel (Yorumlar / Aktivite / Ekler / Tümü) */}
        <KartModalYanPanel kartId={kart.id} projeId={projeId} />
      </div>
    </>
  );
}
