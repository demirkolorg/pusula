"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  Building2Icon,
  CheckCircle2Icon,
  CheckSquareIcon,
  KanbanIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { tempIdMi } from "@/lib/temp-id";
import { cn } from "@/lib/utils";
import { kapakKutusuSiniflari } from "@/lib/kapak-renk";
import { ikonMu } from "@/lib/kapak-ikon";
import type { ProjeKart as ProjeKartTipi } from "../services";
import { ProjeKartAksiyonMenusu } from "./proje-kart-aksiyon-menusu";

type Props = {
  proje: ProjeKartTipi;
  yetkili: boolean;
  onDuzenle: () => void;
  onArsivAc: (yeniDurum: boolean) => void;
  onSil: () => void;
  onYildiz: (yeniDurum: boolean) => void;
  onGeriYukle: () => void;
};

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

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

  const kutuSinifi = kapakKutusuSiniflari(proje.kapak_renk);
  const ikon = ikonMu(proje.kapak_ikon) ? proje.kapak_ikon : null;

  const kartYuzde = yuzdeHesapla(
    proje.tamamlanan_kart_sayisi,
    proje.kart_sayisi,
  );
  const maddeYuzde = yuzdeHesapla(
    proje.tamamlanan_madde_sayisi,
    proje.madde_sayisi,
  );

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
        className="flex flex-1 flex-col gap-3 p-4"
        aria-label={proje.ad}
      >
        {/* Başlık satırı: küçük renkli ikon + ad + yıldız */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-md",
              kutuSinifi,
            )}
            aria-hidden="true"
          >
            {ikon ? (
              <DynamicIcon name={ikon} className="size-5" />
            ) : (
              <KanbanIcon className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
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
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                {proje.aciklama}
              </p>
            )}
          </div>
        </div>

        {/* Tek satır metadata: yetkili kişi · birim · liste · kart · madde */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="size-3.5" />
                  {proje.yetkili_sayisi}
                </span>
              }
            />
            <TooltipContent>
              Proje, liste ve kartlardaki yetkili personel
            </TooltipContent>
          </Tooltip>
          {proje.birim_sayisi > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex items-center gap-1">
                    <Building2Icon className="size-3.5" />
                    {proje.birim_sayisi}
                  </span>
                }
              />
              <TooltipContent>
                Proje, liste ve kartlardaki yetkili birim
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center gap-1">
                  <KanbanIcon className="size-3.5" />
                  {proje.liste_sayisi}
                </span>
              }
            />
            <TooltipContent>Liste sayısı</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center gap-1">
                  <CheckSquareIcon className="size-3.5" />
                  {proje.kart_sayisi}
                </span>
              }
            />
            <TooltipContent>Toplam kart</TooltipContent>
          </Tooltip>
          {proje.madde_sayisi > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2Icon className="size-3.5" />
                    {proje.madde_sayisi}
                  </span>
                }
              />
              <TooltipContent>Kontrol maddesi</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Progress barlar — sayı varsa göster, sıkıştırılmış */}
        {(proje.kart_sayisi > 0 || proje.madde_sayisi > 0) && (
          <div className="mt-auto flex flex-col gap-1.5 pt-1">
            {proje.kart_sayisi > 0 && (
              <Ilerleme
                etiket="Kartlar"
                tamamlanan={proje.tamamlanan_kart_sayisi}
                toplam={proje.kart_sayisi}
                yuzde={kartYuzde}
              />
            )}
            {proje.madde_sayisi > 0 && (
              <Ilerleme
                etiket="Maddeler"
                tamamlanan={proje.tamamlanan_madde_sayisi}
                toplam={proje.madde_sayisi}
                yuzde={maddeYuzde}
              />
            )}
          </div>
        )}
      </Link>

      {taslakMi && (
        <div
          className="text-muted-foreground bg-background/80 absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px]"
          title="Sunucu yanıtı bekleniyor"
        >
          <AlertTriangleIcon className="size-3" /> Hazırlanıyor
        </div>
      )}

      {!taslakMi && (
        <div className="text-muted-foreground flex items-center justify-between gap-2 border-t px-3 py-2 text-xs">
          <div className="min-w-0 truncate">
            {proje.olusturan ? (
              <span title={`${proje.olusturan.ad} ${proje.olusturan.soyad}`}>
                {proje.olusturan.ad} {proje.olusturan.soyad} ·{" "}
                {TARIH_BICIM.format(proje.olusturma_zamani)}
              </span>
            ) : (
              <span>{TARIH_BICIM.format(proje.olusturma_zamani)}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {!proje.silindi_mi && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onYildiz(!proje.yildizli_mi)}
                disabled={!yetkili}
                aria-label={proje.yildizli_mi ? "Yıldızı kaldır" : "Yıldızla"}
                className="size-8 p-0"
              >
                <StarIcon
                  className={cn(
                    "size-4",
                    proje.yildizli_mi && "fill-secondary text-secondary",
                  )}
                />
              </Button>
            )}
            <ProjeKartAksiyonMenusu
              silinmis={proje.silindi_mi}
              arsivde={proje.arsiv_mi}
              yetkili={yetkili}
              onDuzenle={onDuzenle}
              onArsivAc={onArsivAc}
              onSil={onSil}
              onGeriYukle={onGeriYukle}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function yuzdeHesapla(tamamlanan: number, toplam: number): number {
  if (toplam <= 0) return 0;
  return Math.round((tamamlanan / toplam) * 100);
}

function Ilerleme({
  etiket,
  tamamlanan,
  toplam,
  yuzde,
}: {
  etiket: string;
  tamamlanan: number;
  toplam: number;
  yuzde: number;
}) {
  const tamamMi = yuzde >= 100;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-muted-foreground flex items-center justify-between text-[10px] font-medium">
        <span>{etiket}</span>
        <span>
          {tamamlanan}/{toplam} · %{yuzde}
        </span>
      </div>
      <div
        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-label={`${etiket} ilerleme`}
        aria-valuenow={yuzde}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tamamMi ? "bg-palet-yesil" : "bg-primary",
          )}
          style={{ width: `${yuzde}%` }}
        />
      </div>
    </div>
  );
}
