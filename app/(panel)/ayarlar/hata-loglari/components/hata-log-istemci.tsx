"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Check, Eye, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/tablo/data-table";
import { toast } from "@/lib/toast";
import {
  HATA_SEVIYE_LABEL,
  HATA_TARAF_LABEL,
  hataSeviyeEtiketi,
  hataTarafEtiketi,
} from "@/lib/constants/log";
import {
  hataCozumIsaretle,
  hataListele,
  type HataSatiri,
} from "../actions";
import { HataDetayDiyalog } from "./detay-diyalog";

const TUM_SEVIYELER = "__tum_seviyeler__";
const TUM_TARAFLAR = "__tum_taraflar__";
const TUM_DURUMLAR = "__tum_durumlar__";
const COZUM_EVET = "__evet__";
const COZUM_HAYIR = "__hayir__";

const SEVIYE_SEC: ReadonlyArray<keyof typeof HATA_SEVIYE_LABEL> = [
  "FATAL",
  "ERROR",
  "WARN",
  "INFO",
  "DEBUG",
];
const TARAF_SEC: ReadonlyArray<keyof typeof HATA_TARAF_LABEL> = [
  "BACKEND",
  "FRONTEND",
];

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Istanbul",
});

function seviyeRengi(s: string): "secondary" | "outline" | "destructive" {
  if (s === "FATAL" || s === "ERROR") return "destructive";
  if (s === "WARN") return "outline";
  return "secondary";
}

