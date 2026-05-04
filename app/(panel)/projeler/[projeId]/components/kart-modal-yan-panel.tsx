"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useKartYorumlari } from "../yorum/hooks";
import { useKartEklentileri } from "../eklenti/hooks";
import { useKartAktiviteleri } from "../aktivite/hooks";
import { KartModalYorumComposer } from "./kart-modal-yorum-composer";
import { KartModalYorumListesi } from "./kart-modal-yorum-listesi";
import { KartModalAktiviteListesi } from "./kart-modal-aktivite-listesi";
import { KartModalEklerListesi } from "./kart-modal-ekler-listesi";
import { KartModalTumuListesi } from "./kart-modal-tumu-listesi";

type Sekme = "yorumlar" | "aktivite" | "ekler" | "tumu";

type Props = { kartId: string };

// Sancak referansı: sağ kolon — sekme strip (Yorumlar / Aktivite / Ekler /
// Tümü), composer (yalnızca Yorumlar sekmesinde) ve sekme içeriği.
// Tutarlılık: tüm sekmelerde sayı rozeti var (boş ise 0). Tümü = aktivite
// log'u (her audit event), yorum/ek için inline içerik zenginleştirilir.
export function KartModalYanPanel({ kartId }: Props) {
  const [aktif, setAktif] = React.useState<Sekme>("yorumlar");
  const yorumQ = useKartYorumlari(kartId);
  const eklerQ = useKartEklentileri(kartId);
  const aktiviteQ = useKartAktiviteleri(kartId);

  const sekmeler: { id: Sekme; etiket: string; sayi: number }[] = [
    { id: "yorumlar", etiket: "Yorumlar", sayi: yorumQ.data?.length ?? 0 },
    { id: "aktivite", etiket: "Aktivite", sayi: aktiviteQ.data?.length ?? 0 },
    { id: "ekler", etiket: "Ekler", sayi: eklerQ.data?.length ?? 0 },
    // Tümü = aktivite log'u (yorum/ek dahil her olay) — sayı aktivite ile aynı.
    { id: "tumu", etiket: "Tümü", sayi: aktiviteQ.data?.length ?? 0 },
  ];

  return (
    <aside className="bg-muted/40 flex flex-col gap-3 overflow-y-auto border-t p-4 md:border-t-0 md:border-l sm:p-[18px]">
      <SekmeStrip aktif={aktif} setAktif={setAktif} sekmeler={sekmeler} />

      {aktif === "yorumlar" && <KartModalYorumComposer kartId={kartId} />}

      {aktif === "yorumlar" && <KartModalYorumListesi kartId={kartId} />}
      {aktif === "aktivite" && <KartModalAktiviteListesi kartId={kartId} />}
      {aktif === "ekler" && <KartModalEklerListesi kartId={kartId} />}
      {aktif === "tumu" && <KartModalTumuListesi kartId={kartId} />}
    </aside>
  );
}

function SekmeStrip({
  aktif,
  setAktif,
  sekmeler,
}: {
  aktif: Sekme;
  setAktif: (s: Sekme) => void;
  sekmeler: { id: Sekme; etiket: string; sayi: number }[];
}) {
  return (
    <div
      role="tablist"
      aria-label="Yan panel sekmeleri"
      className="border-input bg-background inline-flex w-fit items-center gap-0.5 rounded-md border p-[3px]"
    >
      {sekmeler.map((s) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={aktif === s.id}
          onClick={() => setAktif(s.id)}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-[3px] text-[11.5px] font-medium transition-colors",
            aktif === s.id
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>{s.etiket}</span>
          <span
            className={cn(
              "tabular-nums text-[10.5px]",
              aktif === s.id ? "text-muted-foreground" : "text-muted-foreground/60",
            )}
          >
            {s.sayi}
          </span>
        </button>
      ))}
    </div>
  );
}
