"use client";

import * as React from "react";
import { useKartPresence } from "@/hooks/use-socket";
import { useOturumKullanicisi } from "@/hooks/use-oturum";
import { UyeAvatar } from "../uye/components/uye-avatar";

type Props = {
  kartId: string;
};

// Trello "viewing now" pattern. Kart modal açıldığında kullanıcı kart room'a
// katılır; aynı kart'ı izleyen diğerlerinin avatar grubu gösterilir.
// Kullanıcı kendisini listede görmek istemiyor — filtrelenir.
export function KartPresence({ kartId }: Props) {
  const { kullanicilar } = useKartPresence(kartId);
  const oturumQ = useOturumKullanicisi();
  const oturumId = oturumQ.data?.id;

  const baskalari = React.useMemo(
    () => kullanicilar.filter((u) => u.id !== oturumId),
    [kullanicilar, oturumId],
  );

  if (baskalari.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1"
      title={`${baskalari.length} kişi görüntülüyor`}
    >
      <span className="bg-emerald-500 size-1.5 animate-pulse rounded-full" aria-hidden />
      <span className="text-muted-foreground text-[10.5px]">
        {baskalari.length === 1 ? "1 kişi izliyor" : `${baskalari.length} kişi izliyor`}
      </span>
      <div className="ml-1 flex -space-x-1.5">
        {baskalari.slice(0, 3).map((u) => (
          <UyeAvatar
            key={u.id}
            ad={u.ad}
            soyad={u.soyad}
            className="ring-background size-5 ring-2 text-[8px]"
            title={`${u.ad} ${u.soyad}`}
          />
        ))}
        {baskalari.length > 3 && (
          <span className="ring-background bg-muted text-muted-foreground inline-flex size-5 items-center justify-center rounded-full ring-2 text-[9px]">
            +{baskalari.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}
