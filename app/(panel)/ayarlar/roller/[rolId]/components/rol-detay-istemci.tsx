"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Save, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useRolDetay,
  useRolGuncelle,
  useRolIzinleriniGuncelle,
  useTumIzinler,
} from "../../hooks/rol-sorgulari";
import type { RolDetay } from "../../services";
import { IzinMatrisi } from "./izin-matrisi";
import {
  diffBosMu,
  izinDiffi,
  rolYonetKaldiriliyorMu,
  type IzinSatiri,
} from "./izin-matrisi-helper";

type RolDetayIstemciProps = {
  rolId: string;
  ilkRol: RolDetay;
  ilkIzinler: IzinSatiri[];
  aktifKullaniciId: string;
};

export function RolDetayIstemci({
  rolId,
  ilkRol,
  ilkIzinler,
  aktifKullaniciId,
}: RolDetayIstemciProps) {
  const rolSorgu = useRolDetay(rolId);
  const izinlerSorgu = useTumIzinler();
  const guncelleIzinler = useRolIzinleriniGuncelle(rolId);
  const guncelleMeta = useRolGuncelle();

  const rol = rolSorgu.data ?? ilkRol;
  const izinler = izinlerSorgu.data ?? ilkIzinler;

  // İzin seçim state — baseline rolün mevcut izinleri.
  const baseline = useMemo(() => new Set(rol.izinler), [rol.izinler]);
  const [secili, setSecili] = useState<Set<string>>(
    () => new Set(rol.izinler),
  );

  // Rol versiyonu sunucudan değiştiğinde (kullanıcı save → versiyon artar)
  // seçim cache'ini render-zamanı senkronla. React 19 setState-in-render
  // pattern: aynı render içinde state reset ediyoruz, useEffect değil.
  const [izlenenVersiyon, setIzlenenVersiyon] = useState(rol.izin_versiyonu);
  if (izlenenVersiyon !== rol.izin_versiyonu) {
    setIzlenenVersiyon(rol.izin_versiyonu);
    setSecili(new Set(rol.izinler));
  }

  // Meta form (ad, açıklama)
  const [ad, setAd] = useState(rol.ad);
  const [aciklama, setAciklama] = useState(rol.aciklama ?? "");

  const diff = izinDiffi(baseline, secili);
  const izinDegismedi = diffBosMu(diff);
  const metaDegismedi =
    ad === rol.ad && (aciklama || null) === rol.aciklama;
  const rolYonetUyari =
    aktifKullaniciId !== "" && rolYonetKaldiriliyorMu(baseline, secili);

  const izinleriKaydet = () => {
    if (izinDegismedi) return;
    guncelleIzinler.mutate({ id: rolId, izinler: Array.from(secili) });
  };
  const metaKaydet = () => {
    if (metaDegismedi) return;
    guncelleMeta.mutate({ id: rolId, ad, aciklama: aciklama || null });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 pb-24">
      <div className="flex flex-col gap-2">
        <Link
          href="/ayarlar/roller"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Tüm Roller
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{rol.ad}</h1>
          {rol.sistem_rolu && (
            <Badge variant="secondary" className="text-xs">
              Sistem rolü
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            v{rol.izin_versiyonu}
          </Badge>
        </div>
        <code className="text-muted-foreground text-xs">{rol.kod}</code>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">Yetkiler</h2>
            <p className="text-muted-foreground text-sm">
              Kategorilere göre gruplanmıştır. Aramada kod, ad, açıklama ve
              kategori başlığı taranır.
            </p>
          </div>
          <IzinMatrisi
            izinler={izinler}
            secili={secili}
            baseline={baseline}
            onChange={setSecili}
            disabled={guncelleIzinler.isPending}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <div className="bg-card flex flex-col gap-3 rounded-lg border p-4">
            <h2 className="text-base font-semibold">Rol Bilgileri</h2>
            <div className="grid gap-2">
              <Label htmlFor="rol-ad-edit">Rol Adı</Label>
              <Input
                id="rol-ad-edit"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rol-aciklama-edit">Açıklama</Label>
              <Textarea
                id="rol-aciklama-edit"
                rows={3}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={metaKaydet}
              disabled={metaDegismedi || guncelleMeta.isPending}
              className="self-end"
            >
              {guncelleMeta.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>

          <div className="bg-card flex flex-col gap-2 rounded-lg border p-4">
            <h2 className="text-base font-semibold">Bu rolü taşıyanlar</h2>
            {rol.kullanicilar.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu role atanmış kullanıcı yok.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {rol.kullanicilar.map((k) => (
                  <li
                    key={k.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">
                      {k.ad} {k.soyad}
                    </span>
                    {!k.aktif && (
                      <Badge variant="outline" className="text-[10px]">
                        Pasif
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div
        className={cn(
          "bg-background fixed inset-x-0 bottom-0 z-40 border-t p-3 transition-transform",
          izinDegismedi
            ? "pointer-events-none translate-y-full"
            : "pointer-events-auto translate-y-0",
        )}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium">Kaydetmediğiniz değişiklikler</span>
            <span className="text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">
                +{diff.eklenen.length}
              </span>{" "}
              /{" "}
              <span className="text-rose-600 dark:text-rose-400">
                −{diff.kaldirilan.length}
              </span>
            </span>
            {rolYonetUyari && (
              <span className="text-amber-600 dark:text-amber-400">
                Uyarı: rol-yönetimi yetkileri kaldırılıyor.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSecili(new Set(rol.izinler))}
              disabled={guncelleIzinler.isPending}
            >
              <Undo2 className="mr-1 h-4 w-4" />
              Vazgeç
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={izinleriKaydet}
              disabled={guncelleIzinler.isPending}
            >
              <Save className="mr-1 h-4 w-4" />
              {guncelleIzinler.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
