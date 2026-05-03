"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
  UsersIcon,
  ListIcon,
  AlertTriangleIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { tempIdMi } from "@/lib/temp-id";
import { cn } from "@/lib/utils";
import { kapakArkaplanSinifi } from "@/lib/kapak-renk";
import type { ProjeKart as ProjeKartTipi } from "../services";

type Props = {
  proje: ProjeKartTipi;
  yetkili: boolean;
  onDuzenle: () => void;
  onArsivAc: (yeniDurum: boolean) => void;
  onSil: () => void;
  onYildiz: (yeniDurum: boolean) => void;
  onGeriYukle: () => void;
};

export function ProjeKart({
  proje,
  yetkili,
  onDuzenle,
  onArsivAc,
  onSil,
  onYildiz,
  onGeriYukle,
}: Props) {
  const taslakMi = tempIdMi(proje.id);
  const baglanti = taslakMi ? "#" : `/projeler/${proje.id}`;

  const kapakSinifi = kapakArkaplanSinifi(proje.kapak_renk);

  return (
    <div
      className={cn(
        "bg-card group relative flex flex-col overflow-hidden rounded-lg border shadow-sm transition hover:shadow-md",
        proje.silindi_mi && "opacity-70",
      )}
    >
      <Link
        href={baglanti}
        onClick={(e) => taslakMi && e.preventDefault()}
        className="block"
      >
        <div
          className={cn("h-20 w-full", kapakSinifi ?? "bg-muted")}
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-medium leading-tight">
              {proje.ad}
            </h3>
            {proje.yildizli_mi && (
              <StarIcon
                className="text-secondary size-4 shrink-0"
                fill="currentColor"
              />
            )}
          </div>
          {proje.aciklama && (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {proje.aciklama}
            </p>
          )}
          <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <ListIcon className="size-3" /> {proje.liste_sayisi}
            </span>
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="size-3" /> {proje.uye_sayisi}
            </span>
          </div>
        </div>
      </Link>

      {taslakMi && (
        <div
          className="text-muted-foreground absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5 text-[10px]"
          title="Sunucu yanıtı bekleniyor"
        >
          <AlertTriangleIcon className="size-3" /> Hazırlanıyor
        </div>
      )}

      {!taslakMi && (
        <div className="border-t p-2">
          <div className="flex items-center justify-end gap-1">
            {proje.silindi_mi ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onGeriYukle}
                disabled={!yetkili}
                aria-label="Geri yükle"
              >
                <RotateCcwIcon className="size-4" />
                <span className="hidden sm:inline">Geri Yükle</span>
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onYildiz(!proje.yildizli_mi)}
                  disabled={!yetkili}
                  aria-label={proje.yildizli_mi ? "Yıldızı kaldır" : "Yıldızla"}
                >
                  <StarIcon
                    className={cn(
                      "size-4",
                      proje.yildizli_mi && "fill-secondary text-secondary",
                    )}
                  />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDuzenle}
                  disabled={!yetkili}
                  aria-label="Düzenle"
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onArsivAc(!proje.arsiv_mi)}
                  disabled={!yetkili}
                  aria-label={proje.arsiv_mi ? "Arşivden çıkar" : "Arşivle"}
                >
                  {proje.arsiv_mi ? (
                    <ArchiveRestoreIcon className="size-4" />
                  ) : (
                    <ArchiveIcon className="size-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSil}
                  disabled={!yetkili}
                  aria-label="Sil"
                >
                  <Trash2Icon className="text-destructive size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
