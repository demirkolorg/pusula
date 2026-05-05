"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowRightLeftIcon,
  CalendarIcon,
  HashIcon,
  LinkIcon,
  PaletteIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { toast } from "@/lib/toast";
import {
  projeDetayKey,
  useKartGeriYukle,
  useKartGuncelle,
  useKartSil,
  useKartTasi,
} from "../hooks/detay-sorgulari";
import type { ListeKartOzeti, ListeOzeti } from "../services";
import { KartBaglamRenkSubmenu } from "./kart-baglam-renk-submenu";
import { KartBaglamEtiketSubmenu } from "./kart-baglam-etiket-submenu";
import { KartBaglamYetkiliSubmenu } from "./kart-baglam-yetkili-submenu";
import { KartBaglamTarihSubmenu } from "./kart-baglam-tarih-submenu";
import { KartBaglamTasiSubmenu } from "./kart-baglam-tasi-submenu";

export type KartBaglamYetkileri = {
  duzenle: boolean;
  yetkiliYonet: boolean;
  tasi: boolean;
  arsivle: boolean;
  sil: boolean;
};

type Props = {
  kart: ListeKartOzeti;
  listeId: string;
  projeId: string;
  listeler: ReadonlyArray<{ id: string; ad: string; arsiv_mi: boolean }>;
  yetkiler: KartBaglamYetkileri;
};

// Trello tarzı sağ tık menüsü. Modalı tetiklemeyen hızlı aksiyonlar burada;
// detaylı düzenleme modal'a havale edilir. Mobilde Sheet versiyonu kart-mini
// üzerinden long-press ile açılır.
export function KartBaglamMenusu({
  kart,
  listeId,
  projeId,
  listeler,
  yetkiler,
}: Props) {
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const guncelle = useKartGuncelle(anahtar);
  const sil = useKartSil(anahtar);
  const geriYukle = useKartGeriYukle(anahtar);
  const tasi = useKartTasi(anahtar);

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
  };

  const tarihKaydet = (yeni: Date | null) => {
    guncelle.mutate({ id: kart.id, bitis: yeni });
  };

  const listeyeTasi = (hedefListeId: string) => {
    if (hedefListeId === listeId) return;
    tasi.mutate({
      id: kart.id,
      hedef_liste_id: hedefListeId,
      onceki_id: null,
      sonraki_id: null,
      kaynak_liste_id: listeId,
      onceki_sira: null,
      sonraki_sira: null,
    });
  };

  return (
    <ContextMenuContent>
      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={!yetkiler.duzenle}>
          <PaletteIcon /> Kapak rengi
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <KartBaglamRenkSubmenu
            kartId={kart.id}
            projeId={projeId}
            mevcut={kart.kapak_renk}
          />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={!yetkiler.yetkiliYonet}>
          <TagIcon /> Etiketler
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <KartBaglamEtiketSubmenu kartId={kart.id} projeId={projeId} />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={!yetkiler.yetkiliYonet}>
          <UserIcon /> Yetkililer
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <KartBaglamYetkiliSubmenu kartId={kart.id} projeId={projeId} />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={!yetkiler.duzenle}>
          <CalendarIcon /> Tarih
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <KartBaglamTarihSubmenu mevcut={kart.bitis} kaydet={tarihKaydet} />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={!yetkiler.tasi}>
          <ArrowRightLeftIcon /> Listeye taşı
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <KartBaglamTasiSubmenu
            mevcutListeId={listeId}
            listeler={listeler}
            tasi={listeyeTasi}
          />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={baglantiKopyala}>
        <LinkIcon /> Bağlantıyı kopyala
      </ContextMenuItem>
      <ContextMenuItem onClick={kodKopyala}>
        <HashIcon /> Kodu kopyala
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={arsivToggle} disabled={!yetkiler.arsivle}>
        {kart.arsiv_mi ? (
          <>
            <ArchiveRestoreIcon /> Arşivden çıkar
          </>
        ) : (
          <>
            <ArchiveIcon /> Arşivle
          </>
        )}
      </ContextMenuItem>
      <ContextMenuItem
        variant="destructive"
        onClick={sileBas}
        disabled={!yetkiler.sil}
      >
        <Trash2Icon /> Sil
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

// Helper: page.tsx tarafından üretilen ProjeYetkileri'nden bağlam yetkilerini
// türet — UI'ye prop drilling kolaylığı.
export function baglamYetkilerinden(opts: {
  duzenleyebilir: boolean;
  silebilir: boolean;
  tasiyabilir: boolean;
}): KartBaglamYetkileri {
  return {
    duzenle: opts.duzenleyebilir,
    yetkiliYonet: opts.duzenleyebilir,
    tasi: opts.tasiyabilir,
    arsivle: opts.duzenleyebilir,
    sil: opts.silebilir,
  };
}

// Liste prop'u için minimal alan — page.tsx'te ProjeDetayOzeti.listeler
// üzerinden türetilir.
export function listeOzetiCikar(
  listeler: ReadonlyArray<ListeOzeti>,
): ReadonlyArray<{ id: string; ad: string; arsiv_mi: boolean }> {
  return listeler.map((l) => ({ id: l.id, ad: l.ad, arsiv_mi: l.arsiv_mi }));
}
