"use client";

// Sprint 1 / S1-6 — backward compat shim (30 gün). Eski mail'lerdeki
// `/davet/<token>` URL'leri client-side `/davet#token=<token>`'a yönlendirilir.
// Token zaten path'te servera ulaşmış olur (sızıntı tek seferlik); ancak yeni
// mail'ler hash fragment kullandığı için bu shim sadece in-flight mail'leri
// kapsar. 2026-06-08 sonrası kaldırılır.

import { useEffect, use } from "react";

export default function EskiDavetYonlendir({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  useEffect(() => {
    window.location.replace(`/davet#token=${encodeURIComponent(token)}`);
  }, [token]);
  return null;
}
