"use client";

import * as React from "react";
import { ListIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { KartModalSectionBaslik } from "./kart-modal-section-baslik";

type Props = {
  aciklama: string;
  setAciklama: (yeni: string) => void;
  kaydet: () => void;
};

// Sancak referansı: section header (list ikon + ACIKLAMA) + boş ise dashed
// empty-slot, dolu ise satır 14px / lh 1.65 metin (markdown-light: **bold** / • bullet).
export function KartModalAciklama({ aciklama, setAciklama, kaydet }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <KartModalSectionBaslik icon={ListIcon} baslik="Açıklama" />
      <Textarea
        id="kart-aciklama"
        rows={5}
        value={aciklama}
        onChange={(e) => setAciklama(e.target.value)}
        onBlur={kaydet}
        placeholder="Detay ekle, bağlam paylaş, link yapıştır…"
        className="leading-[1.65] text-[14px]"
      />
    </div>
  );
}
