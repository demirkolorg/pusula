"use client";

// Sprint 4 / S4-14 — Proje detay sayfası error boundary.
// Kontrol Kural 62: error.tsx her route segment'inde olmalı.
// `reset()` Next.js'in sağladığı boundary reset; tek tıkla yeniden
// dene.

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hataKaydet } from "@/lib/hata-kayit-client";

export default function ProjeDetayHatasi({
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
      url: "proje-detay-error-boundary",
      ekstra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="bg-muted/30 mx-auto my-12 flex max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center"
    >
      <AlertTriangle className="text-destructive size-10" aria-hidden />
      <h1 className="text-lg font-semibold">Bu projeyi yükleyemedik.</h1>
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
