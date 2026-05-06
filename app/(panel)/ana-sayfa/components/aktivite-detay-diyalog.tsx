"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  AktiviteDetayIcerik,
  KATEGORI_IKON,
  kategoriArkaplan,
} from "@/app/(panel)/projeler/[projeId]/aktivite/components/aktivite-listesi";
import { cn } from "@/lib/utils";
import type { SonAktiviteSatiri } from "../schemas";

// Yorum aktiviteleri için server tarafında mention'lar zaten görünen metne
// çevriliyor (`mentionliMetniGorunurYap`); ana sayfa istemcide ek bir mention
// haritasına ihtiyaç duymaz. Boş Map sabit referansı tutmak için modül
// seviyesinde tanımlı (Kural 134).
const BOS_KISI_MAP = new Map<string, { ad: string; soyad: string }>();

export function AktiviteDetayDiyalog({
  kayit,
  kapat,
}: {
  kayit: SonAktiviteSatiri | null;
  kapat: () => void;
}) {
  if (!kayit) return null;
  const Ikon = KATEGORI_IKON[kayit.kategori];

  return (
    <ResponsiveDialog open onOpenChange={(o) => (o ? null : kapat())}>
      <ResponsiveDialogContent
        className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:w-full"
        mobilTaraf="bottom"
      >
        <ResponsiveDialogHeader className="flex-shrink-0 space-y-1 border-b px-6 py-4">
          <ResponsiveDialogTitle className="flex items-center gap-2 text-base">
            <span
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full",
                kategoriArkaplan(kayit.kategori),
              )}
              aria-hidden
            >
              <Ikon className="size-3.5" />
            </span>
            Aktivite detayı
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-muted-foreground text-[12px]">
            Olayın tam dökümü — kim, ne, ne zaman ve hangi alanlar değişti.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AktiviteDetayIcerik aktivite={kayit} kisiMap={BOS_KISI_MAP} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
