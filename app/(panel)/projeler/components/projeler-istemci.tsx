"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import {
  projelerKey,
  useProjeArsivle,
  useProjeGeriYukle,
  useProjeGuncelle,
  useProjeler,
  useProjeSil,
} from "../hooks/proje-sorgulari";
import type { ProjeKart as ProjeKartTipi } from "../services";
import { ProjeFormSheet } from "./proje-form";
import { ProjeKart } from "./proje-kart";

type Filtre = "aktif" | "yildizli" | "arsiv" | "silinmis";

const SEKMELER: Array<{ kod: Filtre; etiket: string }> = [
  { kod: "aktif", etiket: "Aktif" },
  { kod: "yildizli", etiket: "Yıldızlı" },
  { kod: "arsiv", etiket: "Arşiv" },
  { kod: "silinmis", etiket: "Silinmiş" },
];

export function ProjelerIstemci({ yetkili }: { yetkili: boolean }) {
  const [filtre, setFiltre] = React.useState<Filtre>("aktif");
  const [aramaInput, setAramaInput] = React.useState("");
  const [arama, setArama] = React.useState("");
  const [yeniAcik, setYeniAcik] = React.useState(false);
  const [duzenlenen, setDuzenlenen] = React.useState<ProjeKartTipi | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setArama(aramaInput.trim()), 250);
    return () => clearTimeout(t);
  }, [aramaInput]);

  const anahtar = projelerKey(filtre, arama);
  const sorgu = useProjeler(filtre, arama);

  const guncelle = useProjeGuncelle(anahtar);
  const arsivle = useProjeArsivle(anahtar);
  const sil = useProjeSil(anahtar);
  const geriYukle = useProjeGeriYukle(anahtar);

  const projeler = sorgu.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {SEKMELER.map((s) => (
            <Button
              key={s.kod}
              type="button"
              size="sm"
              variant={filtre === s.kod ? "default" : "outline"}
              onClick={() => setFiltre(s.kod)}
            >
              {s.etiket}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={aramaInput}
              onChange={(e) => setAramaInput(e.target.value)}
              placeholder="Proje ara..."
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            onClick={() => setYeniAcik(true)}
            disabled={!yetkili}
          >
            <Plus className="size-4" /> Yeni Proje
          </Button>
        </div>
      </div>

      {sorgu.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : projeler.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {arama
              ? `"${arama}" için sonuç yok.`
              : filtre === "aktif"
                ? "Henüz proje yok. İlk projeni oluştur."
                : "Bu filtrede gösterilecek proje yok."}
          </p>
          {filtre === "aktif" && !arama && yetkili && (
            <Button
              type="button"
              className="mt-4"
              onClick={() => setYeniAcik(true)}
            >
              <Plus className="size-4" /> Yeni Proje
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projeler.map((p) => (
            <ProjeKart
              key={p.id}
              proje={p}
              yetkili={yetkili}
              onDuzenle={() => setDuzenlenen(p)}
              onArsivAc={(yeni) => arsivle.mutate({ id: p.id, arsiv_mi: yeni })}
              onSil={() => {
                sil.mutate({ id: p.id });
                toast.gerial("Proje silindi", {
                  butonMetni: "Geri al",
                  onUndo: () =>
                    geriYukle.mutate({ id: p.id }, {
                      onSuccess: () => toast.basari("Proje geri yüklendi"),
                    }),
                });
              }}
              onYildiz={(yeni) =>
                guncelle.mutate({ id: p.id, yildizli_mi: yeni })
              }
              onGeriYukle={() =>
                geriYukle.mutate({ id: p.id }, {
                  onSuccess: () => toast.basari("Proje geri yüklendi"),
                })
              }
            />
          ))}
        </div>
      )}

      <ProjeFormSheet
        acik={yeniAcik}
        kapat={() => setYeniAcik(false)}
        baslangic={null}
        filtre={filtre}
        arama={arama}
      />
      <ProjeFormSheet
        acik={!!duzenlenen}
        kapat={() => setDuzenlenen(null)}
        baslangic={duzenlenen}
        filtre={filtre}
        arama={arama}
      />
    </div>
  );
}
