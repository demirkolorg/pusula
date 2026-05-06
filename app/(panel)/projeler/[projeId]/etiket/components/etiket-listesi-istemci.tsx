"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEtiketler, useEtiketRealtime, useEtiketSil } from "../hooks";
import type { EtiketOzeti } from "../services";
import { EtiketFormDialog } from "./etiket-form-dialog";
import { EtiketSilDiyalog } from "./etiket-sil-diyalog";
import { EtiketRozet } from "./etiket-rozet";

export type EtiketYetkileri = {
  olustur: boolean;
  duzenle: boolean;
  sil: boolean;
};

type Props = {
  projeId: string;
  yetkiler: EtiketYetkileri;
};

export function EtiketListesiIstemci({ projeId, yetkiler }: Props) {
  // Proje room'una katıl + CRUD eventlerini dinle (Kural 56, 114)
  useEtiketRealtime(projeId);

  const sorgu = useEtiketler(projeId);
  const [yeniAcik, setYeniAcik] = React.useState(false);
  const [duzenlenen, setDuzenlenen] = React.useState<EtiketOzeti | null>(null);
  const [silinecek, setSilinecek] = React.useState<EtiketOzeti | null>(null);

  const sil = useEtiketSil(projeId);

  const yukleniyor = sorgu.isLoading;
  const etiketler = sorgu.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {yukleniyor
            ? "Yükleniyor…"
            : etiketler.length === 0
              ? "Henüz etiket yok."
              : `${etiketler.length} etiket`}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setYeniAcik(true)}
          disabled={!yetkiler.olustur}
          aria-label="Yeni etiket"
        >
          <Plus className="size-4" /> Yeni Etiket
        </Button>
      </div>

      {yukleniyor ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : etiketler.length === 0 ? (
        <BosDurum
          yetkili={yetkiler.olustur}
          ekleTikla={() => setYeniAcik(true)}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {etiketler.map((e) => (
            <EtiketSatiri
              key={e.id}
              projeId={projeId}
              etiket={e}
              yetkiler={yetkiler}
              duzenleTikla={() => setDuzenlenen(e)}
              silTikla={() => setSilinecek(e)}
            />
          ))}
        </ul>
      )}

      <EtiketFormDialog
        acik={yeniAcik}
        kapat={() => setYeniAcik(false)}
        projeId={projeId}
        duzenlenen={null}
      />
      <EtiketFormDialog
        acik={!!duzenlenen}
        kapat={() => setDuzenlenen(null)}
        projeId={projeId}
        duzenlenen={duzenlenen}
      />
      <EtiketSilDiyalog
        kayit={
          silinecek
            ? {
                id: silinecek.id,
                ad: silinecek.ad,
                renk: silinecek.renk,
                kart_sayisi: 0,
              }
            : null
        }
        kapat={() => setSilinecek(null)}
        onayla={(id) => {
          sil.mutate({ id });
          setSilinecek(null);
        }}
        yukleniyor={sil.isPending}
      />
    </div>
  );
}

function EtiketSatiri({
  projeId,
  etiket,
  yetkiler,
  duzenleTikla,
  silTikla,
}: {
  projeId: string;
  etiket: EtiketOzeti;
  yetkiler: EtiketYetkileri;
  duzenleTikla: () => void;
  silTikla: () => void;
}) {
  return (
    <li className="hover:bg-accent/40 flex items-center gap-3 rounded-xl border p-3 transition-colors">
      <span
        className="size-4 shrink-0 rounded"
        style={{ backgroundColor: etiket.renk }}
        aria-hidden
      />
      <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span className="flex-1 truncate font-medium">{etiket.ad}</span>
        <div className="flex items-center gap-1.5">
          <EtiketRozet etiket={etiket} boyut="sm" />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href={`/projeler/${projeId}/etiket/${etiket.id}`}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label={`${etiket.ad} etiketini içeren kartlar`}
        >
          <ArrowRight className="size-4" />
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={duzenleTikla}
          disabled={!yetkiler.duzenle}
          aria-label={`${etiket.ad} etiketini düzenle`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={silTikla}
          disabled={!yetkiler.sil}
          aria-label={`${etiket.ad} etiketini sil`}
        >
          <Trash2 className="text-destructive size-4" />
        </Button>
      </div>
    </li>
  );
}

function BosDurum({
  yetkili,
  ekleTikla,
}: {
  yetkili: boolean;
  ekleTikla: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Tag className="text-muted-foreground size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">Henüz etiket tanımlı değil</p>
        <p className="text-muted-foreground text-sm">
          Kartlarınızı kategorize etmek için renkli etiketler tanımlayabilirsiniz.
        </p>
      </div>
      {yetkili && (
        <Button type="button" size="sm" onClick={ekleTikla}>
          <Plus className="size-4" /> İlk etiketi oluştur
        </Button>
      )}
    </div>
  );
}
