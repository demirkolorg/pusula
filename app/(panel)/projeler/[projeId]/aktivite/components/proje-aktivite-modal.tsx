"use client";

import * as React from "react";
import { ActivityIcon, ArrowLeftIcon } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KisiMap } from "@/lib/mention";
import { useProjeYetkilileri } from "../../yetkili/hooks";
import { useProjeAktiviteleri } from "../hooks";
import type { AktiviteOzeti } from "../services";
import {
  AktiviteListesi,
  AktiviteDetayIcerik,
  KATEGORI_IKON,
  kategoriArkaplan,
} from "./aktivite-listesi";

// Proje header'ından açılan büyük aktivite modalı — proje altındaki TÜM
// kayıtların audit log'unu zaman çizelgesinde gösterir. Tasarım referansı:
// kart detay modalındaki aktivite sekmesi (AktiviteListesi).
//
// Mobile: bottom sheet (ResponsiveDialog → Sheet); desktop: center dialog.
//
// Master-detail tek-dialog pattern: liste ve detay aynı dialog içinde view
// switching ile gösterilir. Nested dialog (dialog-içinde-dialog) sorunu —
// portal'a iki ResponsiveDialog'un üst üste yığılmasından doğan z-index/
// scroll-lock/escape sıra çakışması — bu yaklaşımla ortadan kalkar.
// Detay açıkken Esc tuşu önce listeye döner, sonraki Esc dialog'u kapatır.
export function ProjeAktiviteModal({
  projeId,
  acik,
  onAcikDegisti,
}: {
  projeId: string;
  acik: boolean;
  onAcikDegisti: (a: boolean) => void;
}) {
  // `etkin` flag — modal kapalıyken sorgu durdurulur (network tasarrufu).
  // İlk açılışta tetiklenir, sonra TanStack Query cache'inden gelir.
  const sorgu = useProjeAktiviteleri(projeId, acik);
  const yetkililerQ = useProjeYetkilileri(acik ? projeId : "");

  const kisiMap: KisiMap = React.useMemo(() => {
    const m: KisiMap = new Map();
    for (const u of yetkililerQ.data ?? []) {
      m.set(u.kullanici_id, { ad: u.ad, soyad: u.soyad });
    }
    return m;
  }, [yetkililerQ.data]);

  const [secilenAktivite, setSecilenAktivite] =
    React.useState<AktiviteOzeti | null>(null);

  // Liste scroll konumu — detaya gidip dönerken kullanıcı 50. satırdaysa
  // baştan başlamasın (U.13 snapshot + replay pattern).
  const listeKapsayiciRef = React.useRef<HTMLDivElement>(null);
  const scrollSnapshotRef = React.useRef(0);

  const detayAc = React.useCallback((aktivite: AktiviteOzeti) => {
    if (listeKapsayiciRef.current) {
      scrollSnapshotRef.current = listeKapsayiciRef.current.scrollTop;
    }
    setSecilenAktivite(aktivite);
  }, []);

  const detayKapat = React.useCallback(() => {
    setSecilenAktivite(null);
    // Listeye dönüş sonrası DOM yeniden render olunca scroll restore.
    queueMicrotask(() => {
      if (listeKapsayiciRef.current) {
        listeKapsayiciRef.current.scrollTop = scrollSnapshotRef.current;
      }
    });
  }, []);

  // Modal kapanışında detay state'i temizlensin — yeniden açılınca liste
  // görünür, eski detay görünümünde takılı kalmaz.
  const acilmaDegisti = React.useCallback(
    (a: boolean) => {
      if (!a) setSecilenAktivite(null);
      onAcikDegisti(a);
    },
    [onAcikDegisti],
  );

  // Esc tuşunu detay modunda intercept et: önce listeye dön, dialog kapanmasın.
  // capture phase'de yakalıyoruz çünkü Radix Dialog kendi keydown listener'ı
  // bubble'da çalışır; buradan döndüğünde stopPropagation Radix'e ulaşmaz.
  React.useEffect(() => {
    if (!acik || !secilenAktivite) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        detayKapat();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [acik, secilenAktivite, detayKapat]);

  return (
    <ResponsiveDialog open={acik} onOpenChange={acilmaDegisti}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        {secilenAktivite ? (
          <DetayGorunumu
            aktivite={secilenAktivite}
            kisiMap={kisiMap}
            onGeri={detayKapat}
          />
        ) : (
          <ListeGorunumu
            sorgu={sorgu}
            kisiMap={kisiMap}
            kapsayiciRef={listeKapsayiciRef}
            onDetayAc={detayAc}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function ListeGorunumu({
  sorgu,
  kisiMap,
  kapsayiciRef,
  onDetayAc,
}: {
  sorgu: ReturnType<typeof useProjeAktiviteleri>;
  kisiMap: KisiMap;
  kapsayiciRef: React.RefObject<HTMLDivElement | null>;
  onDetayAc: (aktivite: AktiviteOzeti) => void;
}) {
  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle className="flex items-center gap-2 text-base">
          <span
            className="bg-muted text-muted-foreground inline-flex size-7 items-center justify-center rounded-full"
            aria-hidden
          >
            <ActivityIcon className="size-3.5" />
          </span>
          Proje aktivitesi
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="text-muted-foreground text-[12px]">
          Bu projede yapılan her değişiklik — listeler, kartlar, yorumlar,
          eklentiler, kontrol maddeleri, etiketler, yetkililer — zaman
          çizelgesinde görünür.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div
        ref={kapsayiciRef}
        className="-mr-2 max-h-[70vh] overflow-y-auto pr-2"
      >
        <AktiviteListesi
          data={sorgu.data}
          yukleniyor={sorgu.isLoading}
          kisiMap={kisiMap}
          bosBaslik="Bu projede henüz aktivite yok."
          bosAciklama="Projede yapılan her hareket — kart oluşturma, taşıma, yorum, etiket, yetkili, kontrol maddesi — burada timeline olarak görünür."
          baglamGoster
          onDetayAc={onDetayAc}
        />
      </div>
    </>
  );
}

function DetayGorunumu({
  aktivite,
  kisiMap,
  onGeri,
}: {
  aktivite: AktiviteOzeti;
  kisiMap: KisiMap;
  onGeri: () => void;
}) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle className="flex items-center gap-2 text-base">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onGeri}
            aria-label="Aktivite listesine dön"
            title="Geri"
            className="text-muted-foreground hover:text-foreground -ml-1 size-8 shrink-0 rounded-full"
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full",
              kategoriArkaplan(aktivite.kategori),
            )}
            aria-hidden
          >
            <Ikon className="size-3.5" />
          </span>
          Aktivite detayı
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="text-muted-foreground text-[12px]">
          Bu kayıt audit logundan alınmış ham olay verisinin tamamını içerir.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="-mr-2 max-h-[70vh] overflow-y-auto pr-2">
        <AktiviteDetayIcerik aktivite={aktivite} kisiMap={kisiMap} />
      </div>
    </>
  );
}
