"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useBildirimTercihGuncelle,
  useBildirimTercihleri,
} from "../hooks";
import { TERCIH_GRUPLARI, TIP_METNI } from "../tip-gruplari";
import type { TercihSatir } from "../services";
import type { BildirimTipi } from "@/app/(panel)/bildirimler/schemas";

export function BildirimTercihleriMatrix() {
  const sorgu = useBildirimTercihleri();
  const guncelle = useBildirimTercihGuncelle();

  const tercihMap = React.useMemo(() => {
    const map = new Map<BildirimTipi, TercihSatir>();
    for (const t of sorgu.data ?? []) map.set(t.tip, t);
    return map;
  }, [sorgu.data]);

  if (sorgu.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Tercihleriniz yükleniyor…
      </div>
    );
  }

  if (sorgu.isError) {
    return (
      <p className="text-sm text-destructive">
        Tercihler yüklenemedi. Sayfayı yenileyin.
      </p>
    );
  }

  // Global toplu işlem — tüm tipleri tek seferde aç/kapat. tercih kaydı
  // yoksa default açık olduğundan, kapatmak için her tipi ayrı kaydetmek
  // gerek (tek Promise.all batch).
  const tumTipler = React.useMemo<BildirimTipi[]>(
    () => TERCIH_GRUPLARI.flatMap((g) => [...g.tipler]),
    [],
  );

  const tumKanaliAyarla = (
    kanal: "in_app_acik" | "email_acik",
    deger: boolean,
  ) => {
    for (const tip of tumTipler) {
      guncelle.mutate({ tip, [kanal]: deger });
    }
  };

  const grupKanaliAyarla = (
    tipler: ReadonlyArray<BildirimTipi>,
    kanal: "in_app_acik" | "email_acik",
    deger: boolean,
  ) => {
    for (const tip of tipler) {
      guncelle.mutate({ tip, [kanal]: deger });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Tüm bildirimler</h2>
            <p className="text-xs text-muted-foreground">
              Toplu işlem — tüm tipleri tek seferde aç veya kapat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => tumKanaliAyarla("in_app_acik", true)}
            >
              Tüm bildirimleri aç
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => tumKanaliAyarla("in_app_acik", false)}
            >
              Tüm bildirimleri kapat
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => tumKanaliAyarla("email_acik", true)}
            >
              Tüm e-postaları aç
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => tumKanaliAyarla("email_acik", false)}
            >
              Tüm e-postaları kapat
            </Button>
          </div>
        </div>
      </section>

      {TERCIH_GRUPLARI.map((grup) => (
        <section
          key={grup.baslik}
          className="rounded-lg border bg-card"
          aria-labelledby={`grup-${grup.baslik}`}
        >
          <header className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <h2
                id={`grup-${grup.baslik}`}
                className="text-base font-semibold"
              >
                {grup.baslik}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {grup.aciklama}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() =>
                  grupKanaliAyarla(grup.tipler, "in_app_acik", true)
                }
              >
                Bildirim aç
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() =>
                  grupKanaliAyarla(grup.tipler, "in_app_acik", false)
                }
              >
                Bildirim kapat
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() =>
                  grupKanaliAyarla(grup.tipler, "email_acik", true)
                }
              >
                E-posta aç
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() =>
                  grupKanaliAyarla(grup.tipler, "email_acik", false)
                }
              >
                E-posta kapat
              </Button>
            </div>
          </header>
          <ul className="divide-y">
            {grup.tipler.map((tip) => {
              const satir = tercihMap.get(tip);
              const inApp = satir?.in_app_acik ?? true;
              const email = satir?.email_acik ?? true;
              return (
                <SatirBileseni
                  key={tip}
                  tip={tip}
                  inApp={inApp}
                  email={email}
                  guncelle={(yeni) =>
                    guncelle.mutate({ tip, ...yeni })
                  }
                />
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SatirBileseni({
  tip,
  inApp,
  email,
  guncelle,
}: {
  tip: BildirimTipi;
  inApp: boolean;
  email: boolean;
  guncelle: (yeni: { in_app_acik?: boolean; email_acik?: boolean }) => void;
}) {
  const metin = TIP_METNI[tip];
  const idIn = `tercih-${tip}-in_app`;
  const idEmail = `tercih-${tip}-email`;
  return (
    <li className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
      <div className="min-w-0">
        <div className="text-sm font-medium">{metin.baslik}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {metin.aciklama}
        </div>
      </div>
      <div className="flex items-center gap-5 sm:gap-8">
        <KanalToggle
          id={idIn}
          etiket="Bildirim"
          checked={inApp}
          onCheckedChange={(v) => guncelle({ in_app_acik: v })}
        />
        <KanalToggle
          id={idEmail}
          etiket="E-posta"
          checked={email}
          onCheckedChange={(v) => guncelle({ email_acik: v })}
        />
      </div>
    </li>
  );
}

function KanalToggle({
  id,
  etiket,
  checked,
  onCheckedChange,
}: {
  id: string;
  etiket: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={etiket}
      />
      <Label
        htmlFor={id}
        className={cn(
          "text-xs font-normal",
          checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {etiket}
      </Label>
    </div>
  );
}
