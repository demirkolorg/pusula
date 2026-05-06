"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useProjeDetay } from "../hooks/detay-sorgulari";
import type { ListeKartOzeti } from "../services";
import Link from "next/link";

type Props = {
  projeId: string;
  acik: boolean;
  setAcik: (a: boolean) => void;
};

// Proje içi kart araması — header'daki arama butonu ile açılır. Faz 1:
// client-side filter (ProjeDetay cache'i üzerinden başlık + açıklama LIKE).
// Faz 2: server-side arama servisi (`projeKartArama`) eklenecek.
//
// Mobile'da bottom sheet, desktop'ta üstten dikey panel — Sheet primitive'i
// ekrana göre uyum sağlar (Kural 13).
export function ProjeAramaSheet({ projeId, acik, setAcik }: Props) {
  const sorgu = useProjeDetay(projeId);
  const [q, setQ] = React.useState("");

  const sonuclar = React.useMemo(() => {
    const detay = sorgu.data;
    if (!detay) return [];
    const arama = q.trim().toLocaleLowerCase("tr");
    if (!arama) return [];
    const found: Array<{ kart: ListeKartOzeti; liste: string }> = [];
    for (const l of detay.listeler) {
      for (const k of l.kartlar) {
        const baslik = k.baslik.toLocaleLowerCase("tr");
        // ADR-0023 — Arama denormalize edilmiş plaintext üzerinden; Tiptap
        // doc içinde kelime aramak gereksiz (her edit'te aynı string türetilir).
        const aciklama = (k.aciklama_metin ?? "").toLocaleLowerCase("tr");
        if (baslik.includes(arama) || aciklama.includes(arama)) {
          found.push({ kart: k, liste: l.ad });
          if (found.length >= 50) return found;
        }
      }
    }
    return found;
  }, [sorgu.data, q]);

  // Sheet kapatma sırasında arama kutusunu temizle — onOpenChange direkt
  // tetiklenir, useEffect cascade'i tetiklemez (Kural set-state-in-effect).
  const setAcikVeTemizle = React.useCallback(
    (a: boolean) => {
      if (!a) setQ("");
      setAcik(a);
    },
    [setAcik],
  );

  return (
    <Sheet open={acik} onOpenChange={setAcikVeTemizle}>
      <SheetContent
        side="top"
        className="data-[side=top]:max-h-[80vh] data-[side=top]:rounded-b-lg"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <SearchIcon className="size-4" /> Kart ara
          </SheetTitle>
          <SheetDescription className="sr-only">
            Bu projedeki kartlarda başlık ve açıklamada arama yapın.
          </SheetDescription>
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kart başlığı veya açıklama ara..."
            className="mt-1"
          />
        </SheetHeader>

        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto p-2">
          {q.trim() === "" ? (
            <p className="text-muted-foreground p-4 text-center text-xs">
              Aramaya başlamak için yazın. Sonuçlar bu projedeki kartlardan
              gelir.
            </p>
          ) : sonuclar.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-xs">
              Eşleşen kart bulunamadı.
            </p>
          ) : (
            sonuclar.map(({ kart, liste }) => (
              <Link
                key={kart.id}
                href={`/projeler/${projeId}?kart=${kart.id}`}
                onClick={() => setAcik(false)}
                className="hover:bg-accent flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm"
              >
                <span className="font-medium">{kart.baslik}</span>
                <span className="text-muted-foreground text-xs">{liste}</span>
              </Link>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
