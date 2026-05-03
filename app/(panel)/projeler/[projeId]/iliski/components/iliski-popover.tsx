"use client";

import * as React from "react";
import { ArrowRightIcon, ArrowLeftIcon, LinkIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ILISKI_TIP_ETIKETI,
  KART_ILISKI_TIPLERI,
  type KartIliskiTipi,
} from "../schemas";
import {
  tempId,
  useIliskiOlustur,
  useIliskiSil,
  useKartIliskileri,
  useProjedeKartAra,
} from "../hooks";

type Props = {
  kartId: string;
  projeId: string;
  trigger: React.ReactNode;
};

export function IliskiPopover({ kartId, projeId, trigger }: Props) {
  const [acik, setAcik] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [tip, setTip] = React.useState<KartIliskiTipi>("RELATES");

  const iliskilerQ = useKartIliskileri(kartId);
  const aramaQ = useProjedeKartAra(projeId, q, kartId);
  const olustur = useIliskiOlustur(kartId);
  const sil = useIliskiSil(kartId);

  const halinde = React.useMemo(
    () => new Set(iliskilerQ.data?.map((i) => i.diger_kart.id) ?? []),
    [iliskilerQ.data],
  );

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent
        side="left"
        align="start"
        className="w-80 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-1.5">
            <LinkIcon className="size-3.5" />
            <p className="text-sm font-medium">İlişkili Kart</p>
          </div>

          {/* Mevcut ilişkiler */}
          {(iliskilerQ.data?.length ?? 0) > 0 && (
            <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto">
              {iliskilerQ.data?.map((i) => (
                <li
                  key={i.id}
                  className="hover:bg-accent/30 flex items-center gap-1.5 rounded px-1.5 py-1 text-xs"
                >
                  {i.yon === "giden" ? (
                    <ArrowRightIcon className="text-muted-foreground size-3" />
                  ) : (
                    <ArrowLeftIcon className="text-muted-foreground size-3" />
                  )}
                  <span
                    className={cn(
                      "rounded px-1 py-0.5 text-[10px] font-medium",
                      i.tip === "BLOCKS" && "bg-red-100 text-red-800",
                      i.tip === "RELATES" && "bg-blue-100 text-blue-800",
                      i.tip === "DUPLICATES" && "bg-amber-100 text-amber-800",
                    )}
                  >
                    {ILISKI_TIP_ETIKETI[i.tip]}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {i.diger_kart.baslik}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => sil.mutate({ id: i.id })}
                    aria-label="İlişkiyi kaldır"
                  >
                    <Trash2Icon className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Yeni ilişki ekleme */}
          <div className="flex flex-col gap-2 border-t pt-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase">
              Yeni ilişki
            </p>
            <Select value={tip} onValueChange={(v) => setTip(v as KartIliskiTipi)}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KART_ILISKI_TIPLERI.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ILISKI_TIP_ETIKETI[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kart başlığı ara"
                className="pl-7"
              />
            </div>

            {(aramaQ.data?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-xs">
                {q ? "Eşleşen kart yok." : "Yazmaya başlayın…"}
              </p>
            ) : (
              <ul className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
                {aramaQ.data?.map((k) => {
                  const seciliMi = halinde.has(k.id);
                  return (
                    <li key={k.id}>
                      <button
                        type="button"
                        disabled={seciliMi}
                        onClick={() =>
                          olustur.mutate({
                            id_taslak: tempId(),
                            kart_a_id: kartId,
                            kart_b_id: k.id,
                            tip,
                            diger_kart: {
                              id: k.id,
                              baslik: k.baslik,
                              liste_ad: k.liste_ad,
                            },
                          })
                        }
                        className={cn(
                          "hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left",
                          seciliMi && "opacity-50",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{k.baslik}</p>
                          <p className="text-muted-foreground truncate text-[10px]">
                            {k.liste_ad}
                          </p>
                        </div>
                        {seciliMi && (
                          <span className="text-muted-foreground text-[10px]">
                            Bağlı
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
