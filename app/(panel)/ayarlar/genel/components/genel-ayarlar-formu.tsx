"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon, RotateCcwIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PusulaLogo } from "@/components/branding";
import { toast } from "@/lib/toast";
import {
  KURUM_ADI_MAX,
  KURUM_ADI_VARSAYILAN,
  UYGULAMA_ADI_MAX,
  UYGULAMA_ADI_VARSAYILAN,
  useKurumAyariStore,
} from "@/lib/stores/kurum-ayari-store";

import { genelAyarSemasi, type GenelAyarFormu } from "../schemas";

export function GenelAyarlarFormu() {
  const kurumAdi = useKurumAyariStore((s) => s.kurumAdi);
  const uygulamaAdi = useKurumAyariStore((s) => s.uygulamaAdi);
  const ayarlariGuncelle = useKurumAyariStore((s) => s.ayarlariGuncelle);
  const varsayilanaSifirla = useKurumAyariStore((s) => s.varsayilanaSifirla);

  const form = useForm<GenelAyarFormu>({
    resolver: zodResolver(genelAyarSemasi),
    defaultValues: { kurumAdi, uygulamaAdi },
    values: { kurumAdi, uygulamaAdi },
  });

  const izlenenKurumAdi =
    form.watch("kurumAdi")?.trim() || KURUM_ADI_VARSAYILAN;
  const izlenenUygulamaAdi =
    form.watch("uygulamaAdi")?.trim() || UYGULAMA_ADI_VARSAYILAN;

  const gonder = form.handleSubmit((degerler) => {
    ayarlariGuncelle(degerler);
    toast.basari("Kurum bilgileri güncellendi", {
      aciklama: "Kenar çubuğu başlığı yenilendi.",
    });
  });

  const sifirla = () => {
    varsayilanaSifirla();
    form.reset({
      kurumAdi: KURUM_ADI_VARSAYILAN,
      uygulamaAdi: UYGULAMA_ADI_VARSAYILAN,
    });
    toast.bilgi("Varsayılan değerlere sıfırlandı");
  };

  return (
    <form
      onSubmit={gonder}
      className="grid gap-6 sm:max-w-2xl"
      aria-label="Kurum bilgileri formu"
    >
      <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 text-sm sm:flex sm:items-start sm:gap-3">
        <InfoIcon className="size-4 shrink-0 text-muted-foreground sm:mt-0.5" />
        <p className="text-muted-foreground">
          Bu ayarlar yalnızca bu cihazda saklanır. Tarayıcı verisi temizlenirse
          varsayılan değerlere döner.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="kurumAdi">Kurum adı</Label>
        <Input
          id="kurumAdi"
          autoComplete="off"
          maxLength={KURUM_ADI_MAX}
          placeholder={KURUM_ADI_VARSAYILAN}
          aria-invalid={form.formState.errors.kurumAdi ? "true" : "false"}
          {...form.register("kurumAdi")}
        />
        {form.formState.errors.kurumAdi ? (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.kurumAdi.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Kenar çubuğunun üst satırında görünür.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="uygulamaAdi">Uygulama adı (alt başlık)</Label>
        <Input
          id="uygulamaAdi"
          autoComplete="off"
          maxLength={UYGULAMA_ADI_MAX}
          placeholder={UYGULAMA_ADI_VARSAYILAN}
          aria-invalid={form.formState.errors.uygulamaAdi ? "true" : "false"}
          {...form.register("uygulamaAdi")}
        />
        {form.formState.errors.uygulamaAdi ? (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.uygulamaAdi.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Kenar çubuğunun ikinci satırında küçük puntoyla görünür.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Önizleme</Label>
        <div className="rounded-lg border bg-card p-3">
          <PusulaLogo
            boyut="lg"
            tip="tam"
            baslik={izlenenKurumAdi}
            altBaslik={izlenenUygulamaAdi}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={sifirla}
          disabled={form.formState.isSubmitting}
        >
          <RotateCcwIcon className="size-4" />
          Varsayılana sıfırla
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <SaveIcon className="size-4" />
          Kaydet
        </Button>
      </div>
    </form>
  );
}
