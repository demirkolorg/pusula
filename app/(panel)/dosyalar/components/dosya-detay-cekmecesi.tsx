"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  FolderKanbanIcon,
  HistoryIcon,
  InfoIcon,
  KanbanSquareIcon,
  LinkIcon,
  ListIcon,
  RotateCcwIcon,
  Trash2Icon,
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
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { DOSYA_KATEGORI_ETIKETI } from "@/lib/dosya-kategori";
import { onizlemeStratejisi } from "@/lib/dosya-onizleme";
import type { DosyaKategori, DosyaDurumu } from "@prisma/client";
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
import { DosyaOnizlemePaneli } from "./dosya-onizleme-paneli";
import { DosyaSurumListesi } from "./dosya-surum-listesi";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

type Sekme = "onizleme" | "baglantilar" | "surumler" | "bilgiler";

type Props = {
  dosyaId: string | null;
  acik: boolean;
  onKapat: () => void;
};

export function DosyaDetayCekmecesi({ dosyaId, acik, onKapat }: Props) {
  const sorgu = useDosyaDetay(acik ? dosyaId : null);

  return (
    <ResponsiveDialog open={acik} onOpenChange={(o) => !o && onKapat()}>
      <ResponsiveDialogContent className="sm:max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Dosya Detayı</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Önizleme, bağlantılar, sürümler ve hızlı işlemler.
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
          <DetayIcerigi
            detay={sorgu.data}
            dosyaId={dosyaId}
            onSilindi={onKapat}
          />
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
  const [aktifSekme, setAktifSekme] = React.useState<Sekme>("onizleme");

  // Dosya değiştiğinde sekmeyi default'a sıfırla
  React.useEffect(() => {
    setAktifSekme("onizleme");
  }, [detay.id]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <DosyaBaslik detay={detay} dosyaId={dosyaId} />
      <SekmeCubugu
        aktif={aktifSekme}
        baglantiSayi={detay.baglantilar.length}
        surumSayi={detay.surumler.length}
        onDegis={setAktifSekme}
      />
      <div>
        {aktifSekme === "onizleme" && (
          <DosyaOnizlemePaneli
            dosyaId={dosyaId}
            ad={detay.ad}
            mime={detay.mime}
            strateji={onizlemeStratejisi(
              detay.kategori as DosyaKategori,
              detay.mime,
              detay.durum as DosyaDurumu,
            )}
          />
        )}
        {aktifSekme === "baglantilar" && (
          <BaglantiListesi baglantilar={detay.baglantilar} />
        )}
        {aktifSekme === "surumler" && (
          <DosyaSurumListesi dosyaId={dosyaId} surumler={detay.surumler} />
        )}
        {aktifSekme === "bilgiler" && <BilgiPaneli detay={detay} />}
      </div>
      <AksiyonCubugu
        dosyaId={dosyaId}
        silindi={detay.silindi_mi}
        onSilindi={onSilindi}
      />
    </div>
  );
}

function DosyaBaslik({
  detay,
  dosyaId,
}: {
  detay: Detay;
  dosyaId: string;
}) {
  const [duzenleAd, setDuzenleAd] = React.useState(false);
  const [adInput, setAdInput] = React.useState(detay.ad);
  const [duzenleAciklama, setDuzenleAciklama] = React.useState(false);
  const [aciklamaInput, setAciklamaInput] = React.useState(
    detay.aciklama ?? "",
  );

  const adMut = useDosyaAdGuncelle(dosyaId);
  const aciklamaMut = useDosyaAciklamaGuncelle(dosyaId);

  React.useEffect(() => {
    setAdInput(detay.ad);
    setAciklamaInput(detay.aciklama ?? "");
  }, [detay.id, detay.ad, detay.aciklama]);

  return (
    <div className="flex flex-col gap-2">
      {duzenleAd ? (
        <div className="flex items-center gap-2">
          <Input
            value={adInput}
            onChange={(e) => setAdInput(e.target.value)}
            autoFocus
            className="text-base font-medium"
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
          className="hover:bg-muted/40 -ml-1 rounded-md px-1 py-1 text-left text-base font-semibold"
          aria-label="Adı düzenle"
        >
          {detay.ad}
        </button>
      )}

      {duzenleAciklama ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={aciklamaInput}
            onChange={(e) => setAciklamaInput(e.target.value)}
            rows={2}
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
          className="hover:bg-muted/40 -ml-1 min-h-[24px] rounded-md px-1 py-1 text-left text-sm"
        >
          {detay.aciklama || (
            <span className="text-muted-foreground">
              Açıklama eklemek için tıkla
            </span>
          )}
        </button>
      )}

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className="font-normal">
          {DOSYA_KATEGORI_ETIKETI[detay.kategori as DosyaKategori]}
        </Badge>
        <span className="tabular-nums">{boyutBicim(detay.boyut)}</span>
        <span>·</span>
        <span>
          {detay.yukleyen.ad} {detay.yukleyen.soyad}
        </span>
        <span>·</span>
        <span className="tabular-nums">
          {TARIH_BICIM.format(detay.olusturma_zamani)}
        </span>
      </div>
    </div>
  );
}

