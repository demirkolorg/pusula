"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useProjeUyeleri } from "../uye/hooks";
import { UyeAvatar } from "../uye/components/uye-avatar";

type Uye = { kullanici_id: string; ad: string; soyad: string; email: string };

type Props = {
  projeId: string;
  query: string;
  acik: boolean;
  onSec: (uuid: string) => void;
  onIptal: () => void;
};

// @mention dropdown — proje üyelerini filtreler ve seçim yapar.
// Klavye kısayolları: ↑/↓/Enter/Escape. Hover ile fare seçimi.
export function MentionDropdown({
  projeId,
  query,
  acik,
  onSec,
  onIptal,
}: Props) {
  const sorgu = useProjeUyeleri(projeId);
  const [aktifIdx, setAktifIdx] = React.useState(0);

  const filtreli = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    const liste = sorgu.data ?? [];
    if (!q) return liste.slice(0, 8);
    return liste
      .filter((u) => {
        const adSoyad = `${u.ad} ${u.soyad}`.toLocaleLowerCase("tr");
        const email = u.email.toLocaleLowerCase("tr");
        return adSoyad.includes(q) || email.includes(q);
      })
      .slice(0, 8);
  }, [sorgu.data, query]);

  // Liste değişince aktif index sıfırla
  React.useEffect(() => {
    setAktifIdx(0);
  }, [query, filtreli.length]);

  // Global klavye dinle — popover focus alma sorun olmadan textarea'da kalır
  React.useEffect(() => {
    if (!acik) return;
    const dinleyici = (e: KeyboardEvent) => {
      if (filtreli.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAktifIdx((i) => (i + 1) % filtreli.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAktifIdx((i) => (i - 1 + filtreli.length) % filtreli.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const u = filtreli[aktifIdx];
        if (u) onSec(u.kullanici_id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onIptal();
      }
    };
    window.addEventListener("keydown", dinleyici, { capture: true });
    return () => window.removeEventListener("keydown", dinleyici, { capture: true });
  }, [acik, filtreli, aktifIdx, onSec, onIptal]);

  if (!acik) return null;

  if (filtreli.length === 0) {
    return (
      <div className="bg-popover absolute bottom-full left-0 z-50 mb-1 w-64 rounded-md border p-2 shadow-md">
        <p className="text-muted-foreground px-2 py-1 text-xs">
          {query ? `"${query}" eşleşen üye yok` : "Proje üyesi yok"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-popover absolute bottom-full left-0 z-50 mb-1 w-72 overflow-hidden rounded-md border shadow-md"
      role="listbox"
      aria-label="Üye seç"
    >
      <ul className="max-h-60 overflow-y-auto p-1">
        {filtreli.map((u, i) => (
          <li key={u.kullanici_id}>
            <button
              type="button"
              role="option"
              aria-selected={i === aktifIdx}
              onMouseEnter={() => setAktifIdx(i)}
              onClick={() => onSec(u.kullanici_id)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px]",
                i === aktifIdx ? "bg-accent" : "hover:bg-accent/50",
              )}
            >
              <UyeAvatar ad={u.ad} soyad={u.soyad} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.ad} {u.soyad}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {u.email}
                </p>
              </div>
              {u.seviye === "ADMIN" && (
                <span className="text-muted-foreground text-[10px] uppercase">
                  Admin
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="bg-muted/50 text-muted-foreground border-t px-2 py-1 text-[10px]">
        ↑↓ gez · Enter seç · Esc iptal
      </p>
    </div>
  );
}
