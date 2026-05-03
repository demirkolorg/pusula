"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function PanelHatasi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    void fetch("/api/log/hata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seviye: "ERROR",
        taraf: "FRONTEND",
        mesaj: error.message,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        ekstra: { digest: error.digest, segment: "panel" },
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-xl font-semibold">Bir şeyler ters gitti</h2>
        <p className="text-muted-foreground text-sm">
          Sayfa yüklenirken bir hata oluştu. Hata kaydedildi.
        </p>
        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={reset}>
            Tekrar dene
          </Button>
        </div>
      </div>
    </div>
  );
}