function SekmeCubugu({
  aktif,
  baglantiSayi,
  surumSayi,
  onDegis,
}: {
  aktif: Sekme;
  baglantiSayi: number;
  surumSayi: number;
  onDegis: (s: Sekme) => void;
}) {
  const sekmeler: Array<{
    deger: Sekme;
    etiket: string;
    icon: React.ComponentType<{ className?: string }>;
    sayi?: number;
  }> = [
    { deger: "onizleme", etiket: "Önizleme", icon: EyeIcon },
    {
      deger: "baglantilar",
      etiket: "Bağlantılar",
      icon: LinkIcon,
      sayi: baglantiSayi,
    },
    {
      deger: "surumler",
      etiket: "Sürümler",
      icon: HistoryIcon,
      sayi: surumSayi,
    },
    { deger: "bilgiler", etiket: "Bilgiler", icon: InfoIcon },
  ];
  return (
    <div
      role="tablist"
      className="border-b flex items-center gap-1 overflow-x-auto"
    >
      {sekmeler.map((s) => {
        const Icon = s.icon;
        const aktifMi = aktif === s.deger;
        return (
          <button
            key={s.deger}
            type="button"
            role="tab"
            aria-selected={aktifMi}
            onClick={() => onDegis(s.deger)}
            className={cn(
              "relative flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm transition-colors",
              aktifMi
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span>{s.etiket}</span>
            {s.sayi !== undefined && s.sayi > 0 && (
              <span className="text-muted-foreground/80 ml-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                {s.sayi}
              </span>
            )}
            {aktifMi && (
              <span className="bg-primary absolute bottom-[-1px] left-0 right-0 h-[2px]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

const KAYNAK_TIP_BICIM: Record<
  string,
  {
    etiket: string;
    Icon: React.ComponentType<{ className?: string }>;
    renk: string;
  }
> = {
  KART: {
    etiket: "Kart",
    Icon: KanbanSquareIcon,
    renk:
      "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  },
  LISTE: {
    etiket: "Liste",
    Icon: ListIcon,
    renk:
      "bg-purple-100 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200",
  },
  PROJE: {
    etiket: "Proje",
    Icon: FolderKanbanIcon,
    renk:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
};

function baglantiRotasi(b: Detay["baglantilar"][number]): string | null {
  const projeId = b.rota_proje_id;
  if (!projeId) return null;
  if (b.kaynak_tip === "KART" && b.kart_id) {
    return `/projeler/${projeId}?kart=${b.kart_id}`;
  }
  if (b.kaynak_tip === "LISTE" || b.kaynak_tip === "PROJE") {
    return `/projeler/${projeId}`;
  }
  return null;
}

function BaglantiListesi({
  baglantilar,
}: {
  baglantilar: Detay["baglantilar"];
}) {
  if (baglantilar.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        Bu dosya hiçbir kaynağa bağlı değil.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {baglantilar.map((b) => {
        const bicim =
          KAYNAK_TIP_BICIM[b.kaynak_tip] ?? {
            etiket: b.kaynak_tip,
            Icon: LinkIcon,
            renk: "bg-muted text-foreground",
          };
        const Icon = bicim.Icon;
        const rota = baglantiRotasi(b);
        const ad = b.kaynak_ad ?? "—";

        const icerik = (
          <>
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md",
                bicim.renk,
              )}
              aria-hidden
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ad}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {bicim.etiket} ·{" "}
                <span className="tabular-nums">
                  {TARIH_BICIM.format(b.olusturma_zamani)}
                </span>
              </p>
            </div>
            {rota && (
              <ChevronRightIcon
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
              />
            )}
          </>
        );

        const ortakClass =
          "group flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 transition-colors";

        return (
          <li key={b.id}>
            {rota ? (
              <Link
                href={rota}
                className={cn(
                  ortakClass,
                  "hover:border-primary/50 hover:bg-muted/40",
                )}
                aria-label={`${bicim.etiket}: ${ad} sayfasına git`}
              >
                {icerik}
              </Link>
            ) : (
              <div
                className={cn(
                  ortakClass,
                  "text-muted-foreground italic",
                )}
                title="Bu kaynağa erişim yok veya kaynak silinmiş"
              >
                {icerik}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BilgiPaneli({ detay }: { detay: Detay }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <Bilgi etiket="Tür">
        <Badge variant="outline" className="font-normal">
          {DOSYA_KATEGORI_ETIKETI[detay.kategori as DosyaKategori]}
        </Badge>
      </Bilgi>
      <Bilgi etiket="MIME">
        <code className="text-xs">{detay.mime}</code>
      </Bilgi>
      <Bilgi etiket="Boyut">{boyutBicim(detay.boyut)}</Bilgi>
      <Bilgi etiket="Durum">
        <DurumRozeti durum={detay.durum} />
      </Bilgi>
      <Bilgi etiket="Gizlilik">
        <GizlilikRozeti gizlilik={detay.gizlilik} />
      </Bilgi>
      <Bilgi etiket="Yükleyen">
        {detay.yukleyen.ad} {detay.yukleyen.soyad}
      </Bilgi>
      <Bilgi etiket="Yüklenme">
        {TARIH_BICIM.format(detay.olusturma_zamani)}
      </Bilgi>
      {detay.son_indirme_zamani && (
        <Bilgi etiket="Son indirme">
          {TARIH_BICIM.format(detay.son_indirme_zamani)}
        </Bilgi>
      )}
      <Bilgi etiket="İndirme sayısı">{detay.indirme_sayisi}</Bilgi>
      {detay.hash_sha256 && (
        <Bilgi etiket="SHA-256">
          <code className="text-xs break-all">{detay.hash_sha256}</code>
        </Bilgi>
      )}
      {detay.silindi_mi && detay.silinme_zamani && (
        <Bilgi etiket="Silinme">
          <span className="text-destructive">
            {TARIH_BICIM.format(detay.silinme_zamani)}
          </span>
        </Bilgi>
      )}
    </dl>
  );
}

function Bilgi({
  etiket,
  children,
}: {
  etiket: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-[11px] uppercase tracking-wide">
        {etiket}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function AksiyonCubugu({
  dosyaId,
  silindi,
  onSilindi,
}: {
  dosyaId: string;
  silindi: boolean;
  onSilindi: () => void;
}) {
  const sil = useDosyaSil();
  const geriYukle = useDosyaGeriYukle();
  const kaliciSil = useDosyaKaliciSil();

  const indir = async () => {
    const r = await dosyaIndirEylem({ id: dosyaId });
    if (!r.basarili) {
      toast.hata(r.hata);
      return;
    }
    window.open(r.veri.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="border-t flex flex-wrap gap-2 pt-3">
      <Button type="button" variant="outline" size="sm" onClick={indir} className="gap-1.5">
        <DownloadIcon className="size-4" />
        İndir
      </Button>
      {!silindi ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive gap-1.5"
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
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${k.cls}`}
    >
      {k.etiket}
    </span>
  );
}

function GizlilikRozeti({ gizlilik }: { gizlilik: string }) {
  if (gizlilik === "GIZLI") {
    return (
      <Badge variant="destructive" className="font-normal">
        Gizli
      </Badge>
    );
  }
  if (gizlilik === "HASSAS") {
    return (
      <Badge className="font-normal bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200">
        Hassas
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      Normal
    </Badge>
  );
}
