"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useKartaErisenKullanicilar } from "../yetkili/hooks";
import { KisiAvatar } from "../yetkili/components/kisi-avatar";

type Props = {
  kartId: string;
  query: string;
  acik: boolean;
  onSec: (uuid: string, ad: string) => void;
  onIptal: () => void;
};

// @mention dropdown — karta erişimi olan kullanıcıları (yetkili olarak eklenmiş
// birimlerin personelleri + yetkili olarak eklenmiş kullanıcılar + makam) listeler.
// Klavye kısayolları: ↑/↓/Enter/Escape. Hover ile fare seçimi.
export function MentionDropdown({
  kartId,
  query,
  acik,
  onSec,
  onIptal,
}: Props) {
  const sorgu = useKartaErisenKullanicilar(kartId, query.trim(), acik);
  const [aktifIdx, setAktifIdx] = React.useState(0);

  const filtreli = React.useMemo(() => {
    return (sorgu.data ?? []).slice(0, 8);
  }, [sorgu.data]);

  const aktifIdxGuncel =
    filtreli.length === 0 ? 0 : Math.min(aktifIdx, filtreli.length - 1);

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
        const u = filtreli[aktifIdxGuncel];
        if (u) onSec(u.id, `${u.ad} ${u.soyad}`.trim());
      } else if (e.key === "Escape") {
        e.preventDefault();
        onIptal();
      }
    };
    window.addEventListener("keydown", dinleyici, { capture: true });
    return () => window.removeEventListener("keydown", dinleyici, { capture: true });
  }, [acik, filtreli, aktifIdxGuncel, onSec, onIptal]);

  if (!acik) return null;

  if (filtreli.length === 0) {
    return (
      <div className="bg-popover absolute left-0 top-full z-50 mt-1 w-64 rounded-md border p-2 shadow-md">
        <p className="text-muted-foreground px-2 py-1 text-xs">
          {sorgu.isPending
            ? "Yükleniyor…"
            : query
              ? `"${query}" eşleşen kişi yok`
              : "Karta erişimi olan kullanıcı yok"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-popover absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-md border shadow-md"
      role="listbox"
      aria-label="Mention edilecek kişi seç"
    >
      <ul className="max-h-60 overflow-y-auto p-1">
        {filtreli.map((u, i) => (
          <li key={u.id}>
            <button
              type="button"
              role="option"
              aria-selected={i === aktifIdxGuncel}
              onMouseEnter={() => setAktifIdx(i)}
              onClick={() => onSec(u.id, `${u.ad} ${u.soyad}`.trim())}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px]",
                i === aktifIdxGuncel ? "bg-accent" : "hover:bg-accent/50",
              )}
            >
              <KisiAvatar ad={u.ad} soyad={u.soyad} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.ad} {u.soyad}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {u.birim_ad ? `${u.birim_ad} · ${u.email}` : u.email}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <p className="bg-muted/50 text-muted-foreground border-t px-2 py-1 text-[10px]">
        Sadece karta erişimi olanlar · ↑↓ gez · Enter seç · Esc iptal
      </p>
    </div>
  );
}
