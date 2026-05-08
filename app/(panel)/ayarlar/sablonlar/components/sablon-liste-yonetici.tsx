"use client";

// Şablon formu için liste yönetimi — ekle/sil/sırala (yukarı/aşağı buton).
// Drag-drop YOK (MVP basit tut, kontrol U.6 risk azaltma).
// Saf logic: sablon-form-helper.ts; bu component sadece UI.

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listeEkle,
  listeGuncelle,
  listeSil,
  listeyiAsagiTasi,
  listeyiYukariTasi,
  type SablonListeTaslagi,
} from "./sablon-form-helper";

type Props = {
  listeler: SablonListeTaslagi[];
  onChange: (yeni: SablonListeTaslagi[]) => void;
  hatalar?: Array<{ ad?: string; wip_limit?: string } | undefined>;
};

const MAX_LISTE = 20; // schemas.ts ile uyumlu (sablonOlusturSemasi).

export function SablonListeYonetici({ listeler, onChange, hatalar }: Props) {
  const ekle = () => {
    if (listeler.length >= MAX_LISTE) return;
    onChange(listeEkle(listeler));
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>Listeler ({listeler.length})</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={ekle}
          disabled={listeler.length >= MAX_LISTE}
        >
          <PlusIcon className="mr-1 h-3.5 w-3.5" />
          Liste Ekle
        </Button>
      </div>

      {listeler.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
          Henüz liste yok. Sıfırdan başlayan proje için listesiz bırakabilirsin
          ya da hazır listeler ekleyebilirsin.
        </div>
      ) : (
        <ul className="grid gap-2">
          {listeler.map((liste, index) => {
            const hata = hatalar?.[index];
            return (
              <li
                // Sprint 3 / S3-19 — _tempId stable key (listeEkle ile
                // dinamik üretilir); fallback: ad+index kombosu.
                key={liste._tempId ?? `${liste.ad}:${index}`}
                className="bg-muted/30 grid gap-1.5 rounded-lg border p-2"
              >
                <div className="flex items-start gap-1.5">
                  <div className="grid flex-1 gap-1.5">
                    <Input
                      value={liste.ad}
                      onChange={(e) =>
                        onChange(
                          listeGuncelle(listeler, index, { ad: e.target.value }),
                        )
                      }
                      placeholder="Liste adı (örn. Yapılacak)"
                      className="h-8"
                    />
                    {hata?.ad && (
                      <p className="text-destructive text-xs">{hata.ad}</p>
                    )}
                  </div>

                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={liste.wip_limit ?? ""}
                    onChange={(e) => {
                      const sayi = e.target.value === "" ? null : Number(e.target.value);
                      onChange(
                        listeGuncelle(listeler, index, {
                          wip_limit: sayi !== null && Number.isFinite(sayi) ? sayi : null,
                        }),
                      );
                    }}
                    placeholder="WIP"
                    className="h-8 w-16"
                    aria-label="WIP limiti (opsiyonel)"
                  />

                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        onChange(listeyiYukariTasi(listeler, index))
                      }
                      disabled={index === 0}
                      aria-label="Yukarı taşı"
                    >
                      <ArrowUpIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        onChange(listeyiAsagiTasi(listeler, index))
                      }
                      disabled={index === listeler.length - 1}
                      aria-label="Aşağı taşı"
                    >
                      <ArrowDownIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onChange(listeSil(listeler, index))}
                      aria-label="Listeyi sil"
                    >
                      <Trash2Icon className="text-destructive h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {hata?.wip_limit && (
                  <p className="text-destructive text-xs">{hata.wip_limit}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
