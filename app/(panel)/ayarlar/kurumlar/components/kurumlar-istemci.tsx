"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { KurumKategorisi, KurumTipi } from "@prisma/client";
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
  KURUM_KATEGORI_LABEL,
  KURUM_TIP_LABEL,
  kurumGorunenAd,
} from "@/lib/constants/kurum";
import { kurumListele, kurumSilEylem } from "../actions";
import { KurumFormSheet } from "./kurum-form";
import { KurumSilDiyalog } from "./kurum-sil-diyalog";

type Satir = {
  id: string;
  ad: string | null;
  kisa_ad: string | null;
  kategori: KurumKategorisi;
  tip: KurumTipi;
  il: string | null;
  ilce: string | null;
  aktif: boolean;
  kullanici_sayisi: number;
};

const TUM_KATEGORILER = "__tum_kategoriler__";

export function KurumlarIstemci({ yetkili }: { yetkili: boolean }) {
  const istemci = useQueryClient();
  const [sayfalama, setSayfalama] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [arama, setArama] = React.useState("");
  const [aramaInput, setAramaInput] = React.useState("");
  const [kategoriFiltre, setKategoriFiltre] =
    React.useState<KurumKategorisi | typeof TUM_KATEGORILER>(TUM_KATEGORILER);
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
      "kurumlar",
      {
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama,
        kategori: kategoriFiltre,
      },
    ],
    queryFn: async () => {
      const r = await kurumListele({
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
    queryKey: ["kurumlar"],
    mutationFn: eylemMutasyonu(kurumSilEylem),
    optimistic: (old, vars) => {
      const v = old as Liste | undefined;
      if (!v) return old;
      return {
        ...v,
        kayitlar: v.kayitlar.filter((k) => k.id !== vars.id),
        toplam: Math.max(0, v.toplam - 1),
      };
    },
    hataMesaji: "Kurum silinemedi",
    basariMesaji: "Kurum silindi.",
    onSettledExtra: () => setSilinecek(null),
  });

  const kolonlar: ColumnDef<Satir>[] = React.useMemo(
    () => [
      {
        id: "kurum",
        header: "Kurum",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {kurumGorunenAd({ ad: row.original.ad, tip: row.original.tip })}
            </span>
            {row.original.ad && (
              <span className="text-muted-foreground text-xs">
                {KURUM_TIP_LABEL[row.original.tip]}
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
            {KURUM_KATEGORI_LABEL[row.original.kategori]}
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
  const kategoriler = Object.keys(KURUM_KATEGORI_LABEL) as KurumKategorisi[];
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
              placeholder="Kurum ara..."
              className="pl-9"
            />
          </div>
          <Select
            value={kategoriFiltre}
            onValueChange={(v) =>
              setKategoriFiltre(
                (v ?? TUM_KATEGORILER) as
                  | KurumKategorisi
                  | typeof TUM_KATEGORILER,
              )
            }
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue>
                {(v) =>
                  v === TUM_KATEGORILER
                    ? "Tüm kategoriler"
                    : (KURUM_KATEGORI_LABEL[v as KurumKategorisi] ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TUM_KATEGORILER}>Tüm kategoriler</SelectItem>
              {kategoriler.map((k) => (
                <SelectItem key={k} value={k}>
                  {KURUM_KATEGORI_LABEL[k]}
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
            <Plus className="size-4" /> Yeni Kurum
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
        bosMesaj="Henüz kurum yok."
        satirAnahtari={(s) => s.id}
        kartGorunumu={(s) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {kurumGorunenAd({ ad: s.ad, tip: s.tip })}
              </span>
              {s.aktif ? (
                <Badge variant="secondary">Aktif</Badge>
              ) : (
                <Badge variant="outline">Pasif</Badge>
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {KURUM_TIP_LABEL[s.tip]} · {KURUM_KATEGORI_LABEL[s.kategori]}
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

      <KurumFormSheet
        acik={yeniAcik}
        kapat={() => setYeniAcik(false)}
        baslangic={null}
        basaridaTetikle={() =>
          istemci.invalidateQueries({ queryKey: ["kurumlar"] })
        }
      />
      <KurumFormSheet
        acik={!!duzenlenen}
        kapat={() => setDuzenlenen(null)}
        baslangic={duzenlenen}
        basaridaTetikle={() =>
          istemci.invalidateQueries({ queryKey: ["kurumlar"] })
        }
      />
      <KurumSilDiyalog
        kayit={
          silinecek
            ? {
                id: silinecek.id,
                gorunenAd: kurumGorunenAd({
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
