"use client";

import * as React from "react";
import { SearchIcon, UserIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useKartMaddeAdayKullanicilar, useMaddeGuncelle } from "../hooks";
import { KisiAvatar } from "../../yetkili/components/kisi-avatar";

type MevcutAtanan = { ad: string; soyad: string } | null;

type Props = {
  kartId: string;
  maddeId: string;
  mevcutAtanan: MevcutAtanan;
  duzenleyebilir: boolean;
  trigger: React.ReactNode;
};

export function MaddeAtananPopover({
  kartId,
  maddeId,
  mevcutAtanan,
  duzenleyebilir,
  trigger,
}: Props) {
  const [acik, setAcik] = React.useState(false);

  // Yetki yoksa popover açılmasın — trigger sadece okuma amaçlı kalır.
  if (!duzenleyebilir) {
    return <>{trigger}</>;
  }

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Icerik
          kartId={kartId}
          maddeId={maddeId}
          mevcutAtanan={mevcutAtanan}
          acik={acik}
          kapat={() => setAcik(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function Icerik({
  kartId,
  maddeId,
  mevcutAtanan,
  acik,
  kapat,
}: {
  kartId: string;
  maddeId: string;
  mevcutAtanan: MevcutAtanan;
  acik: boolean;
  kapat: () => void;
}) {
  const [q, setQ] = React.useState("");
  const guncelle = useMaddeGuncelle(kartId);
  const adaylar = useKartMaddeAdayKullanicilar(kartId, q, acik);

  const ata = (aday: { id: string; ad: string; soyad: string }) => {
    guncelle.mutate({
      id: maddeId,
      atanan_id: aday.id,
      atanan_ozeti: { ad: aday.ad, soyad: aday.soyad },
    });
    kapat();
  };

  const kaldir = () => {
    guncelle.mutate({ id: maddeId, atanan_id: null, atanan_ozeti: null });
    kapat();
  };

  const liste = adaylar.data ?? [];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid gap-1">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <UserIcon className="size-3.5" />
          Sorumlu kişi
        </p>
        <p className="text-muted-foreground text-xs">
          Sadece karta erişimi olanlar listelenir.
        </p>
      </div>

      {mevcutAtanan && (
        <div className="bg-muted/40 flex items-center gap-2 rounded px-2 py-1.5">
          <KisiAvatar ad={mevcutAtanan.ad} soyad={mevcutAtanan.soyad} />
          <p className="min-w-0 flex-1 truncate text-sm">
            {mevcutAtanan.ad} {mevcutAtanan.soyad}
          </p>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={kaldir}
            aria-label="Sorumluluğu kaldır"
            className="text-muted-foreground hover:text-destructive"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      )}

      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sorumlu olarak atanacak kişiyi ara"
          className="h-8 pl-7"
        />
      </div>

      {adaylar.isLoading ? (
        <p className="text-muted-foreground py-2 text-center text-xs">
          Yükleniyor...
        </p>
      ) : liste.length === 0 ? (
        <p className="text-muted-foreground py-2 text-center text-xs">
          Eşleşen kullanıcı yok.
        </p>
      ) : (
        <ul className="flex max-h-52 flex-col gap-1 overflow-y-auto">
          {liste.map((aday) => (
            <li key={aday.id}>
              <button
                type="button"
                disabled={guncelle.isPending}
                onClick={() => ata(aday)}
                className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KisiAvatar ad={aday.ad} soyad={aday.soyad} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {aday.ad} {aday.soyad}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {aday.birim_ad ?? aday.email}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
