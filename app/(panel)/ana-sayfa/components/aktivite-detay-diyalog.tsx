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
        className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-5xl xl:max-w-6xl"
        mobilTaraf="bottom"
      >
        <ResponsiveDialogHeader className="bg-muted/20 flex-shrink-0 space-y-2 border-b px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 pr-8">
            <span
              className={cn(
                "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                kategoriArkaplan(kayit.kategori),
              )}
              aria-hidden
            >
              <Ikon className="size-4" />
            </span>
            <div className="min-w-0">
              <ResponsiveDialogTitle className="text-base">
                Aktivite detayı
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="text-muted-foreground mt-1 text-[12px]">
                Olayın tam dökümü, bağlamı ve alan bazlı değişiklikleri.
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <AktiviteDetayIcerik aktivite={kayit} kisiMap={BOS_KISI_MAP} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
