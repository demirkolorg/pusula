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

// projeId opsiyonel — verilirse @mention autocomplete + yorum render
// kullanıcı adlarıyla zenginleşir.
type Props = { kartId: string; projeId?: string };

// Sancak referansı: sağ kolon — sekme strip (Yorumlar / Aktivite / Ekler /
// Tümü), composer (yalnızca Yorumlar sekmesinde) ve sekme içeriği.
// Tutarlılık: tüm sekmelerde sayı rozeti var (boş ise 0). Tümü = aktivite
// log'u (her audit event), yorum/ek için inline içerik zenginleştirilir.
export function KartModalYanPanel({ kartId, projeId }: Props) {
  const [aktif, setAktif] = React.useState<Sekme>("yorumlar");
  const yorumQ = useKartYorumlari(kartId);
  const eklerQ = useKartEklentileri(kartId);
  const aktiviteQ = useKartAktiviteleri(kartId);

  const yorumSayisi = yorumQ.data?.length ?? 0;
  const aktiviteSayisi = aktiviteQ.data?.length ?? 0;
  const eklerSayisi = eklerQ.data?.length ?? 0;

  const sekmeler: { id: Sekme; etiket: string; sayi: number }[] = [
    { id: "yorumlar", etiket: "Yorumlar", sayi: yorumSayisi },
    { id: "aktivite", etiket: "Aktivite", sayi: aktiviteSayisi },
    { id: "ekler", etiket: "Ekler", sayi: eklerSayisi },
    // Tümü = üç sekmenin toplamı (yorum + aktivite + ek). Aktivite log'u
    // yorum/ek olaylarını ayrı event olarak zaten içerir; sayım UX'i için
    // sekme sayılarının toplamını gösteriyoruz.
    { id: "tumu", etiket: "Tümü", sayi: yorumSayisi + aktiviteSayisi + eklerSayisi },
  ];

  return (
    <aside className="bg-muted/40 relative flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l">
      {/* Sticky header — scroll sırasında sekme strip + composer üstte sabit
          kalır. bg-muted/40 + backdrop-blur ile alttaki içerik şeffaf görünür. */}
      <div className="bg-muted/40 sticky top-0 z-10 flex flex-col gap-3 p-4 backdrop-blur sm:p-[18px]">
        <SekmeStrip aktif={aktif} setAktif={setAktif} sekmeler={sekmeler} />
        {aktif === "yorumlar" && (
          <KartModalYorumComposer kartId={kartId} projeId={projeId} />
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-[18px] sm:pb-[18px]">
        {aktif === "yorumlar" && (
          <KartModalYorumListesi kartId={kartId} projeId={projeId} />
        )}
        {aktif === "aktivite" && <KartModalAktiviteListesi kartId={kartId} />}
        {aktif === "ekler" && <KartModalEklerListesi kartId={kartId} />}
        {aktif === "tumu" && <KartModalTumuListesi kartId={kartId} />}
      </div>
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
