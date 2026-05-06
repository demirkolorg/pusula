"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  FolderIcon,
  KanbanIcon,
  KanbanSquareIcon,
  ListIcon,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { kapakKutusuSiniflari } from "@/lib/kapak-renk";
import { ikonMu } from "@/lib/kapak-ikon";
import { useProjeIcerigi } from "../hooks/kullan-proje-icerik";
import type {
  ProjeIciDosya,
  ProjeKartGrubu,
  ProjeListeGrubu,
} from "../services-proje-gorunumu";
import { DosyaOnizlemeKarti } from "./dosya-onizleme-karti";

// Proje görünümü drilldown ekranı: bir projenin dosyaları liste/kart
// hiyerarşisinde gruplu. Üstte breadcrumb, sonra doğrudan proje dosyaları
// (varsa), sonra her liste için bir bölüm; her listenin altında listeye
// doğrudan bağlı dosyalar ve kart kart altında dosyalar.

type Props = {
  projeId: string;
  onGeri: () => void;
  onDosyaSec: (dosyaId: string) => void;
  seciliDosyaId: string | null;
};

export function ProjeIcerik({
  projeId,
  onGeri,
  onDosyaSec,
  seciliDosyaId,
}: Props) {
  const sorgu = useProjeIcerigi(projeId);

  if (sorgu.isLoading) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Yükleniyor…
      </p>
    );
  }
  if (sorgu.error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-destructive text-sm">{sorgu.error.message}</p>
        <Button type="button" variant="outline" size="sm" onClick={onGeri}>
          Projelere geri dön
        </Button>
      </div>
    );
  }
  if (!sorgu.data) return null;

  const { proje, dogrudan_dosyalar, listeler, toplam_dosya } = sorgu.data;
  const kutuSinifi = kapakKutusuSiniflari(proje.kapak_renk);
  const ikon = ikonMu(proje.kapak_ikon) ? proje.kapak_ikon : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb + başlık */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onGeri}
          className="gap-1.5 min-h-[44px]"
          aria-label="Projelere geri dön"
        >
          <ChevronLeftIcon className="size-4" />
          Projeler
        </Button>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-md",
              kutuSinifi,
            )}
            aria-hidden
          >
            {ikon ? (
              <DynamicIcon name={ikon} className="size-4" />
            ) : (
              <KanbanIcon className="size-4" />
            )}
          </div>
          <h2 className="text-lg font-semibold">{proje.ad}</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {toplam_dosya} dosya
          </span>
        </div>
      </div>

      {toplam_dosya === 0 ? (
        <BosProje />
      ) : (
        <div className="flex flex-col gap-6">
          {dogrudan_dosyalar.length > 0 && (
            <Bolum
              ikon={<FolderIcon className="size-4" />}
              baslik="Doğrudan projeye bağlı"
              dosyalar={dogrudan_dosyalar}
              onDosyaSec={onDosyaSec}
              seciliDosyaId={seciliDosyaId}
            />
          )}

          {listeler.map((l) => (
            <ListeBolumu
              key={l.id}
              liste={l}
              onDosyaSec={onDosyaSec}
              seciliDosyaId={seciliDosyaId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListeBolumu({
  liste,
  onDosyaSec,
  seciliDosyaId,
}: {
  liste: ProjeListeGrubu;
  onDosyaSec: (dosyaId: string) => void;
  seciliDosyaId: string | null;
}) {
  const toplam =
    liste.dosyalar.length +
    liste.kartlar.reduce((acc, k) => acc + k.dosyalar.length, 0);
  if (toplam === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <ListIcon className="text-purple-700 dark:text-purple-300 size-4" />
        <h3 className="text-sm font-semibold">{liste.ad}</h3>
        <span className="text-muted-foreground text-xs tabular-nums">
          {toplam} dosya
        </span>
      </header>

      {liste.dosyalar.length > 0 && (
        <DosyaGrid
          dosyalar={liste.dosyalar}
          onDosyaSec={onDosyaSec}
          seciliDosyaId={seciliDosyaId}
        />
      )}

      {liste.kartlar.map((k) => (
        <KartBolumu
          key={k.id}
          kart={k}
          onDosyaSec={onDosyaSec}
          seciliDosyaId={seciliDosyaId}
        />
      ))}
    </section>
  );
}

function KartBolumu({
  kart,
  onDosyaSec,
  seciliDosyaId,
}: {
  kart: ProjeKartGrubu;
  onDosyaSec: (dosyaId: string) => void;
  seciliDosyaId: string | null;
}) {
  if (kart.dosyalar.length === 0) return null;
  return (
    <div className="border-l-2 ml-2 pl-3 flex flex-col gap-2 border-purple-200 dark:border-purple-900/40">
      <div className="flex items-center gap-1.5">
        <KanbanSquareIcon className="text-blue-700 dark:text-blue-300 size-3.5" />
        <p className="text-xs font-medium">{kart.baslik}</p>
        <span className="text-muted-foreground text-[10px] tabular-nums">
          {kart.dosyalar.length}
        </span>
      </div>
      <DosyaGrid
        dosyalar={kart.dosyalar}
        onDosyaSec={onDosyaSec}
        seciliDosyaId={seciliDosyaId}
      />
    </div>
  );
}

function Bolum({
  ikon,
  baslik,
  dosyalar,
  onDosyaSec,
  seciliDosyaId,
}: {
  ikon: React.ReactNode;
  baslik: string;
  dosyalar: ProjeIciDosya[];
  onDosyaSec: (dosyaId: string) => void;
  seciliDosyaId: string | null;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        {ikon}
        <h3 className="text-sm font-semibold">{baslik}</h3>
        <span className="text-muted-foreground text-xs tabular-nums">
          {dosyalar.length} dosya
        </span>
      </header>
      <DosyaGrid
        dosyalar={dosyalar}
        onDosyaSec={onDosyaSec}
        seciliDosyaId={seciliDosyaId}
      />
    </section>
  );
}

function DosyaGrid({
  dosyalar,
  onDosyaSec,
  seciliDosyaId,
}: {
  dosyalar: ProjeIciDosya[];
  onDosyaSec: (dosyaId: string) => void;
  seciliDosyaId: string | null;
}) {
  return (
    <ul
      role="list"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      {dosyalar.map((d) => (
        <li key={d.id}>
          <DosyaOnizlemeKarti
            dosya={d}
            onSec={onDosyaSec}
            seciliMi={seciliDosyaId === d.id}
          />
        </li>
      ))}
    </ul>
  );
}

function BosProje() {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
      <FolderIcon className="mx-auto size-10 opacity-40" />
      <p className="mt-3 text-sm">Bu projede henüz dosya yok.</p>
    </div>
  );
}
