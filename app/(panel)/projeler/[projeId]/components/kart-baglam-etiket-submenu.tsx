"use client";

import * as React from "react";
import { ContextMenuCheckboxItem } from "@/components/ui/context-menu";
import {
  useEtiketler,
  useKartEtiketleri,
  useKartaEtiketEkle,
  useKartaEtiketKaldir,
} from "../etiket/hooks";

type Props = {
  kartId: string;
  projeId: string;
};

// Etiket toggle submenu — proje etiketleri checkbox listesi.
// Yeni etiket oluşturma akışı modal'daki popover'da kalır (mikro bileşen
// prensibi — bağlam menüsü hızlı toggle için, yönetim için değil).
export function KartBaglamEtiketSubmenu({ kartId, projeId }: Props) {
  const etiketlerQ = useEtiketler(projeId);
  const seciliQ = useKartEtiketleri(kartId);
  const ekle = useKartaEtiketEkle(kartId, projeId);
  const kaldir = useKartaEtiketKaldir(kartId, projeId);

  const seciliSet = React.useMemo(
    () => new Set(seciliQ.data ?? []),
    [seciliQ.data],
  );

  const tum = etiketlerQ.data ?? [];

  if (tum.length === 0) {
    return (
      <div className="text-muted-foreground px-2 py-1.5 text-xs">
        {etiketlerQ.isLoading ? "Yükleniyor…" : "Henüz etiket yok"}
      </div>
    );
  }

  const toggle = (etiketId: string, secili: boolean) => {
    if (secili) {
      kaldir.mutate({ kart_id: kartId, etiket_id: etiketId });
    } else {
      ekle.mutate({ kart_id: kartId, etiket_id: etiketId });
    }
  };

  return (
    <>
      {tum.map((e) => {
        const seciliMi = seciliSet.has(e.id);
        return (
          <ContextMenuCheckboxItem
            key={e.id}
            checked={seciliMi}
            onClick={(ev) => {
              ev.preventDefault();
              toggle(e.id, seciliMi);
            }}
          >
            <span
              className="size-3 rounded"
              style={{ backgroundColor: e.renk }}
              aria-hidden
            />
            <span className="truncate">{e.ad}</span>
          </ContextMenuCheckboxItem>
        );
      })}
    </>
  );
}
