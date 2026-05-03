"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Eye, Search, X } from "lucide-react";
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
import {
  DENETIM_ISLEM_LABEL,
  denetimIslemEtiketi,
} from "@/lib/constants/log";
import { denetimListele, kaynakTipleriniGetir, type DenetimSatiri } from "../actions";
import { DenetimDiffDiyalog } from "./diff-diyalog";

const TUM_ISLEMLER = "__tum_islemler__";
const TUM_TIPLER = "__tum_tipler__";

const ISLEM_SEC: ReadonlyArray<keyof typeof DENETIM_ISLEM_LABEL> = [
  "CREATE",
  "UPDATE",
  "DELETE",
];

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Europe/Istanbul",
});

function islemRengi(islem: string): "secondary" | "outline" | "destructive" {
  if (islem === "DELETE") return "destructive";
  if (islem === "CREATE") return "secondary";
  return "outline";
}

export function DenetimIstemci() {
  const [sayfalama, setSayfalama] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 30,
  });
  const [aramaInput, setAramaInput] = React.useState("");
  const [arama, setArama] = React.useState("");
  const [islem, setIslem] = React.useState<string>(TUM_ISLEMLER);
  const [kaynakTip, setKaynakTip] = React.useState<string>(TUM_TIPLER);
  const [secili, setSecili] = React.useState<DenetimSatiri | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setArama(aramaInput);
      setSayfalama((s) => ({ ...s, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [aramaInput]);

  const tipSorgu = useQuery({
    queryKey: ["denetim-kaynak-tipleri"],
    queryFn: async () => {
      const r = await kaynakTipleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
  });

  const sorgu = useQuery({
    queryKey: [
      "denetim-loglari",
      {
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama,
        islem,
        kaynakTip,
      },
    ],
    queryFn: async () => {
      const r = await denetimListele({
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama: arama || undefined,
        islem:
          islem === TUM_ISLEMLER
            ? undefined
            : (islem as "CREATE" | "UPDATE" | "DELETE"),
        kaynak_tip: kaynakTip === TUM_TIPLER ? undefined : kaynakTip,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
  });

  const kolonlar: ColumnDef<DenetimSatiri>[] = React.useMemo(
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
        accessorKey: "islem",
        header: "İşlem",
        cell: ({ row }) => (
          <Badge variant={islemRengi(row.original.islem)}>
            {denetimIslemEtiketi(row.original.islem)}
          </Badge>
        ),
      },
      {
        accessorKey: "kaynak_tip",
        header: "Tip",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.kaynak_tip}</span>
        ),
      },
      {
        accessorKey: "kaynak_id",
        header: "Kayıt",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.kaynak_id?.slice(0, 8) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "kullanici_ad",
        header: "Kullanıcı",
        cell: ({ row }) => row.original.kullanici_ad ?? "Sistem",
      },
      {
        accessorKey: "ip",
        header: "IP",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.ip ?? "—"}</span>
        ),
      },
      {
        id: "eylem",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSecili(row.original)}
            aria-label="Detay"
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [],
  );

  const veri = sorgu.data?.kayitlar ?? [];
  const toplam = sorgu.data?.toplam ?? 0;
  const filtreAktif =
    aramaInput.trim().length > 0 ||
    islem !== TUM_ISLEMLER ||
    kaynakTip !== TUM_TIPLER;

  function filtreleriTemizle() {
    setAramaInput("");
    setArama("");
    setIslem(TUM_ISLEMLER);
    setKaynakTip(TUM_TIPLER);
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
            placeholder="Kaynak ID, yol, request ID ara..."
            className="pl-9"
          />
        </div>
        <Select
          value={islem}
          onValueChange={(v) => setIslem(v ?? TUM_ISLEMLER)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue>
              {(v) =>
                v === TUM_ISLEMLER
                  ? "Tüm işlemler"
                  : (DENETIM_ISLEM_LABEL[v as string] ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TUM_ISLEMLER}>Tüm işlemler</SelectItem>
            {ISLEM_SEC.map((i) => (
              <SelectItem key={i} value={i}>
                {DENETIM_ISLEM_LABEL[i]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={kaynakTip}
          onValueChange={(v) => setKaynakTip(v ?? TUM_TIPLER)}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue>
              {(v) => (v === TUM_TIPLER ? "Tüm kaynak tipleri" : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TUM_TIPLER}>Tüm kaynak tipleri</SelectItem>
            {(tipSorgu.data ?? []).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
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

      <DataTable<DenetimSatiri>
        veri={veri}
        kolonlar={kolonlar}
        toplam={toplam}
        sayfalama={sayfalama}
        sayfalamaDegisti={setSayfalama}
        yukleniyor={sorgu.isLoading}
        bosMesaj="Henüz kayıt yok."
        satirAnahtari={(s) => s.id}
        kartGorunumu={(s) => (
          <button
            type="button"
            onClick={() => setSecili(s)}
            className="flex w-full flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between">
              <Badge variant={islemRengi(s.islem)}>
                {denetimIslemEtiketi(s.islem)}
              </Badge>
              <span className="text-muted-foreground font-mono text-xs">
                {TARIH_FORMAT.format(new Date(s.zaman))}
              </span>
            </div>
            <span className="text-sm">
              {s.kaynak_tip}
              {s.kaynak_id ? ` · ${s.kaynak_id.slice(0, 8)}` : ""}
            </span>
            <span className="text-muted-foreground text-xs">
              {s.kullanici_ad ?? "Sistem"} · {s.ip ?? "—"}
            </span>
          </button>
        )}
      />

      <DenetimDiffDiyalog kayit={secili} kapat={() => setSecili(null)} />
    </div>
  );
}
