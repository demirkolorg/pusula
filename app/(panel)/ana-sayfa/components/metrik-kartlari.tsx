import {
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnaSayfaMetrik } from "../schemas";

type Vurgu = "primary" | "uyari" | "basari" | "bilgi";

const VURGU_SINIFLARI: Record<Vurgu, string> = {
  primary: "text-primary",
  uyari: "text-palet-kirmizi",
  basari: "text-palet-yesil",
  bilgi: "text-palet-mavi",
};

function MetrikKart({
  baslik,
  deger,
  altYazi,
  ikon,
  vurgu = "primary",
}: {
  baslik: string;
  deger: number;
  altYazi?: string;
  ikon: React.ReactNode;
  vurgu?: Vurgu;
}) {
  return (
    <Card size="sm" className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {baslik}
          </span>
          <span className={cn("size-4", VURGU_SINIFLARI[vurgu])}>{ikon}</span>
        </div>
        <div>
          <div
            className={cn(
              "font-heading text-3xl font-semibold tabular-nums leading-none",
              VURGU_SINIFLARI[vurgu],
            )}
          >
            {deger}
          </div>
          {/* Alt yazı her zaman tek satır — tüm kartlar eşit yükseklik. */}
          <div className="text-muted-foreground mt-1.5 line-clamp-1 min-h-4 text-xs">
            {altYazi ?? ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetrikKartlari({ metrik }: { metrik: AnaSayfaMetrik }) {
  const sistem = metrik.kapsam === "sistem";

  // Kişisel: bana atalı + ekstra tamamladıklarım birleşik göstergesi.
  // Sistem: makam kart yetkilisi olmaz, "Takım" sayısı ana göstergedir.
  const buHaftaToplam = sistem
    ? metrik.buHaftaTakim
    : metrik.buHaftaBitenlerim +
      Math.max(0, metrik.buHaftaTamamladiklarim - metrik.buHaftaBitenlerim);

  const davetDeger = sistem
    ? metrik.bekleyenDavetTum
    : metrik.bekleyenDavetGelen + metrik.bekleyenDavetGiden;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetrikKart
        baslik={sistem ? "Sistemde Açık" : "Açık Görevim"}
        deger={metrik.acikGorev}
        altYazi={
          sistem
            ? "Tüm aktif kartlar"
            : metrik.acikGorev > 0
              ? "Bana atanan, tamamlanmamış"
              : "Açık görev yok"
        }
        ikon={<CheckCircle2 className="size-4" />}
        vurgu="primary"
      />
      <MetrikKart
        baslik="Geciken"
        deger={metrik.geciken}
        altYazi={
          metrik.geciken === 0
            ? "Geciken görev yok"
            : metrik.geciken === 1
              ? "1 görev gecikti"
              : `${metrik.geciken} görev gecikti`
        }
        ikon={<AlertTriangle className="size-4" />}
        vurgu={metrik.geciken > 0 ? "uyari" : "basari"}
      />
      <MetrikKart
        baslik="Bu Hafta"
        deger={buHaftaToplam}
        altYazi={
          sistem
            ? "Sistemde tamamlanan"
            : `Takım: ${metrik.buHaftaTakim} · Sen: ${metrik.buHaftaTamamladiklarim}`
        }
        ikon={<CalendarCheck className="size-4" />}
        vurgu="basari"
      />
      <MetrikKart
        baslik="Bekleyen Davet"
        deger={davetDeger}
        altYazi={
          davetDeger === 0
            ? "Bekleyen davet yok"
            : sistem
              ? "Sistemde aktif davet"
              : `Gelen: ${metrik.bekleyenDavetGelen} · Giden: ${metrik.bekleyenDavetGiden}`
        }
        ikon={<Mail className="size-4" />}
        vurgu="bilgi"
      />
    </div>
  );
}
