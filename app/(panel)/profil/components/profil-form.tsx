"use client";

// Sprint 4 / S4-16 — Profil bilgileri düzenleme formu.

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { profilGuncelleSemasi, type ProfilGuncelle } from "../schemas";
import { profilGuncelleEylem } from "../actions";

type Props = {
  baslangic: {
    ad: string;
    soyad: string;
    unvan: string | null;
    telefon: string | null;
  };
};

export function ProfilForm({ baslangic }: Props) {
  const [yukleniyor, setYukleniyor] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfilGuncelle>({
    resolver: zodResolver(profilGuncelleSemasi),
    defaultValues: {
      ad: baslangic.ad,
      soyad: baslangic.soyad,
      unvan: baslangic.unvan ?? "",
      telefon: baslangic.telefon ?? "",
    },
  });

  const gonder = handleSubmit(async (veri) => {
    setYukleniyor(true);
    try {
      const sonuc = await profilGuncelleEylem(veri);
      if (sonuc.basarili) {
        toast.basari("Profil güncellendi.");
        reset(veri);
      } else {
        toast.hata(sonuc.hata);
      }
    } finally {
      setYukleniyor(false);
    }
  });

  return (
    <form onSubmit={gonder} className="grid gap-3" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profil-ad">Ad</Label>
          <Input
            id="profil-ad"
            autoComplete="given-name"
            aria-invalid={!!errors.ad}
            {...register("ad")}
          />
          {errors.ad && (
            <p className="text-destructive text-xs" role="alert">
              {errors.ad.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profil-soyad">Soyad</Label>
          <Input
            id="profil-soyad"
            autoComplete="family-name"
            aria-invalid={!!errors.soyad}
            {...register("soyad")}
          />
          {errors.soyad && (
            <p className="text-destructive text-xs" role="alert">
              {errors.soyad.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profil-unvan">Unvan</Label>
          <Input
            id="profil-unvan"
            placeholder="(opsiyonel)"
            aria-invalid={!!errors.unvan}
            {...register("unvan")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profil-telefon">Telefon</Label>
          <Input
            id="profil-telefon"
            inputMode="tel"
            placeholder="(opsiyonel)"
            aria-invalid={!!errors.telefon}
            {...register("telefon")}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={yukleniyor || !isDirty}>
          {yukleniyor ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Kaydediliyor
            </>
          ) : (
            "Kaydet"
          )}
        </Button>
      </div>
    </form>
  );
}
