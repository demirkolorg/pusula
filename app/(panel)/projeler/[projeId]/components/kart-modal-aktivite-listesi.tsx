"use client";

import * as React from "react";
import type { KisiMap } from "@/lib/mention";
import { AktiviteListesi } from "../aktivite/components/aktivite-listesi";
import { useKartAktiviteleri } from "../aktivite/hooks";
import { useProjeYetkilileri } from "../yetkili/hooks";

// Sancak referansı: dikey timeline — gerçek render aktivite/components/
// aktivite-listesi.tsx'te. Bu dosya kart-modal yan panel sekmesine
// adapter; kapsayıcı stil (padding/scroll) yan panel sayesinde gelir.
//
// Audit middleware (lib/audit-middleware.ts) her Prisma yazımını
// AktiviteLogu'na kaydeder; service JSON path filter ile karta bağlı
// kayıtları çeker (kart, yorum, eklenti, kontrol-listesi/maddesi,
// etiket-bağı, yetkili-bağı, ilişki, hedef-birim). Kullanıcı bilgisi
// audit-context'ten geliyor (Server Action içinde otomatik dolar).
//
// projeId opsiyonel: verildiğinde yorum aktivitelerinin detay alanındaki
// `@<uuid>` mention'ları kullanıcı adlarıyla zenginleşir.
export function KartModalAktiviteListesi({
  kartId,
  projeId,
}: {
  kartId: string;
  projeId?: string;
}) {
  const sorgu = useKartAktiviteleri(kartId);
  const yetkililerQ = useProjeYetkilileri(projeId ?? "");
  const kisiMap: KisiMap = React.useMemo(() => {
    const m: KisiMap = new Map();
    if (!projeId) return m;
    for (const u of yetkililerQ.data ?? []) {
      m.set(u.kullanici_id, { ad: u.ad, soyad: u.soyad });
    }
    return m;
  }, [projeId, yetkililerQ.data]);

  return (
    <AktiviteListesi
      data={sorgu.data}
      yukleniyor={sorgu.isLoading}
      kisiMap={kisiMap}
      bosAciklama="Kartta yapılan her değişiklik (atama, tarih, etiket, yorum, durum, kontrol maddesi, eklenti, ilişki) burada zaman çizelgesinde görünür."
    />
  );
}