export function HataLogIstemci() {
  const istemci = useQueryClient();
  const [sayfalama, setSayfalama] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 30,
  });
  const [aramaInput, setAramaInput] = React.useState("");
  const [arama, setArama] = React.useState("");
  const [seviye, setSeviye] = React.useState<string>(TUM_SEVIYELER);
  const [taraf, setTaraf] = React.useState<string>(TUM_TARAFLAR);
  const [cozum, setCozum] = React.useState<string>(TUM_DURUMLAR);
  const [secili, setSecili] = React.useState<HataSatiri | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setArama(aramaInput);
      setSayfalama((s) => ({ ...s, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [aramaInput]);

  const sorgu = useQuery({
    queryKey: [
      "hata-loglari",
      {
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama,
        seviye,
        taraf,
        cozum,
      },
    ],
    queryFn: async () => {
      const r = await hataListele({
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama: arama || undefined,
        seviye:
          seviye === TUM_SEVIYELER
            ? undefined
            : (seviye as "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL"),
        taraf:
          taraf === TUM_TARAFLAR
            ? undefined
            : (taraf as "BACKEND" | "FRONTEND"),
        cozuldu_mu:
          cozum === TUM_DURUMLAR
            ? undefined
            : cozum === COZUM_EVET
              ? true
              : false,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
  });

  const cozumMut = useMutation({
    mutationFn: async (girdi: { id: string; not?: string }) => {
      const r = await hataCozumIsaretle({
        id: girdi.id,
        cozum_notu: girdi.not,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    onSuccess: () => {
      toast.basari("Çözüldü olarak işaretlendi.");
      void istemci.invalidateQueries({ queryKey: ["hata-loglari"] });
      setSecili(null);
    },
    onError: (e) => toast.hata((e as Error).message),
  });

  const kolonlar: ColumnDef<HataSatiri>[] = React.useMemo(
    () => [
      {
        accessorKey: "zaman",
        header: "Zaman",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {TARIH_FORMAT.format(new Date(row.original.zaman))}
          </span>
        ),
      },
      {
        accessorKey: "seviye",
        header: "Seviye",
        cell: ({ row }) => (
          <Badge variant={seviyeRengi(row.original.seviye)}>
            {hataSeviyeEtiketi(row.original.seviye)}
          </Badge>
        ),
      },
      {
        accessorKey: "taraf",
        header: "Taraf",
        cell: ({ row }) => (
          <Badge variant="outline">{hataTarafEtiketi(row.original.taraf)}</Badge>
        ),
      },
      {
        id: "mesaj",
        header: "Mesaj",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="line-clamp-1 font-medium">
              {row.original.mesaj}
            </span>
            {row.original.hata_tipi && (
              <span className="text-muted-foreground font-mono text-xs">
                {row.original.hata_tipi}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-1 font-mono text-xs">
            {row.original.url ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "cozuldu_mu",
        header: "Durum",
        cell: ({ row }) =>
          row.original.cozuldu_mu ? (
            <Badge variant="secondary">Çözüldü</Badge>
          ) : (
            <Badge variant="outline">Açık</Badge>
          ),
      },
      {
        id: "eylem",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSecili(row.original)}
              aria-label="Detay"
            >
              <Eye className="size-4" />
            </Button>
            {!row.original.cozuldu_mu && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => cozumMut.mutate({ id: row.original.id })}
                aria-label="Çözüldü işaretle"
              >
                <Check className="text-primary size-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [cozumMut],
  );

  const veri = sorgu.data?.kayitlar ?? [];
  const toplam = sorgu.data?.toplam ?? 0;
  const filtreAktif =
    aramaInput.trim().length > 0 ||
    seviye !== TUM_SEVIYELER ||
    taraf !== TUM_TARAFLAR ||
    cozum !== TUM_DURUMLAR;

  function filtreleriTemizle() {
    setAramaInput("");
    setArama("");
    setSeviye(TUM_SEVIYELER);
    setTaraf(TUM_TARAFLAR);
    setCozum(TUM_DURUMLAR);
    setSayfalama((s) => ({ ...s, pageIndex: 0 }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={aramaInput}
            onChange={(e) => setAramaInput(e.target.value)}
            placeholder="Mesaj, tip, URL, request ID..."
            className="pl-9"
          />
        </div>
        <Select
          value={seviye}
          onValueChange={(v) => setSeviye(v ?? TUM_SEVIYELER)}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue>
              {(v) =>
                v === TUM_SEVIYELER
                  ? "Tüm seviyeler"
                  : (HATA_SEVIYE_LABEL[v as string] ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TUM_SEVIYELER}>Tüm seviyeler</SelectItem>
            {SEVIYE_SEC.map((s) => (
              <SelectItem key={s} value={s}>
                {HATA_SEVIYE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={taraf}
          onValueChange={(v) => setTaraf(v ?? TUM_TARAFLAR)}
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue>
              {(v) =>
                v === TUM_TARAFLAR
                  ? "Tüm taraflar"
                  : (HATA_TARAF_LABEL[v as string] ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TUM_TARAFLAR}>Tüm taraflar</SelectItem>
            {TARAF_SEC.map((t) => (
              <SelectItem key={t} value={t}>
                {HATA_TARAF_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={cozum}
          onValueChange={(v) => setCozum(v ?? TUM_DURUMLAR)}
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue>
              {(v) =>
                v === TUM_DURUMLAR
                  ? "Tüm durumlar"
                  : v === COZUM_EVET
                    ? "Çözüldü"
                    : v === COZUM_HAYIR
                      ? "Açık"
                      : v
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TUM_DURUMLAR}>Tüm durumlar</SelectItem>
            <SelectItem value={COZUM_HAYIR}>Açık</SelectItem>
            <SelectItem value={COZUM_EVET}>Çözüldü</SelectItem>
          </SelectContent>
        </Select>
        {filtreAktif && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={filtreleriTemizle}
          >
            <X className="size-4" /> Filtreleri temizle
          </Button>
        )}
      </div>

      <DataTable<HataSatiri>
        veri={veri}
        kolonlar={kolonlar}
        toplam={toplam}
        sayfalama={sayfalama}
        sayfalamaDegisti={setSayfalama}
        yukleniyor={sorgu.isLoading}
        bosMesaj="Hata kaydı yok."
        satirAnahtari={(s) => s.id}
        kartGorunumu={(s) => (
          <button
            type="button"
            onClick={() => setSecili(s)}
            className="flex w-full flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between">
              <Badge variant={seviyeRengi(s.seviye)}>
                {hataSeviyeEtiketi(s.seviye)}
              </Badge>
              <span className="text-muted-foreground font-mono text-xs">
                {TARIH_FORMAT.format(new Date(s.zaman))}
              </span>
            </div>
            <span className="line-clamp-2 text-sm font-medium">{s.mesaj}</span>
            {s.hata_tipi && (
              <span className="text-muted-foreground font-mono text-xs">
                {s.hata_tipi}
              </span>
            )}
            <span className="text-muted-foreground line-clamp-1 text-xs">
              {s.url ?? ""}
            </span>
            <div className="mt-1 flex items-center justify-between">
              <Badge variant="outline">{hataTarafEtiketi(s.taraf)}</Badge>
              {s.cozuldu_mu ? (
                <Badge variant="secondary">Çözüldü</Badge>
              ) : (
                <Badge variant="outline">Açık</Badge>
              )}
            </div>
          </button>
        )}
      />

      <HataDetayDiyalog
        kayit={secili}
        kapat={() => setSecili(null)}
        cozumIsaretle={(not) =>
          secili && cozumMut.mutate({ id: secili.id, not })
        }
        yukleniyor={cozumMut.isPending}
      />
    </div>
  );
}
