"use client";

// Sprint 1 / S1-6 — backward compat shim (30 gün). Eski mail'lerdeki
// `/parola-sifirla/<token>` URL'leri client-side
// `/parola-sifirla/yeni#token=<token>`'a yönlendirilir. 2026-06-08 sonrası
// kaldırılır.

import { useEffect, use } from "react";

export default function EskiParolaSifirlaYonlendir({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  useEffect(() => {
    window.location.replace(
      `/parola-sifirla/yeni#token=${encodeURIComponent(token)}`,
    );
  }, [token]);
  return null;
}
