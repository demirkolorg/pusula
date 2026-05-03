"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { sifirlamaIstekSemasi, type SifirlamaIstegi } from "../schemas";
import { sifirlamaIste } from "../actions";

export function ParolaSifirlaIstekForm() {
  const [yukleniyor, baslat] = useTransition();
  const [gonderildi, setGonderildi] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SifirlamaIstegi>({
    resolver: zodResolver(sifirlamaIstekSemasi),
    defaultValues: { email: "" },
  });

  const gonder = (veri: SifirlamaIstegi) => {
    baslat(async () => {
      const sonuc = await sifirlamaIste(veri);
      if (sonuc.basarili) {
        setGonderildi(true);
        toast.basari(
          "Eğer bu e-posta sistemde kayıtlıysa, sıfırlama bağlantısı gönderildi.",
        );
      } else {
        toast.hata(sonuc.hata);
      }
    });
  };

  if (gonderildi) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <MailCheck className="text-primary size-10" />
        <p className="text-sm">
          Eğer bu e-posta sistemde kayıtlıysa, kısa süre içinde bir sıfırlama
          bağlantısı alacaksınız. Spam klasörünüzü de kontrol edin.
        </p>
      </div>
    );
  }

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

      <Button type="submit" className="mt-2 h-11" disabled={yukleniyor}>
        {yukleniyor ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Gönderiliyor...
          </>
        ) : (
          "Sıfırlama Bağlantısı Gönder"
        )}
      </Button>
    </form>
  );
}
