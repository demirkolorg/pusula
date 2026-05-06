"use client";

import * as React from "react";
import {
  DownloadIcon,
  Trash2Icon,
  RotateCcwIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { DOSYA_KATEGORI_ETIKETI } from "@/lib/dosya-kategori";
import type { DosyaKategori } from "@prisma/client";
import { useDosyaDetay } from "../hooks/kullan-dosya-detay";
import {
  useDosyaAciklamaGuncelle,
  useDosyaAdGuncelle,
  useDosyaGeriYukle,
  useDosyaKaliciSil,
  useDosyaSil,
} from "../hooks/kullan-dosya-mutasyonlari";
import { dosyaIndirEylem } from "../actions";
import { boyutBicim } from "../helpers/dosya-filtre";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

type Props = {
  dosyaId: string | null;
  acik: boolean;
  onKapat: () => void;
};

export function DosyaDetayCekmecesi({ dosyaId, acik, onKapat }: Props) {
  const sorgu = useDosyaDetay(acik ? dosyaId : null);

  return (
    <ResponsiveDialog open={acik} onOpenChange={(o) => !o && onKapat()}>
      <ResponsiveDialogContent className="max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Dosya Detayı</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Metadata, bağlantılar ve hızlı işlemler.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {sorgu.isLoading ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Yükleniyor…
          </p>
        ) : sorgu.error ? (
          <p className="text-destructive p-6 text-center text-sm">
            {sorgu.error.message}
          </p>
        ) : sorgu.data && dosyaId ? (
          <DetayIcerigi detay={sorgu.data} dosyaId={dosyaId} onSilindi={onKapat} />
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

type Detay = NonNullable<ReturnType<typeof useDosyaDetay>["data"]>;

function DetayIcerigi({
  detay,
  dosyaId,
  onSilindi,
}: {
  detay: Detay;
  dosyaId: string;
  onSilindi: () => void;
}) {
  const [duzenleAd, setDuzenleAd] = React.useState(false);
  const [adInput, setAdInput] = React.useState(detay.ad);
  const [duzenleAciklama, setDuzenleAciklama] = React.useState(false);
  const [aciklamaInput, setAciklamaInput] = React.useState(
    detay.aciklama ?? "",
  );

  const adMut = useDosyaAdGuncelle(dosyaId);
  const aciklamaMut = useDosyaAciklamaGuncelle(dosyaId);
  const sil = useDosyaSil();
  const geriYukle = useDosyaGeriYukle();
  const kaliciSil = useDosyaKaliciSil();

  React.useEffect(() => {
    setAdInput(detay.ad);
    setAciklamaInput(detay.aciklama ?? "");
  }, [detay.id, detay.ad, detay.aciklama]);

  const indir = async () => {
    const r = await dosyaIndirEylem({ id: dosyaId });
    if (!r.basarili) {
      toast.hata(r.hata);
      return;
    }
    window.open(r.veri.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Ad — düzenlenebilir */}
      <div>
        <label className="text-muted-foreground text-xs">Ad</label>
        {duzenleAd ? (
          <div className="mt-1 flex items-center gap-2">
            <Input
              value={adInput}
              onChange={(e) => setAdInput(e.target.value)}
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                if (adInput.trim() && adInput !== detay.ad) {
                  adMut.mutate({ id: dosyaId, ad: adInput.trim() });
                }
                setDuzenleAd(false);
              }}
            >
              Kaydet
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdInput(detay.ad);
                setDuzenleAd(false);
              }}
            >
              İptal
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDuzenleAd(true)}
            className="mt-1 w-full rounded-md border border-transparent px-2 py-1.5 text-left text-sm font-medium hover:border-input hover:bg-muted/40"
          >
            {detay.ad}
          </button>
        )}
      </div>

      {/* Açıklama — düzenlenebilir */}
      <div>
        <label className="text-muted-foreground text-xs">Açıklama</label>
        {duzenleAciklama ? (
          <div className="mt-1 flex flex-col gap-2">
            <Textarea
              value={aciklamaInput}
              onChange={(e) => setAciklamaInput(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const yeni = aciklamaInput.trim();
                  aciklamaMut.mutate({
                    id: dosyaId,
                    aciklama: yeni.length > 0 ? yeni : null,
                  });
                  setDuzenleAciklama(false);
                }}
              >
                Kaydet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAciklamaInput(detay.aciklama ?? "");
                  setDuzenleAciklama(false);
                }}
              >
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDuzenleAciklama(true)}
            className="mt-1 w-full rounded-md border border-transparent px-2 py-1.5 text-left text-sm hover:border-input hover:bg-muted/40 min-h-[44px]"
          >
            {detay.aciklama || (
              <span className="text-muted-foreground">Açıklama eklemek için tıkla</span>
            )}
          </button>
        )}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Meta etiket="Tür">
          <Badge variant="outline" className="font-normal">
            {DOSYA_KATEGORI_ETIKETI[detay.kategori as DosyaKategori]}
          </Badge>
        </Meta>
        <Meta etiket="Boyut">{boyutBicim(detay.boyut)}</Meta>
        <Meta etiket="MIME">
          <code className="text-xs">{detay.mime}</code>
        </Meta>
        <Meta etiket="Durum">
          <DurumRozeti durum={detay.durum} />
        </Meta>
        <Meta etiket="Yükleyen">
          {detay.yukleyen.ad} {detay.yukleyen.soyad}
        </Meta>
        <Meta etiket="Yüklenme">
          {TARIH_BICIM.format(detay.olusturma_zamani)}
        </Meta>
        {detay.indirme_sayisi > 0 && (
          <Meta etiket="İndirme">{detay.indirme_sayisi}</Meta>
        )}
        {detay.hash_sha256 && (
          <Meta etiket="SHA-256">
            <code className="text-xs break-all">
              {detay.hash_sha256.slice(0, 12)}…
            </code>
          </Meta>
        )}
      </div>

      {/* Bağlantılar */}
      {detay.baglantilar.length > 0 && (
        <div>
          <label className="text-muted-foreground text-xs">
            Bağlı kaynaklar ({detay.baglantilar.length})
          </label>
          <ul className="mt-1.5 flex flex-col gap-1">
            {detay.baglantilar.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs"
              >
                <Badge variant="secondary" className="font-normal">
                  {b.kaynak_tip}
                </Badge>
                <code className="text-muted-foreground truncate">
                  {b.kaynak_id}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sürümler — basit liste, F7'de zenginleşir */}
      {detay.surumler.length > 1 && (
        <div>
          <label className="text-muted-foreground text-xs">
            Sürümler ({detay.surumler.length})
          </label>
          <ul className="mt-1.5 flex flex-col gap-1">
            {detay.surumler.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{s.surum_no}</Badge>
                  <span className="truncate">{s.ad}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  {boyutBicim(s.boyut)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="border-t pt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={indir}
          className="gap-1.5"
        >
          <DownloadIcon className="size-4" />
          İndir
        </Button>

        {!detay.silindi_mi ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => {
              sil.mutate({ id: dosyaId });
              toast.basari("Dosya çöp kutusuna gönderildi.");
              onSilindi();
            }}
          >
            <Trash2Icon className="size-4" />
            Sil
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                geriYukle.mutate({ id: dosyaId });
                toast.basari("Dosya geri yüklendi.");
                onSilindi();
              }}
            >
              <RotateCcwIcon className="size-4" />
              Geri Yükle
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (
                  confirm(
                    "Bu dosya kalıcı olarak silinecek. Geri alınamaz. Emin misiniz?",
                  )
                ) {
                  kaliciSil.mutate({ id: dosyaId });
                  toast.basari("Dosya kalıcı olarak silindi.");
                  onSilindi();
                }
              }}
            >
              <AlertTriangleIcon className="size-4" />
              Kalıcı Sil
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Meta({
  etiket,
  children,
}: {
  etiket: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
        {etiket}
      </p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function DurumRozeti({ durum }: { durum: string }) {
  const map: Record<string, { etiket: string; cls: string }> = {
    HAZIR: {
      etiket: "Hazır",
      cls: "bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-200",
    },
    YUKLENIYOR: {
      etiket: "Yükleniyor",
      cls: "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
    },
    KARANTINA: {
      etiket: "Karantina",
      cls: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    },
    HATALI: {
      etiket: "Hatalı",
      cls: "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200",
    },
  };
  const k = map[durum] ?? { etiket: durum, cls: "bg-muted" };
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${k.cls}`}>
      {k.etiket}
    </span>
  );
}
