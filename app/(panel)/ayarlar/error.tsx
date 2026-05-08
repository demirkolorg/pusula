"use client";

// Sprint 4 / S4-15 — Ayarlar segment'i için error boundary.
// Kontrol Kural 62: error.tsx her route segment'inde olmalı. Ayarlar
// alt sayfaları (kullanıcılar, birimler, roller, denetim, hata-loglari,
// sablonlar, bildirimler) bu boundary'i paylaşır.

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hataKaydet } from "@/lib/hata-kayit-client";

export default function AyarlarHatasi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void hataKaydet({
      seviye: "ERROR",
      taraf: "FRONTEND",
      hata: error,
      url: "ayarlar-error-boundary",
      ekstra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="bg-muted/30 mx-auto my-12 flex max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center"
    >
      <AlertTriangle className="text-destructive size-10" aria-hidden />
      <h1 className="text-lg font-semibold">Ayarlar yüklenemedi.</h1>
      <p className="text-muted-foreground text-sm">
        Bir aksaklık oluştu. Lütfen tekrar deneyin; sorun sürerse
        kaymakamlık personeline bildirin.
      </p>
      <Button onClick={reset} className="gap-2">
        <RotateCcw className="size-4" aria-hidden />
        Tekrar Dene
      </Button>
    </div>
  );
}
