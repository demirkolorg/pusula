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
import { davetiKabulSemasi, type DavetiKabulIstegi } from "../schemas";
import { daveriKabul } from "../actions";

type Props = {
  token: string;
  email: string;
};

export function DavetKabulForm({ token, email }: Props) {
  const router = useRouter();
  const [yukleniyor, baslat] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DavetiKabulIstegi>({
    resolver: zodResolver(davetiKabulSemasi),
    defaultValues: { token, ad: "", soyad: "", parola: "", parolaTekrar: "" },
  });

  const gonder = (veri: DavetiKabulIstegi) => {
    baslat(async () => {
      const sonuc = await daveriKabul(veri);
      if (sonuc.basarili) {
        toast.basari("Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.");
        router.replace("/giris");
        return;
      }
      if (sonuc.alanlar) {
        for (const [a, m] of Object.entries(sonuc.alanlar)) {
          setError(a as keyof DavetiKabulIstegi, { message: m });
        }
      }
      toast.hata(sonuc.hata);
    });
  };

  return (
    <form onSubmit={handleSubmit(gonder)} className="flex flex-col gap-4" noValidate>
      <input type="hidden" {...register("token")} />

      <div className="flex flex-col gap-2">
        <Label>E-posta</Label>
        <Input value={email} disabled readOnly />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ad">Ad</Label>
          <Input
            id="ad"
            autoComplete="given-name"
            aria-invalid={!!errors.ad}
            {...register("ad")}
          />
          {errors.ad && (
            <p className="text-destructive text-sm" role="alert">
              {errors.ad.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="soyad">Soyad</Label>
          <Input
            id="soyad"
            autoComplete="family-name"
            aria-invalid={!!errors.soyad}
            {...register("soyad")}
          />
          {errors.soyad && (
            <p className="text-destructive text-sm" role="alert">
              {errors.soyad.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="parola">Parola</Label>
        <Input
          id="parola"
          type="password"
          autoComplete="new-password"
          placeholder="En az 8 karakter"
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
        <Label htmlFor="parolaTekrar">Parola (Tekrar)</Label>
        <Input
          id="parolaTekrar"
          type="password"
          autoComplete="new-password"
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
            Hesap oluşturuluyor...
          </>
        ) : (
          "Hesap Oluştur"
        )}
      </Button>
    </form>
  );
}
