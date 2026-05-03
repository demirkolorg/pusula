"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { KURUM_TIP_LABEL, kurumGorunenAd } from "@/lib/constants/kurum";
import { kurumSecenekleriniGetir } from "../../../(panel)/ayarlar/kurumlar/actions";
import { kayitOl } from "../actions";
import { kayitSemasi, type Kayit } from "../schemas";

export function KayitForm() {
  const [tamamlandi, setTamamlandi] = React.useState(false);

  const form = useForm<Kayit>({
    resolver: zodResolver(kayitSemasi),
    defaultValues: {
      ad: "",
      soyad: "",
      email: "",
      telefon: "",
      unvan: "",
      parola: "",
      parolaTekrar: "",
      kurum_id: "",
    },
  });

  const kurumSorgu = useQuery({
    queryKey: ["kurum-secenekleri"],
    queryFn: async () => {
      const r = await kurumSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
  });

  const kayitMut = useMutation({
    mutationFn: async (veri: Kayit) => {
      const r = await kayitOl(veri);
      if (!r.basarili) throw r;
      return r.veri;
    },
    onSuccess: () => {
      toast.basari("Kayıt alındı, onay bekleniyor.");
      setTamamlandi(true);
    },
  });

  const gonder = form.handleSubmit(async (veri) => {
    try {
      await kayitMut.mutateAsync(veri);
    } catch (err: unknown) {
      const sonuc = err as { hata?: string; alanlar?: Record<string, string> };
      if (sonuc.alanlar) {
        for (const [alan, m] of Object.entries(sonuc.alanlar)) {
          form.setError(alan as keyof Kayit, { message: m });
        }
      }
      toast.hata(sonuc.hata ?? "Kayıt oluşturulamadı");
    }
  });

  if (tamamlandi) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle2 className="text-primary size-12" />
        <h2 className="text-lg font-semibold">Kayıt başarılı</h2>
        <p className="text-muted-foreground text-sm">
          Talebiniz kaymakamlık personeline iletildi. Onaylandıktan sonra giriş
          yapabilirsiniz. Sonucu e-posta ile bildirilecektir.
        </p>
        <Link
          href="/giris"
          className="text-primary text-sm font-medium hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  const kurumDeger = form.watch("kurum_id");

  return (
    <form
      onSubmit={gonder}
      className="flex flex-col gap-3"
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ad">Ad</Label>
          <Input id="ad" autoFocus {...form.register("ad")} />
          {form.formState.errors.ad && (
            <p className="text-destructive text-xs">
              {form.formState.errors.ad.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="soyad">Soyad</Label>
          <Input id="soyad" {...form.register("soyad")} />
          {form.formState.errors.soyad && (
            <p className="text-destructive text-xs">
              {form.formState.errors.soyad.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-destructive text-xs">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kurum">Bağlı olduğunuz kurum</Label>
        <Select
          value={kurumDeger}
          onValueChange={(v) => form.setValue("kurum_id", v ?? "")}
        >
          <SelectTrigger id="kurum">
            <SelectValue placeholder="Kurum seçin" />
          </SelectTrigger>
          <SelectContent>
            {(kurumSorgu.data ?? []).map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {kurumGorunenAd({ ad: k.ad, tip: k.tip })}
                {k.ad && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {KURUM_TIP_LABEL[k.tip]}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.kurum_id && (
          <p className="text-destructive text-xs">
            {form.formState.errors.kurum_id.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="unvan">Unvan</Label>
          <Input id="unvan" {...form.register("unvan")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="telefon">Telefon</Label>
          <Input id="telefon" inputMode="tel" {...form.register("telefon")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parola">Parola</Label>
        <Input id="parola" type="password" {...form.register("parola")} />
        {form.formState.errors.parola && (
          <p className="text-destructive text-xs">
            {form.formState.errors.parola.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parolaTekrar">Parola (tekrar)</Label>
        <Input
          id="parolaTekrar"
          type="password"
          {...form.register("parolaTekrar")}
        />
        {form.formState.errors.parolaTekrar && (
          <p className="text-destructive text-xs">
            {form.formState.errors.parolaTekrar.message}
          </p>
        )}
      </div>

      <Button type="submit" className="mt-2" disabled={kayitMut.isPending}>
        {kayitMut.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Gönderiliyor
          </>
        ) : (
          "Kayıt Ol"
        )}
      </Button>

      <p className="text-muted-foreground mt-2 text-xs">
        Kaydınız onaylandıktan sonra giriş yapabilirsiniz.
      </p>
    </form>
  );
}
