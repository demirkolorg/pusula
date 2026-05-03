"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { yeniParolaSemasi, type YeniParolaIstegi } from "../schemas";
import { yeniParolaBelirle } from "../actions";

export function YeniParolaForm({ token }: { token: string }) {
  const router = useRouter();
  const [yukleniyor, baslat] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<YeniParolaIstegi>({
    resolver: zodResolver(yeniParolaSemasi),
    defaultValues: { token, parola: "", parolaTekrar: "" },
  });

  const gonder = (veri: YeniParolaIstegi) => {
    baslat(async () => {
      const sonuc = await yeniParolaBelirle(veri);
      if (sonuc.basarili) {
        toast.basari("Parolanız güncellendi. Şimdi giriş yapabilirsiniz.");
        router.replace("/giris");
        return;
      }
      if (sonuc.alanlar) {
        for (const [a, m] of Object.entries(sonuc.alanlar)) {
          setError(a as keyof YeniParolaIstegi, { message: m });
        }
      }
      toast.hata(sonuc.hata);
    });
  };

  return (
    <form onSubmit={handleSubmit(gonder)} className="flex flex-col gap-4" noValidate>
      <input type="hidden" {...register("token")} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="parola">Yeni Parola</Label>
        <Input
          id="parola"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.parola}
          {...register("parola")}
        />
        {errors.parola && (
          <p className="text-destructive text-sm" role="alert">
            {errors.parola.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="parolaTekrar">Yeni Parola (Tekrar)</Label>
        <Input
          id="parolaTekrar"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.parolaTekrar}
          {...register("parolaTekrar")}
        />
        {errors.parolaTekrar && (
          <p className="text-destructive text-sm" role="alert">
            {errors.parolaTekrar.message}
          </p>
        )}
      </div>

      <Button type="submit" className="mt-2 h-11" disabled={yukleniyor}>
        {yukleniyor ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          "Parolayı Güncelle"
        )}
      </Button>
    </form>
  );
}
