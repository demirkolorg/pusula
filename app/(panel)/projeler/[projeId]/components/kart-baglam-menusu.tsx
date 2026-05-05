"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CalendarIcon,
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
  useKartArsivToggle,
  useKartGeriYukle,
  useKartGuncelle,
  useKartSil,
} from "../hooks/detay-sorgulari";
import type { ListeKartOzeti } from "../services";
import { KartBaglamRenkSubmenu } from "./kart-baglam-renk-submenu";
import { KartBaglamEtiketSubmenu } from "./kart-baglam-etiket-submenu";
import { KartBaglamYetkiliSubmenu } from "./kart-baglam-yetkili-submenu";
import { KartBaglamTarihSubmenu } from "./kart-baglam-tarih-submenu";

export type KartBaglamYetkileri = {
  duzenle: boolean;
  yetkiliYonet: boolean;
  arsivle: boolean;
  sil: boolean;
};

type Props = {
  kart: ListeKartOzeti;
  projeId: string;
  yetkiler: KartBaglamYetkileri;
};

// Trello tarzı sağ tık menüsü. Modalı tetiklemeyen hızlı aksiyonlar burada;
// detaylı düzenleme modal'a havale edilir. Mobilde Sheet versiyonu kart-mini
// üzerinden long-press ile açılır.
export function KartBaglamMenusu({ kart, projeId, yetkiler }: Props) {
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const guncelle = useKartGuncelle(anahtar);
  const sil = useKartSil(anahtar);
  const geriYukle = useKartGeriYukle(anahtar);
  const arsivToggleMut = useKartArsivToggle(anahtar);

  const arsivToggle = () => {
    const sonraki = !kart.arsiv_mi;
    // ADR-0009 — Server kartı sistem Arşiv listesine taşır (arşivle) veya
    // arsiv_oncesi_liste_id'ye geri yükler (arşivden çıkar).
    arsivToggleMut.mutate(
      { id: kart.id, arsiv: sonraki },
      {
        onSuccess: () => {
          toast.bilgi(sonraki ? "Kart arşivlendi" : "Kart arşivden çıkarıldı");
        },
      },
    );
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
