"use client";

import { AktiviteListesi } from "../aktivite/components/aktivite-listesi";

// Sancak referansı: dikey timeline — gerçek render aktivite/components/
// aktivite-listesi.tsx'te. Bu dosya kart-modal yan panel sekmesine
// adapter; kapsayıcı stil (padding/scroll) yan panel sayesinde gelir.
//
// Audit middleware (lib/audit-middleware.ts) her Prisma yazımını
// AktiviteLogu'na kaydeder; service JSON path filter ile karta bağlı
// kayıtları çeker (kart, yorum, eklenti, kontrol-listesi/maddesi,
// etiket-bağı, üye-bağı, ilişki, hedef-kurum). Kullanıcı bilgisi
// audit-context'ten geliyor (Server Action içinde otomatik dolar).
export function KartModalAktiviteListesi({ kartId }: { kartId: string }) {
  return <AktiviteListesi kartId={kartId} />;
}
