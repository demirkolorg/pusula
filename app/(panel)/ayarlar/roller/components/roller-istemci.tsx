"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Copy, Plus, Search, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoller } from "../hooks/rol-sorgulari";
import type { RolSatiri } from "../services";
import { RolFormDialog } from "./rol-form-dialog";
import { RolCogaltDialog } from "./rol-cogalt-dialog";
import { RolSilOnay } from "./rol-sil-onay";

type RollerIstemciProps = {
  aktifKullaniciId: string;
};

export function RollerIstemci({ aktifKullaniciId }: RollerIstemciProps) {
  const [arama, setArama] = useState("");
  const [olusturAcik, setOlusturAcik] = useState(false);
  const [cogaltKaynak, setCogaltKaynak] = useState<RolSatiri | null>(null);
  const [silmeHedefi, setSilmeHedefi] = useState<RolSatiri | null>(null);

  const sorgu = useRoller(arama);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Rol ara…"
            className="pl-9"
            aria-label="Rol ara"
          />
        </div>
        <Button
          onClick={() => setOlusturAcik(true)}
          className="min-h-11 w-full sm:w-auto"
        >
          <Plus className="mr-1 h-4 w-4" />
          Yeni Rol
        </Button>
      </div>

      {sorgu.isLoading ? (
        <YukleniyorIskelet />
      ) : sorgu.isError ? (
        <p className="text-destructive text-sm">
          Roller yüklenemedi: {sorgu.error.message}
        </p>
      ) : sorgu.data && sorgu.data.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorgu.data.map((rol) => (
            <RolKart
              key={rol.id}
              rol={rol}
              cogalt={() => setCogaltKaynak(rol)}
              sil={() => setSilmeHedefi(rol)}
            />
          ))}
        </ul>
      ) : (
        <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
          Henüz rol yok. &ldquo;Yeni Rol&rdquo; ile başlayın.
        </div>
      )}

      <RolFormDialog
        acik={olusturAcik}
        kapat={() => setOlusturAcik(false)}
      />
      {cogaltKaynak && (
        <RolCogaltDialog
          kaynak={cogaltKaynak}
          acik={Boolean(cogaltKaynak)}
          kapat={() => setCogaltKaynak(null)}
        />
      )}
      {silmeHedefi && (
        <RolSilOnay
          rol={silmeHedefi}
          acik={Boolean(silmeHedefi)}
          kapat={() => setSilmeHedefi(null)}
          aktifKullaniciId={aktifKullaniciId}
        />
      )}
    </div>
  );
}

type RolKartProps = {
  rol: RolSatiri;
  cogalt: () => void;
  sil: () => void;
};

function RolKart({ rol, cogalt, sil }: RolKartProps) {
  return (
    <li className="bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{rol.ad}</h3>
            {rol.sistem_rolu && (
              <Badge variant="secondary" className="text-xs">
                Sistem
              </Badge>
            )}
          </div>
          <code className="text-muted-foreground mt-0.5 block truncate text-xs">
            {rol.kod}
          </code>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={cogalt}
            className="h-9 w-9"
            aria-label="Çoğalt"
            title="Çoğalt"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {!rol.sistem_rolu && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={sil}
              className="text-destructive hover:text-destructive h-9 w-9"
              aria-label="Sil"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {rol.aciklama && (
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {rol.aciklama}
        </p>
      )}

      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {rol.kullanici_sayisi} kullanıcı
        </span>
        <span>{rol.izin_sayisi} izin</span>
        <span>v{rol.izin_versiyonu}</span>
      </div>

      <Link
        href={`/ayarlar/roller/${rol.id}`}
        className="text-primary hover:bg-primary/5 -mx-2 -mb-2 inline-flex min-h-11 items-center justify-between gap-1 rounded-md px-2 text-sm font-medium"
      >
        Yetkileri Düzenle
        <ChevronRight className="h-4 w-4" />
      </Link>
    </li>
  );
}

function YukleniyorIskelet() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="bg-card flex flex-col gap-3 rounded-lg border p-4"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </li>
      ))}
    </ul>
  );
}
