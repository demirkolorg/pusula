"use client";

// React Compiler kuralları dnd-kit ref/listener pattern'i ile uyumsuz.
/* eslint-disable react-hooks/refs */

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarIcon, TagIcon, UsersIcon } from "lucide-react";
import { tempIdMi } from "@/lib/temp-id";
import { cn } from "@/lib/utils";
import { kapakArkaplanSinifi } from "@/lib/kapak-renk";
import type { ListeKartOzeti } from "../services";

type Props = {
  kart: ListeKartOzeti;
  listeId: string;
  yetkili: boolean;
  onAc: () => void;
};

function tarihEtiketi(d: Date | null): string | null {
  if (!d) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(d instanceof Date ? d : new Date(d));
}

export function KartMini({ kart, listeId, yetkili, onAc }: Props) {
  const taslak = tempIdMi(kart.id);
  // KRİTİK: data objesi her render'da yeni referans olursa dnd-kit diff
  // tetikleyip state güncelliyor → re-render → infinite loop. useMemo ile sabitle.
  const sortableData = React.useMemo(
    () => ({ tip: "kart" as const, liste_id: listeId }),
    [listeId],
  );
  const sortable = useSortable({
    id: kart.id,
    data: sortableData,
    disabled: taslak || !yetkili,
  });
  const { active } = useDndContext();

  const stil: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    // Drop sonrası "akma" engeli: aktif drag yokken transition disable.
    transition: active ? sortable.transition : "none",
    touchAction: "none",
  };

  const kapakSinifi = kapakArkaplanSinifi(kart.kapak_renk);
  const tarih = tarihEtiketi(kart.bitis);
  const ruyaModu = sortable.isDragging;

  // TEK root + conditional içerik. İki farklı return ile setNodeRef'i farklı
  // DOM düğümlerine bağlamak dnd-kit'i sonsuz state değişikliği döngüsüne sokar.
  return (
    <div
      ref={sortable.setNodeRef}
      style={stil}
      {...(ruyaModu ? {} : sortable.attributes)}
      {...(ruyaModu ? {} : sortable.listeners)}
      onClick={
        ruyaModu
          ? undefined
          : (e) => {
              e.stopPropagation();
              if (!taslak) onAc();
            }
      }
      className={cn(
        // Sürüklenirken: primary ince kesik çizgili placeholder
        ruyaModu &&
          "border-primary/60 bg-primary/5 rounded-md border border-dashed p-2",
        // Normal kart
        !ruyaModu &&
          "bg-card hover:border-foreground/30 group flex flex-col gap-1 rounded-md border p-2 text-sm shadow-sm",
        !ruyaModu && yetkili && !taslak && "cursor-grab active:cursor-grabbing",
      )}
      role={ruyaModu ? undefined : "button"}
      tabIndex={ruyaModu ? -1 : 0}
      aria-hidden={ruyaModu || undefined}
      onKeyDown={
        ruyaModu
          ? undefined
          : (e) => {
              if ((e.key === "Enter" || e.key === " ") && !taslak) {
                e.preventDefault();
                onAc();
              }
            }
      }
    >
      {ruyaModu ? (
        <div className="invisible">
          <span className="line-clamp-3 font-medium leading-snug">
            {kart.baslik}
          </span>
        </div>
      ) : (
        <>
          {/* Görsel kapak öncelikli — Trello tarzı geniş bant. Kapağın
              hem görseli hem rengi varsa görsel gösterilir (services
              kapak ayarlarken renk null'ler — defansif kontrol). */}
          {kart.kapak ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned URL,
            // remotePatterns whitelist'i kuruluma bağlı; <img> ile basit kalır.
            <img
              src={kart.kapak.url}
              alt=""
              className="-mx-2 -mt-2 mb-1 h-24 w-[calc(100%+1rem)] rounded-t-md object-cover"
              loading="lazy"
              draggable={false}
            />
          ) : kapakSinifi ? (
            <div className={cn("-mx-2 -mt-2 mb-1 h-6 rounded-t-md", kapakSinifi)} />
          ) : null}
          <span className="line-clamp-3 font-medium leading-snug">
            {kart.baslik}
          </span>
          {(tarih || kart.uye_sayisi > 0 || kart.etiket_sayisi > 0) && (
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
              {tarih && (
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  {tarih}
                </span>
              )}
              {kart.etiket_sayisi > 0 && (
                <span className="inline-flex items-center gap-1">
                  <TagIcon className="size-3" />
                  {kart.etiket_sayisi}
                </span>
              )}
              {kart.uye_sayisi > 0 && (
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="size-3" />
                  {kart.uye_sayisi}
                </span>
              )}
            </div>
          )}
          {taslak && (
            <span className="text-muted-foreground text-[10px]">Hazırlanıyor…</span>
          )}
        </>
      )}
    </div>
  );
}
