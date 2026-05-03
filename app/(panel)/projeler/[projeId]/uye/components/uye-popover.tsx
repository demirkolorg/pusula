"use client";

import * as React from "react";
import { CheckIcon, PlusIcon, SearchIcon, UsersIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useKartaUyeEkle,
  useKartaUyeKaldir,
  useKartUyeleri,
  useProjeAdayKullanicilar,
  useProjeUyeleri,
  useProjeyeUyeEkle,
} from "../hooks";
import { UyeAvatar } from "./uye-avatar";

type Props = {
  kartId: string;
  projeId: string;
  trigger: React.ReactNode;
};

type Mod = { tip: "kart" } | { tip: "proje-ekle" };

export function UyePopover({ kartId, projeId, trigger }: Props) {
  const [acik, setAcik] = React.useState(false);
  const [mod, setMod] = React.useState<Mod>({ tip: "kart" });

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side="left"
        align="start"
        className="w-72 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {mod.tip === "kart" ? (
          <KartUyeListe
            kartId={kartId}
            projeId={projeId}
            projeUyeEkleAc={() => setMod({ tip: "proje-ekle" })}
          />
        ) : (
          <ProjeAdayAra
            projeId={projeId}
            geri={() => setMod({ tip: "kart" })}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

// =====================================================================
// Kart üyeleri — toggle list
// =====================================================================

function KartUyeListe({
  kartId,
  projeId,
  projeUyeEkleAc,
}: {
  kartId: string;
  projeId: string;
  projeUyeEkleAc: () => void;
}) {
  const projeUyeleri = useProjeUyeleri(projeId);
  const kartUyeleri = useKartUyeleri(kartId);
  const ekle = useKartaUyeEkle(kartId, projeId);
  const kaldir = useKartaUyeKaldir(kartId, projeId);

  const seciliSet = React.useMemo(
    () => new Set(kartUyeleri.data?.map((u) => u.kullanici_id) ?? []),
    [kartUyeleri.data],
  );

  const toggle = (uye: { kullanici_id: string; ad: string; soyad: string; email: string }) => {
    if (seciliSet.has(uye.kullanici_id)) {
      kaldir.mutate({ kart_id: kartId, kullanici_id: uye.kullanici_id });
    } else {
      ekle.mutate({
        kart_id: kartId,
        kullanici_id: uye.kullanici_id,
        uye_ozeti: uye,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-sm font-medium">Üyeler</p>
      {projeUyeleri.isLoading ? (
        <p className="text-muted-foreground text-xs">Yükleniyor…</p>
      ) : (projeUyeleri.data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground text-xs">Proje üyesi yok.</p>
      ) : (
        <ul className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
          {projeUyeleri.data?.map((u) => {
            const seciliMi = seciliSet.has(u.kullanici_id);
            return (
              <li key={u.kullanici_id}>
                <button
                  type="button"
                  onClick={() =>
                    toggle({
                      kullanici_id: u.kullanici_id,
                      ad: u.ad,
                      soyad: u.soyad,
                      email: u.email,
                    })
                  }
                  className={cn(
                    "hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left",
                    seciliMi && "bg-accent/50",
                  )}
                  aria-pressed={seciliMi}
                >
                  <UyeAvatar ad={u.ad} soyad={u.soyad} />
                  <span className="flex-1 truncate text-sm">
                    {u.ad} {u.soyad}
                  </span>
                  {u.seviye === "ADMIN" && (
                    <span className="text-muted-foreground text-[10px] uppercase">
                      Admin
                    </span>
                  )}
                  {seciliMi && <CheckIcon className="size-3.5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Button variant="outline" size="sm" onClick={projeUyeEkleAc}>
        <PlusIcon className="size-3" /> Projeye üye ekle
      </Button>
    </div>
  );
}

// =====================================================================
// Proje'ye yeni üye ekleme — kuruma ait kullanıcı arama
// =====================================================================

function ProjeAdayAra({
  projeId,
  geri,
}: {
  projeId: string;
  geri: () => void;
}) {
  const [q, setQ] = React.useState("");
  const sorgu = useProjeAdayKullanicilar(projeId, q);
  const ekle = useProjeyeUyeEkle(projeId);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={geri}
          aria-label="Geri"
        >
          <XIcon className="size-3.5" />
        </Button>
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <UsersIcon className="size-3.5" />
          Üye ekle
        </p>
        <span className="w-7" />
      </div>

      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ad, soyad veya email"
          className="pl-7"
        />
      </div>

      {sorgu.isLoading && q ? (
        <p className="text-muted-foreground text-xs">Aranıyor…</p>
      ) : (sorgu.data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground text-xs">
          {q ? "Eşleşen kullanıcı yok." : "Kullanıcı aramaya başlayın."}
        </p>
      ) : (
        <ul className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
          {sorgu.data?.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() =>
                  ekle.mutate({ proje_id: projeId, kullanici_id: u.id, seviye: "NORMAL" })
                }
                className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left"
              >
                <UyeAvatar ad={u.ad} soyad={u.soyad} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{u.ad} {u.soyad}</p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {u.email}
                  </p>
                </div>
                <PlusIcon className="text-muted-foreground size-3.5 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
