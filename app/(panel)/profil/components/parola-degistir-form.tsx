"use client";

// Sprint 4 / S4-16 — Parola değiştirme formu.
// Mevcut parola + yeni parola + onay; service argon2.verify ile doğrular.

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { parolaDegistirSemasi, type ParolaDegistir } from "../schemas";
import { parolaDegistirEylem } from "../actions";

export function ParolaDegistirForm() {
  const [yukleniyor, setYukleniyor] = React.useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ParolaDegistir>({
    resolver: zodResolver(parolaDegistirSemasi),
    defaultValues: {
      mevcutParola: "",
      yeniParola: "",
      yeniParolaTekrar: "",
    },
  });

  const gonder = handleSubmit(async (veri) => {
    setYukleniyor(true);
    try {
      const sonuc = await parolaDegistirEylem(veri);
      if (sonuc.basarili) {
        toast.basari("Parolanız güncellendi.");
        reset();
      } else {
        if (sonuc.alanlar) {
          for (const [a, m] of Object.entries(sonuc.alanlar)) {
            setError(a as keyof ParolaDegistir, { message: m });
          }
        }
        toast.hata(sonuc.hata);
      }
    } finally {
      setYukleniyor(false);
    }
  });

  return (
    <form onSubmit={gonder} className="grid gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parola-mevcut">Mevcut parola</Label>
        <Input
          id="parola-mevcut"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.mevcutParola}
          {...register("mevcutParola")}
        />
        {errors.mevcutParola && (
          <p className="text-destructive text-xs" role="alert">
            {errors.mevcutParola.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parola-yeni">Yeni parola</Label>
        <Input
          id="parola-yeni"
          type="password"
          autoComplete="new-password"
          placeholder="En az 8 karakter"
          aria-invalid={!!errors.yeniParola}
          {...register("yeniParola")}
        />
        {errors.yeniParola && (
          <p className="text-destructive text-xs" role="alert">
            {errors.yeniParola.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parola-yeni-tekrar">Yeni parola (tekrar)</Label>
        <Input
          id="parola-yeni-tekrar"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.yeniParolaTekrar}
          {...register("yeniParolaTekrar")}
        />
        {errors.yeniParolaTekrar && (
          <p className="text-destructive text-xs" role="alert">
            {errors.yeniParolaTekrar.message}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={yukleniyor}>
          {yukleniyor ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Güncelleniyor
            </>
          ) : (
            "Parolayı Güncelle"
          )}
        </Button>
      </div>
    </form>
  );
}
