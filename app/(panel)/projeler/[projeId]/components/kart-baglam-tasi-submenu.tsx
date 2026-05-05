"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { ContextMenuItem } from "@/components/ui/context-menu";

type ListeOzeti = {
  id: string;
  ad: string;
  arsiv_mi: boolean;
};

type Props = {
  mevcutListeId: string;
  listeler: ReadonlyArray<ListeOzeti>;
  tasi: (hedefListeId: string) => void;
};

// Kartı başka listeye taşı submenu — proje listeleri (arşivlenmiş hariç).
// Mevcut liste devre dışı + check işareti. Hedefe sona eklenir; sıralama
// ayarlanmak istenirse drag-drop kullanılır.
export function KartBaglamTasiSubmenu({
  mevcutListeId,
  listeler,
  tasi,
}: Props) {
  const aktifListeler = listeler.filter((l) => !l.arsiv_mi);

  if (aktifListeler.length === 0) {
    return (
      <div className="text-muted-foreground px-2 py-1.5 text-xs">
        Başka liste yok
      </div>
    );
  }

  return (
    <>
      {aktifListeler.map((l) => {
        const buListe = l.id === mevcutListeId;
        return (
          <ContextMenuItem
            key={l.id}
            disabled={buListe}
            onClick={() => tasi(l.id)}
          >
            <span className="flex-1 truncate">{l.ad}</span>
            {buListe && <CheckIcon className="size-3.5" />}
          </ContextMenuItem>
        );
      })}
    </>
  );
}
