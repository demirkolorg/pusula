"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { girisSemasi, type GirisVerisi } from "../schemas";
import { girisYap } from "../actions";

export function GirisForm() {
  const router = useRouter();
  const [yukleniyor, baslat] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GirisVerisi>({
    resolver: zodResolver(girisSemasi),
    defaultValues: { email: "", parola: "" },
  });

  const gonder = (veri: GirisVerisi) => {
    baslat(async () => {
      const formData = new FormData();
      formData.set("email", veri.email);
      formData.set("parola", veri.parola);

      const sonuc = await girisYap(formData);

      if (sonuc.basarili) {
        toast.success("Giriş başarılı");
        router.replace("/");
        router.refresh();
        return;
      }

      if (sonuc.alanlar) {
        for (const [alan, mesaj] of Object.entries(sonuc.alanlar)) {
          setError(alan as keyof GirisVerisi, { message: mesaj });
        }
      }
      toast.error(sonuc.hata);
    });
  };

  return (
    <form onSubmit={handleSubmit(gonder)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="ad.soyad@kurum.gov.tr"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-sm" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="parola">Parola</Label>
        <Input
          id="parola"
          type="password"
          autoComplete="current-password"
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

      <Button type="submit" className="mt-2 h-11" disabled={yukleniyor}>
        {yukleniyor ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Giriş yapılıyor...
          </>
        ) : (
          "Giriş Yap"
        )}
      </Button>
    </form>
  );
}
