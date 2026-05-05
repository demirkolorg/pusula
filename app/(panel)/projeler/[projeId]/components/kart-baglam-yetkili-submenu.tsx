"use client";

import * as React from "react";
import { ContextMenuCheckboxItem } from "@/components/ui/context-menu";
import {
  useKartYetkilileri,
  useKartaYetkiliEkle,
  useKartaYetkiliKaldir,
  useProjeYetkilileri,
} from "../yetkili/hooks";

type Props = {
  kartId: string;
  projeId: string;
};

// Karta yetkili toggle submenu — proje yetkilileri checkbox listesi.
// Karta proje üyesi olmayan kullanıcı eklenemez (zaten kanban yetkilileri
// proje yetkililerinin alt kümesi); arama/aday ekranı modal'da kalır.
export function KartBaglamYetkiliSubmenu({ kartId, projeId }: Props) {
  const projeQ = useProjeYetkilileri(projeId);
  const kartQ = useKartYetkilileri(kartId);
  const ekle = useKartaYetkiliEkle(kartId, projeId);
  const kaldir = useKartaYetkiliKaldir(kartId, projeId);

  const seciliSet = React.useMemo(
    () =>
      new Set((kartQ.data ?? []).map((u) => u.kullanici_id)),
    [kartQ.data],
  );

  const tum = projeQ.data ?? [];

  if (tum.length === 0) {
    return (
      <div className="text-muted-foreground px-2 py-1.5 text-xs">
        {projeQ.isLoading ? "Yükleniyor…" : "Proje yetkilisi yok"}
      </div>
    );
  }

  const toggle = (kullaniciId: string, secili: boolean) => {
    if (secili) {
      kaldir.mutate({ kart_id: kartId, kullanici_id: kullaniciId });
    } else {
      ekle.mutate({ kart_id: kartId, kullanici_id: kullaniciId });
    }
  };

  return (
    <>
      {tum.map((u) => {
        const seciliMi = seciliSet.has(u.kullanici_id);
        const adSoyad = `${u.ad} ${u.soyad}`.trim() || u.email;
        return (
          <ContextMenuCheckboxItem
            key={u.kullanici_id}
            checked={seciliMi}
            onClick={(ev) => {
              ev.preventDefault();
              toggle(u.kullanici_id, seciliMi);
            }}
          >
            <span className="truncate">{adSoyad}</span>
          </ContextMenuCheckboxItem>
        );
      })}
    </>
  );
}
