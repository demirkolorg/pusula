"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const yonlendir = useRouter();
  const [deger, setDeger] = React.useState("");

  function gonder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sorgu = deger.trim();
    if (sorgu.length === 0) return;
    yonlendir.push(`/arama?q=${encodeURIComponent(sorgu)}`);
  }

  return (
    <form onSubmit={gonder} role="search" className="relative w-72 max-w-full">
      <SearchIcon
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2"
      />
      <Input
        type="search"
        value={deger}
        onChange={(event) => setDeger(event.target.value)}
        placeholder="Ara..."
        aria-label="Genel arama"
        className="h-8 pl-8"
      />
    </form>
  );
}
