"use client";

// Arama sonuç satırı: renkli ikon kutusu + başlık (vurgulu) + meta + tip badge.
// Altay search-result-item.tsx tasarımı referans alındı; Pusula domain'ine
// uyarlandı (9 kart/yorum/madde/eklenti/kullanici/birim/etiket/proje/liste tipi).

import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  CheckSquareIcon,
  FolderKanbanIcon,
  KanbanSquareIcon,
  ListIcon,
  MessageSquareIcon,
  PaperclipIcon,
  TagIcon,
  Building2Icon,
  TagsIcon,
  UserIcon,
} from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { AramaVurgula } from "./arama-vurgula";
import { TIP_BASLIK, type AramaSonucu } from "../tipler";
import type { AramaTipi } from "../schemas";

type TipKonfig = {
  ikon: LucideIcon;
  arkaplan: string;
  metinRenk: string;
};

// Her tip için renk paleti — light + dark aynı tabloda. Altay'ın kategori
// ikonu/renk haritası mantığı.
const TIP_KONFIG: Record<AramaTipi, TipKonfig> = {
  kart: {
    ikon: KanbanSquareIcon,
    arkaplan: "bg-blue-100 dark:bg-blue-900/30",
    metinRenk: "text-blue-600 dark:text-blue-400",
  },
  yorum: {
    ikon: MessageSquareIcon,
    arkaplan: "bg-emerald-100 dark:bg-emerald-900/30",
    metinRenk: "text-emerald-600 dark:text-emerald-400",
  },
  madde: {
    ikon: CheckSquareIcon,
    arkaplan: "bg-cyan-100 dark:bg-cyan-900/30",
    metinRenk: "text-cyan-600 dark:text-cyan-400",
  },
  eklenti: {
    ikon: PaperclipIcon,
    arkaplan: "bg-sky-100 dark:bg-sky-900/30",
    metinRenk: "text-sky-600 dark:text-sky-400",
  },
  kullanici: {
    ikon: UserIcon,
    arkaplan: "bg-purple-100 dark:bg-purple-900/30",
    metinRenk: "text-purple-600 dark:text-purple-400",
  },
  birim: {
    ikon: Building2Icon,
    arkaplan: "bg-stone-100 dark:bg-stone-900/30",
    metinRenk: "text-stone-600 dark:text-stone-400",
  },
  etiket: {
    ikon: TagIcon,
    arkaplan: "bg-amber-100 dark:bg-amber-900/30",
    metinRenk: "text-amber-600 dark:text-amber-400",
  },
  proje: {
    ikon: FolderKanbanIcon,
    arkaplan: "bg-indigo-100 dark:bg-indigo-900/30",
    metinRenk: "text-indigo-600 dark:text-indigo-400",
  },
  liste: {
    ikon: ListIcon,
    arkaplan: "bg-violet-100 dark:bg-violet-900/30",
    metinRenk: "text-violet-600 dark:text-violet-400",
  },
};

type Props = {
  sonuc: AramaSonucu;
  sorgu: string;
  onSec: (sonuc: AramaSonucu) => void;
};

export function AramaSonucItem({ sonuc, sorgu, onSec }: Props) {
  const konfig = TIP_KONFIG[sonuc.tip];
  const Ikon = konfig.ikon;

  return (
    <CommandItem
      // cmdk'nin kendi filter'ı kapalı (shouldFilter={false}), value tutarlı
      // olsun yine de — keyboard navigasyon için.
      value={`${sonuc.tip}-${sonuc.id}-${sonuc.baslik}`}
      onSelect={() => onSec(sonuc)}
      className="group flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 mx-1 my-0.5"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${konfig.arkaplan}`}
      >
        {sonuc.tip === "etiket" && (sonuc as { renk?: string }).renk ? (
          <TagsIcon
            className={`h-5 w-5 ${konfig.metinRenk}`}
            // Etiket için kart kapak renk token'ı
            style={{ color: (sonuc as { renk?: string }).renk ?? undefined }}
          />
        ) : (
          <Ikon className={`h-5 w-5 ${konfig.metinRenk}`} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <AramaVurgula
            metin={sonuc.baslik}
            sorgu={sorgu}
            className="truncate font-medium"
          />
          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px]">
            {TIP_BASLIK[sonuc.tip]}
          </span>
        </div>
        {sonuc.detay && (
          <AramaVurgula
            metin={kisalt(sonuc.detay)}
            sorgu={sorgu}
            className="text-muted-foreground truncate text-xs"
          />
        )}
        {/* Tip-spesifik meta footer */}
        <MetaSatiri sonuc={sonuc} />
      </div>

      <div className="ml-1 flex shrink-0 self-center">
        <ChevronRight className="text-muted-foreground/30 group-data-[selected=true]:text-muted-foreground h-4 w-4 transition-colors" />
      </div>
    </CommandItem>
  );
}

function kisalt(metin: string, max = 140): string {
  if (metin.length <= max) return metin;
  return metin.slice(0, max) + "…";
}

function MetaSatiri({ sonuc }: { sonuc: AramaSonucu }) {
  if (sonuc.tip === "kullanici") {
    const k = sonuc as Extract<AramaSonucu, { tip: "kullanici" }>;
    if (!k.email) return null;
    return (
      <span className="text-muted-foreground/80 mt-0.5 truncate text-[10px]">
        {k.email}
      </span>
    );
  }
  return null;
}
