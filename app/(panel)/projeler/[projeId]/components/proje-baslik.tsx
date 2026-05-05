"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProjeDetayOzeti } from "../services";
import { ProjeBaslikKimlik } from "./proje-baslik-kimlik";
import { ProjeBaslikSekmeler } from "./proje-baslik-sekmeler";
import {
  ProjeBaslikAksiyonlar,
  type ProjeBaslikAksiyonYetkileri,
} from "./proje-baslik-aksiyonlar";
import { ProjeAramaSheet } from "./proje-arama-sheet";

export type ProjeBaslikYetkileri = {
  yildizla: boolean;
  yetkililerYonet: boolean;
  arama: boolean;
  duzenle: boolean;
  arsivle: boolean;
};

type Props = {
  proje: ProjeDetayOzeti;
  yetkiler: ProjeBaslikYetkileri;
};

// Tek satır header — sol kimlik, orta sekmeler (desktop), sağ aksiyonlar.
// Mobile'da sekme stripi alt satıra düşer. Header altında border yok —
// görsel olarak sayfa içeriğiyle akıcı geçiş.
//
// Cmd/Ctrl+K kısayolu genel arama paletine ait; proje içi arama yalnızca
// header'daki buton ile açılır.
export function ProjeBaslik({ proje, yetkiler }: Props) {
  const [aramaAcik, setAramaAcik] = React.useState(false);

  const aksiyonYetkileri: ProjeBaslikAksiyonYetkileri = React.useMemo(
    () => ({
      arama: yetkiler.arama,
      yetkililerYonet: yetkiler.yetkililerYonet,
      duzenle: yetkiler.duzenle,
      arsivle: yetkiler.arsivle,
    }),
    [
      yetkiler.arama,
      yetkiler.yetkililerYonet,
      yetkiler.duzenle,
      yetkiler.arsivle,
    ],
  );

  return (
    <>
      {/* Tek satır header — h-13 (52px) mobile, h-14 (56px) desktop.
          Border yok; sayfayla görsel akıcı geçiş. */}
      <header
        className={cn(
          "flex h-13 items-center gap-3 bg-background px-3 sm:h-14 sm:gap-4 sm:px-4",
        )}
      >
        <ProjeBaslikKimlik
          proje={proje}
          yildizlayabilir={yetkiler.yildizla}
          duzenleyebilir={yetkiler.duzenle}
          className="min-w-0 flex-1"
        />

        <ProjeBaslikSekmeler
          projeId={proje.id}
          className="hidden md:inline-flex"
        />

        <ProjeBaslikAksiyonlar
          proje={proje}
          yetkiler={aksiyonYetkileri}
          onAramaAc={() => setAramaAcik(true)}
        />
      </header>

      {/* Mobile sekme stripi — desktop'ta gizli; tek satır kapasitesi olmayan
          ekranlarda alt satırda yer alır. */}
      <div className="bg-background overflow-x-auto px-3 py-1.5 md:hidden">
        <ProjeBaslikSekmeler projeId={proje.id} />
      </div>

      {yetkiler.arama && (
        <ProjeAramaSheet
          projeId={proje.id}
          acik={aramaAcik}
          setAcik={setAramaAcik}
        />
      )}
    </>
  );
}
