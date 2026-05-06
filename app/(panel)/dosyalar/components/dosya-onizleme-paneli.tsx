"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { ONIZLEME_STRATEJI, type OnizlemeStrateji } from "@/lib/dosya-onizleme";
import {
  dosyaIndirEylem,
  dosyaMetinIcerikEylem,
  dosyaOnizlemeEylem,
} from "../actions";

type Props = {
  dosyaId: string;
  ad: string;
  mime: string;
  strateji: OnizlemeStrateji;
};

/**
 * Tür bazlı önizleme paneli. lib/dosya-onizleme.ts'in stratejisine göre
 * görsel/PDF/text/markdown render eder veya indir-fallback gösterir.
 */
export function DosyaOnizlemePaneli({
  dosyaId,
  ad,
  mime,
  strateji,
}: Props) {
  switch (strateji) {
    case ONIZLEME_STRATEJI.GORSEL_VIEWER:
      return <GorselOnizleme dosyaId={dosyaId} ad={ad} />;
    case ONIZLEME_STRATEJI.PDF_IFRAME:
      return <PdfOnizleme dosyaId={dosyaId} ad={ad} />;
    case ONIZLEME_STRATEJI.METIN_PLAIN:
    case ONIZLEME_STRATEJI.MARKDOWN_SANITIZE:
      // Markdown F7'de plain text — DOMPurify F8'de eklenecek.
      return <MetinOnizleme dosyaId={dosyaId} />;
    case ONIZLEME_STRATEJI.OFIS_INDIR:
      return (
        <IndirFallback
          dosyaId={dosyaId}
          ad={ad}
          ikon={FileTextIcon}
          mesaj="Office dosyası tarayıcıda gösterilmez."
          aciklama={`${mime} — indirip yerel uygulamada açın.`}
        />
      );
    case ONIZLEME_STRATEJI.ARSIV_INDIR:
      return (
        <IndirFallback
          dosyaId={dosyaId}
          ad={ad}
          ikon={FileIcon}
          mesaj="Arşiv içeriği listelenmez."
          aciklama="İndirip arşivi açın."
        />
      );
    case ONIZLEME_STRATEJI.INDIR_FALLBACK:
      return (
        <IndirFallback
          dosyaId={dosyaId}
          ad={ad}
          ikon={AlertTriangleIcon}
          mesaj="Bu dosya tarayıcıda önizlenemiyor."
          aciklama="Güvenlik veya işleme durumu nedeniyle yalnız indirme açık."
        />
      );
  }
}

function GorselOnizleme({ dosyaId, ad }: { dosyaId: string; ad: string }) {
  const sorgu = useQuery({
    queryKey: ["dosya-onizleme-url", dosyaId],
    queryFn: async () => {
      const r = await dosyaOnizlemeEylem({ id: dosyaId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 8 * 60_000, // URL 10dk geçerli, 8dk cache
  });

  if (sorgu.isLoading) return <YukleniyorKutu />;
  if (sorgu.error || !sorgu.data) return <HataKutu mesaj={sorgu.error?.message} />;

  return (
    <div className="bg-muted/30 flex max-h-[60vh] items-center justify-center overflow-auto rounded-md border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sorgu.data.url}
        alt={ad}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

function PdfOnizleme({ dosyaId, ad }: { dosyaId: string; ad: string }) {
  const sorgu = useQuery({
    queryKey: ["dosya-onizleme-url", dosyaId],
    queryFn: async () => {
      const r = await dosyaOnizlemeEylem({ id: dosyaId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 8 * 60_000,
  });

  if (sorgu.isLoading) return <YukleniyorKutu />;
  if (sorgu.error || !sorgu.data) return <HataKutu mesaj={sorgu.error?.message} />;

  return (
    <iframe
      src={sorgu.data.url}
      title={ad}
      className="h-[60vh] w-full rounded-md border"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

function MetinOnizleme({ dosyaId }: { dosyaId: string }) {
  const sorgu = useQuery({
    queryKey: ["dosya-metin-icerik", dosyaId],
    queryFn: async () => {
      const r = await dosyaMetinIcerikEylem({ id: dosyaId });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    staleTime: 30_000,
  });

  if (sorgu.isLoading) return <YukleniyorKutu />;
  if (sorgu.error || !sorgu.data) return <HataKutu mesaj={sorgu.error?.message} />;

  return (
    <div className="rounded-md border">
      {sorgu.data.kesildi && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-b px-3 py-2 text-xs">
          Önizleme 1MB ile sınırlı — tam içerik için dosyayı indirin.
        </div>
      )}
      <pre className="max-h-[60vh] overflow-auto bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap break-words">
        {sorgu.data.icerik}
      </pre>
    </div>
  );
}

function IndirFallback({
  dosyaId,
  ad,
  ikon: Ikon,
  mesaj,
  aciklama,
}: {
  dosyaId: string;
  ad: string;
  ikon: React.ComponentType<{ className?: string }>;
  mesaj: string;
  aciklama: string;
}) {
  const indir = async () => {
    const r = await dosyaIndirEylem({ id: dosyaId });
    if (!r.basarili) {
      toast.hata(r.hata);
      return;
    }
    window.open(r.veri.url, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border bg-muted/20 p-8 text-center">
      <Ikon className="text-muted-foreground size-10" />
      <div>
        <p className="text-sm font-medium">{mesaj}</p>
        <p className="text-muted-foreground mt-1 text-xs">{aciklama}</p>
      </div>
      <Button size="sm" onClick={indir} className="gap-1.5 min-h-[44px]">
        <DownloadIcon className="size-4" />
        {ad}'ı indir
      </Button>
    </div>
  );
}

function YukleniyorKutu() {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 rounded-md border bg-muted/20 p-12 text-sm">
      <Loader2Icon className="size-4 animate-spin" />
      Önizleme hazırlanıyor…
    </div>
  );
}

function HataKutu({ mesaj }: { mesaj?: string }) {
  return (
    <div className="text-destructive rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-sm">
      <AlertTriangleIcon className="mx-auto mb-2 size-6" />
      {mesaj ?? "Önizleme alınamadı."}
    </div>
  );
}

