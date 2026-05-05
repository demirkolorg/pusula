"use client";

import * as React from "react";
import { ActivityIcon } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type { KisiMap } from "@/lib/mention";
import { useProjeYetkilileri } from "../../yetkili/hooks";
import { useProjeAktiviteleri } from "../hooks";
import { AktiviteListesi } from "./aktivite-listesi";

// Proje header'ından açılan büyük aktivite modalı — proje altındaki TÜM
// kayıtların audit log'unu zaman çizelgesinde gösterir. Tasarım referansı:
// kart detay modalındaki aktivite sekmesi (AktiviteListesi).
//
// Mobile: bottom sheet (ResponsiveDialog → Sheet); desktop: center dialog.
export function ProjeAktiviteModal({
  projeId,
  acik,
  onAcikDegisti,
}: {
  projeId: string;
  acik: boolean;
  onAcikDegisti: (a: boolean) => void;
}) {
  // `etkin` flag — modal kapalıyken sorgu durdurulur (network tasarrufu).
  // İlk açılışta tetiklenir, sonra TanStack Query cache'inden gelir.
  const sorgu = useProjeAktiviteleri(projeId, acik);
  const yetkililerQ = useProjeYetkilileri(acik ? projeId : "");

  const kisiMap: KisiMap = React.useMemo(() => {
    const m: KisiMap = new Map();
    for (const u of yetkililerQ.data ?? []) {
      m.set(u.kullanici_id, { ad: u.ad, soyad: u.soyad });
    }
    return m;
  }, [yetkililerQ.data]);

  return (
    <ResponsiveDialog open={acik} onOpenChange={onAcikDegisti}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 text-base">
            <span
              className="bg-muted text-muted-foreground inline-flex size-7 items-center justify-center rounded-full"
              aria-hidden
            >
              <ActivityIcon className="size-3.5" />
            </span>
            Proje aktivitesi
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-muted-foreground text-[12px]">
            Bu projede yapılan her değişiklik — listeler, kartlar, yorumlar,
            eklentiler, kontrol maddeleri, etiketler, yetkililer — zaman
            çizelgesinde görünür.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="-mr-2 max-h-[70vh] overflow-y-auto pr-2">
          <AktiviteListesi
            data={sorgu.data}
            yukleniyor={sorgu.isLoading}
            kisiMap={kisiMap}
            bosBaslik="Bu projede henüz aktivite yok."
            bosAciklama="Projede yapılan her hareket — kart oluşturma, taşıma, yorum, etiket, yetkili, kontrol maddesi — burada timeline olarak görünür."
          />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
