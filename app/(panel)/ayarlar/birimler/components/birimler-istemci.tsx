"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { BirimKategorisi, BirimTipi } from "@prisma/client";
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
import { useOptimisticMutation, eylemMutasyonu } from "@/lib/optimistic";
import {
  BIRIM_KATEGORI_LABEL,
  BIRIM_TIP_LABEL,
  birimGorunenAd,
} from "@/lib/constants/birim";
import { birimListele, birimSilEylem } from "../actions";
import { BirimFormSheet } from "./birim-form";
import { BirimSilDiyalog } from "./birim-sil-diyalog";

type Satir = {
  id: string;
  ad: string | null;
  kisa_ad: string | null;
  kategori: BirimKategorisi;
  tip: BirimTipi;
  il: string | null;
  ilce: string | null;
  aktif: boolean;
  kullanici_sayisi: number;
};

const TUM_KATEGORILER = "__tum_kategoriler__";

export function BirimlerIstemci({ yetkili }: { yetkili: boolean }) {
  const istemci = useQueryClient();
  const [sayfalama, setSayfalama] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [arama, setArama] = React.useState("");
  const [aramaInput, setAramaInput] = React.useState("");
  const [kategoriFiltre, setKategoriFiltre] =
    React.useState<BirimKategorisi | typeof TUM_KATEGORILER>(TUM_KATEGORILER);
  const [duzenlenen, setDuzenlenen] = React.useState<Satir | null>(null);
  const [yeniAcik, setYeniAcik] = React.useState(false);
  const [silinecek, setSilinecek] = React.useState<Satir | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setArama(aramaInput);
      setSayfalama((s) => ({ ...s, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [aramaInput]);

  const sorgu = useQuery({
    queryKey: [
      "birimler",
      {
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama,
        kategori: kategoriFiltre,
      },
    ],
    queryFn: async () => {
      const r = await birimListele({
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama: arama || undefined,
        kategori:
          kategoriFiltre === TUM_KATEGORILER ? undefined : kategoriFiltre,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
  });

  type Liste = { kayitlar: Satir[]; toplam: number };

  const silMut = useOptimisticMutation<{ id: string }, { id: string }>({
    queryKey: ["birimler"],
    mutationFn: eylemMutasyonu(birimSilEylem),
    optimistic: (old, vars) => {
      const v = old as Liste | undefined;
      if (!v) return old;
      return {
        ...v,
        kayitlar: v.kayitlar.filter((k) => k.id !== vars.id),
        toplam: Math.max(0, v.toplam - 1),
      };
    },
    hataMesaji: "Birim silinemedi",
    basariMesaji: "Birim silindi.",
    onSettledExtra: () => setSilinecek(null),
  });

  const kolonlar: ColumnDef<Satir>[] = React.useMemo(
    () => [
      {
        id: "birim",
        header: "Birim",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {birimGorunenAd({ ad: row.original.ad, tip: row.original.tip })}
            </span>
            {row.original.ad && (
              <span className="text-muted-foreground text-xs">
                {BIRIM_TIP_LABEL[row.original.tip]}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "kategori",
        header: "Kategori",
        cell: ({ row }) => (
          <Badge variant="outline">
            {BIRIM_KATEGORI_LABEL[row.original.kategori]}
          </Badge>
        ),
      },
      {
        accessorKey: "kullanici_sayisi",
        header: "Kullanıcı",
        cell: ({ row }) => row.original.kullanici_sayisi,
      },
      {
        accessorKey: "aktif",
        header: "Durum",
        cell: ({ row }) =>
          row.original.aktif ? (
            <Badge variant="secondary">Aktif</Badge>
          ) : (
            <Badge variant="outline">Pasif</Badge>
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
              onClick={() => setDuzenlenen(row.original)}
              disabled={!yetkili}
              aria-label="Düzenle"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSilinecek(row.original)}
              disabled={!yetkili}
              aria-label="Sil"
            >
              <Trash2 className="text-destructive size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [yetkili],
  );

  const veri = sorgu.data?.kayitlar ?? [];
  const toplam = sorgu.data?.toplam ?? 0;
  const kategoriler = Object.keys(BIRIM_KATEGORI_LABEL) as BirimKategorisi[];
  const filtreAktif =
    aramaInput.trim().length > 0 || kategoriFiltre !== TUM_KATEGORILER;

  function filtreleriTemizle() {
    setAramaInput("");
    setArama("");
    setKategoriFiltre(TUM_KATEGORILER);
    setSayfalama((s) => ({ ...s, pageIndex: 0 }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={aramaInput}
              onChange={(e) => setAramaInput(e.target.value)}
              placeholder="Birim ara..."
              className="pl-9"
            />
          </div>
          <Select
            value={kategoriFiltre}
            onValueChange={(v) =>
              setKategoriFiltre(
                (v ?? TUM_KATEGORILER) as
                  | BirimKategorisi
                  | typeof TUM_KATEGORILER,
              )
            }
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue>
                {(v) =>
                  v === TUM_KATEGORILER
                    ? "Tüm kategoriler"
                    : (BIRIM_KATEGORI_LABEL[v as BirimKategorisi] ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TUM_KATEGORILER}>Tüm kategoriler</SelectItem>
              {kategoriler.map((k) => (
                <SelectItem key={k} value={k}>
                  {BIRIM_KATEGORI_LABEL[k]}
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setYeniAcik(true)}
            disabled={!yetkili}
          >
            <Plus className="size-4" /> Yeni Birim
          </Button>
        </div>
      </div>

      <DataTable<Satir>
        veri={veri}
        kolonlar={kolonlar}
        toplam={toplam}
        sayfalama={sayfalama}
        sayfalamaDegisti={setSayfalama}
        yukleniyor={sorgu.isLoading}
        bosMesaj="Henüz birim yok."
        satirAnahtari={(s) => s.id}
        kartGorunumu={(s) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {birimGorunenAd({ ad: s.ad, tip: s.tip })}
              </span>
              {s.aktif ? (
                <Badge variant="secondary">Aktif</Badge>
              ) : (
                <Badge variant="outline">Pasif</Badge>
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {BIRIM_TIP_LABEL[s.tip]} · {BIRIM_KATEGORI_LABEL[s.kategori]}
            </span>
            <div className="text-muted-foreground mt-1 text-xs">
              {s.kullanici_sayisi} kullanıcı
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDuzenlenen(s)}
                disabled={!yetkili}
              >
                <Pencil className="size-4" /> Düzenle
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSilinecek(s)}
                disabled={!yetkili}
              >
                <Trash2 className="text-destructive size-4" /> Sil
              </Button>
            </div>
          </div>
        )}
      />

      <BirimFormSheet
        acik={yeniAcik}
        kapat={() => setYeniAcik(false)}
        baslangic={null}
        basaridaTetikle={() =>
          istemci.invalidateQueries({ queryKey: ["birimler"] })
        }
      />
      <BirimFormSheet
        acik={!!duzenlenen}
        kapat={() => setDuzenlenen(null)}
        baslangic={duzenlenen}
        basaridaTetikle={() =>
          istemci.invalidateQueries({ queryKey: ["birimler"] })
        }
      />
      <BirimSilDiyalog
        kayit={
          silinecek
            ? {
                id: silinecek.id,
                gorunenAd: birimGorunenAd({
                  ad: silinecek.ad,
                  tip: silinecek.tip,
                }),
                kullanici_sayisi: silinecek.kullanici_sayisi,
              }
            : null
        }
        kapat={() => setSilinecek(null)}
        onayla={(id) => silMut.mutate({ id })}
        yukleniyor={silMut.isPending}
      />
    </div>
  );
}
