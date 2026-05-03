"use client";

import * as React from "react";

export default function KuresalHata({
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
        seviye: "FATAL",
        taraf: "FRONTEND",
        mesaj: error.message,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        ekstra: { digest: error.digest },
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Beklenmeyen bir hata oluştu</h1>
          <p className="text-muted-foreground text-sm">
            Hatayı kaydettik. Tekrar denemek için aşağıdaki butona tıklayın veya
            sayfayı yenileyin.
          </p>
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
