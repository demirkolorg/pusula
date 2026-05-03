"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import type { KurumTipi } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOptimisticMutation, eylemMutasyonu } from "@/lib/optimistic";
import { KURUM_TIP_LABEL, kurumGorunenAd } from "@/lib/constants/kurum";
import {
  bekleyenKullanicilariListeleEylem,
  kullaniciOnaylaEylem,
  kullaniciReddetEylem,
} from "../../kullanicilar/actions";

type Kayit = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string | null;
  unvan: string | null;
  olusturma_zamani: Date | string;
  kurum: { id: string; ad: string | null; tip: string };
};

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function OnayBekleyenlerIstemci() {
  const [reddedilecek, setReddedilecek] = React.useState<Kayit | null>(null);
  const [redSebebi, setRedSebebi] = React.useState("");

  const sorgu = useQuery({
    queryKey: ["onay-bekleyenler"],
    queryFn: async () => {
      const r = await bekleyenKullanicilariListeleEylem(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri as Kayit[];
    },
  });

  // Onayla/Reddet optimistic: kayıt listeden anında çıkar (Kural 107-116).
  const onaylaMut = useOptimisticMutation<{ id: string }, { id: string }>({
    queryKey: ["onay-bekleyenler"],
    mutationFn: eylemMutasyonu(kullaniciOnaylaEylem),
    optimistic: (old, vars) => {
      const v = old as Kayit[] | undefined;
      if (!v) return old;
      return v.filter((k) => k.id !== vars.id);
    },
    hataMesaji: "Kullanıcı onaylanamadı",
    basariMesaji: "Kullanıcı onaylandı.",
  });

  const reddetMut = useOptimisticMutation<
    { id: string; sebep: string },
    { id: string }
  >({
    queryKey: ["onay-bekleyenler"],
    mutationFn: eylemMutasyonu(kullaniciReddetEylem),
    optimistic: (old, vars) => {
      const v = old as Kayit[] | undefined;
      if (!v) return old;
      return v.filter((k) => k.id !== vars.id);
    },
    hataMesaji: "Kullanıcı reddedilemedi",
    basariMesaji: "Kullanıcı reddedildi.",
    onSettledExtra: () => {
      setReddedilecek(null);
      setRedSebebi("");
    },
  });

  const kayitlar = sorgu.data ?? [];

  if (sorgu.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" /> Yükleniyor...
      </div>
    );
  }

  if (kayitlar.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Onay bekleyen kayıt yok.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {kayitlar.map((k) => {
          const kurumAdi = kurumGorunenAd({
            ad: k.kurum.ad,
            tip: k.kurum.tip as KurumTipi,
          });
          const kurumTipi = KURUM_TIP_LABEL[k.kurum.tip as KurumTipi];
          return (
            <Card key={k.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {k.ad} {k.soyad}
                    </span>
                    {k.unvan && (
                      <Badge variant="outline">{k.unvan}</Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {k.email}
                    {k.telefon && <> · {k.telefon}</>}
                  </span>
                  <span className="text-xs">
                    <span className="font-medium">{kurumAdi}</span>
                    {k.kurum.ad && (
                      <span className="text-muted-foreground"> · {kurumTipi}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Talep:{" "}
                    {TARIH_FORMAT.format(new Date(k.olusturma_zamani))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReddedilecek(k)}
                    disabled={reddetMut.isPending}
                  >
                    <X className="size-4" /> Reddet
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onaylaMut.mutate({ id: k.id })}
                    disabled={onaylaMut.isPending}
                  >
                    <Check className="size-4" /> Onayla
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={!!reddedilecek}
        onOpenChange={(o) => {
          if (!o) {
            setReddedilecek(null);
            setRedSebebi("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kayıt reddedilsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">
                {reddedilecek?.ad} {reddedilecek?.soyad}
              </span>{" "}
              kullanıcısının kaydını reddediyorsunuz. Sebep belirtin (kullanıcıya
              bildirim için).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={redSebebi}
            onChange={(e) => setRedSebebi(e.target.value)}
            placeholder="Red sebebi (en az 2 karakter)"
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reddetMut.isPending}>
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={reddetMut.isPending || redSebebi.trim().length < 2}
              onClick={() =>
                reddedilecek &&
                reddetMut.mutate({
                  id: reddedilecek.id,
                  sebep: redSebebi.trim(),
                })
              }
            >
              Reddet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
