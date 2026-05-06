"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronRight,
  ExternalLink,
  KanbanSquare,
  List as ListIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aktiviteAnlati } from "@/lib/aktivite/anlati";
import { cn } from "@/lib/utils";
import {
  KATEGORI_IKON,
  kategoriArkaplan,
  kategoriYazi,
  aktiviteKullaniciAdi,
} from "@/app/(panel)/projeler/[projeId]/aktivite/components/aktivite-listesi";
import type { SonAktiviteSatiri } from "../schemas";
import { AktiviteDetayDiyalog } from "./aktivite-detay-diyalog";
import { gruplaraAyir } from "./son-aktiviteler-helper";

const SAAT_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

// Bugün/dün için sadece saat, daha eski tarihler için tarih + saat göster.
function kisaZaman(d: Date, grup: string): string {
  if (grup === "bugun" || grup === "dun") {
    return SAAT_FORMAT.format(new Date(d));
  }
  return TARIH_KISA.format(new Date(d));
}

const ISLEM_RENGI: Record<
  SonAktiviteSatiri["islem"],
  string
> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  UPDATE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

const ISLEM_ETIKETI: Record<SonAktiviteSatiri["islem"], string> = {
  CREATE: "Yeni",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
};

type MetinParcasi = {
  metin: string;
  vurgulu: boolean;
};

function vurguHedefleri(aktivite: SonAktiviteSatiri): string[] {
  return [
    aktivite.baglam?.proje?.ad,
    aktivite.baglam?.liste?.ad,
    aktivite.baglam?.kart?.baslik,
  ]
    .filter((deger): deger is string => Boolean(deger?.trim()))
    .flatMap((deger) => [`'${deger}'`, deger])
    .sort((a, b) => b.length - a.length);
}

function vurguluParcalaraAyir(
  metin: string,
  hedefler: readonly string[],
): MetinParcasi[] {
  if (hedefler.length === 0) return [{ metin, vurgulu: false }];
  const parcalar: MetinParcasi[] = [];
  let konum = 0;

  while (konum < metin.length) {
    let bulunan: { hedef: string; indeks: number } | null = null;
    for (const hedef of hedefler) {
      const indeks = metin.indexOf(hedef, konum);
      if (indeks === -1) continue;
      if (!bulunan || indeks < bulunan.indeks) bulunan = { hedef, indeks };
    }

    if (!bulunan) {
      parcalar.push({ metin: metin.slice(konum), vurgulu: false });
      break;
    }

    if (bulunan.indeks > konum) {
      parcalar.push({
        metin: metin.slice(konum, bulunan.indeks),
        vurgulu: false,
      });
    }
    parcalar.push({ metin: bulunan.hedef, vurgulu: true });
    konum = bulunan.indeks + bulunan.hedef.length;
  }

  return parcalar;
}

export function SonAktiviteler({
  aktiviteler,
  denetimErisimi = false,
}: {
  aktiviteler: readonly SonAktiviteSatiri[];
  denetimErisimi?: boolean;
}) {
  const [secili, setSecili] = useState<SonAktiviteSatiri | null>(null);
  const gruplar = gruplaraAyir(aktiviteler);

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="shrink-0 flex-row items-center justify-between space-y-0 border-b">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4" />
            Son Aktiviteler
          </CardTitle>
          {denetimErisimi && (
            <Link
              href="/aktivite-gunlugu"
              className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-1 px-1 text-xs font-medium transition-colors"
            >
              Tüm Aktiviteler
              <ExternalLink className="size-3" />
            </Link>
          )}
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
          {aktiviteler.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">
              Henüz aktivite yok.
            </div>
          ) : (
            <div className="divide-y">
              {gruplar.map((g) => (
                <section key={g.grup}>
                  <div className="bg-muted/30 text-muted-foreground sticky top-0 z-10 flex items-center justify-between px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                    <span>{g.baslik}</span>
                    <span className="tabular-nums">{g.satirlar.length}</span>
                  </div>
                  <ul className="divide-y">
                    {g.satirlar.map((a) => (
                      <AktiviteSatir
                        key={a.id}
                        aktivite={a}
                        grup={g.grup}
                        onSec={() => setSecili(a)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AktiviteDetayDiyalog kayit={secili} kapat={() => setSecili(null)} />
    </>
  );
}

function AktiviteSatir({
  aktivite,
  grup,
  onSec,
}: {
  aktivite: SonAktiviteSatiri;
  grup: string;
  onSec: () => void;
}) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  const kim = aktiviteKullaniciAdi(aktivite);
  const anlati = aktiviteAnlati(aktivite);
  const anlatiParcalari = vurguluParcalaraAyir(
    anlati.metin,
    vurguHedefleri(aktivite),
  );

  return (
    <li>
      <button
        type="button"
        onClick={onSec}
        className={cn(
          // 44px hit target (Kural 11)
          "hover:bg-muted/40 focus-visible:bg-muted/40 group flex w-full min-h-11 items-start gap-3 px-4 py-3 text-left transition-colors",
          "focus-visible:outline-none",
        )}
        aria-label={`${kim}: ${aktivite.mesaj} — detay görüntüle`}
      >
        {/* Sol: kategori ikonu (renkli) */}
        <span
          className={cn(
            "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
            kategoriArkaplan(aktivite.kategori),
          )}
          aria-hidden
        >
          <Ikon className={cn("size-4", kategoriYazi(aktivite.kategori))} />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-foreground line-clamp-2 text-sm font-medium leading-5">
            {anlatiParcalari.map((parca, index) =>
              parca.vurgulu ? (
                <strong key={`${parca.metin}-${index}`} className="font-bold">
                  {parca.metin}
                </strong>
              ) : (
                <span key={`${parca.metin}-${index}`}>{parca.metin}</span>
              ),
            )}
          </div>

          {(aktivite.baglam?.proje || aktivite.baglam?.liste) && (
            <BaglamZinciri baglam={aktivite.baglam} />
          )}

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px]">
            <span
              className={cn(
                "inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold",
                ISLEM_RENGI[aktivite.islem],
              )}
            >
              {ISLEM_ETIKETI[aktivite.islem]}
            </span>
            {aktivite.detay && (
              <span className="line-clamp-1">{aktivite.detay}</span>
            )}
          </div>
        </div>

        <div className="text-muted-foreground mt-0.5 flex shrink-0 items-center gap-1 text-[11px] tabular-nums">
          {kisaZaman(aktivite.zaman, grup)}
          <ChevronRight className="text-muted-foreground/40 group-hover:text-muted-foreground size-3.5 transition-colors" />
        </div>
      </button>
    </li>
  );
}

function BaglamZinciri({
  baglam,
}: {
  baglam: NonNullable<SonAktiviteSatiri["baglam"]>;
}) {
  const proje = baglam.proje;
  const liste = baglam.liste;
  if (!proje && !liste) return null;
  return (
    <div className="text-muted-foreground/85 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px]">
      {proje && (
        <span className="inline-flex max-w-[200px] items-center gap-1 truncate">
          <KanbanSquare className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {proje.ad ?? (
              <span className="italic opacity-70">(silinmiş proje)</span>
            )}
          </span>
        </span>
      )}
      {proje && liste && (
        <span className="text-muted-foreground/40" aria-hidden>
          ›
        </span>
      )}
      {liste && (
        <span className="inline-flex max-w-[180px] items-center gap-1 truncate">
          <ListIcon className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {liste.ad ?? (
              <span className="italic opacity-70">(silinmiş liste)</span>
            )}
          </span>
        </span>
      )}
    </div>
  );
}
