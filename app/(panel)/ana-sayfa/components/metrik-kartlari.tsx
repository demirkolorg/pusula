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
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {baslik}
          </span>
          <span className={cn("size-4", VURGU_SINIFLARI[vurgu])}>{ikon}</span>
        </div>
        <div className="mt-2">
          <div
            className={cn(
              "font-heading text-3xl font-semibold tabular-nums",
              VURGU_SINIFLARI[vurgu],
            )}
          >
            {deger}
          </div>
          {altYazi ? (
            <div className="text-muted-foreground mt-1 text-xs">{altYazi}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function MetrikKartlari({ metrik }: { metrik: AnaSayfaMetrik }) {
  const buHaftaToplam =
    metrik.buHaftaBitenlerim +
    Math.max(0, metrik.buHaftaTamamladiklarim - metrik.buHaftaBitenlerim);

  const davetToplam = metrik.bekleyenDavetGelen + metrik.bekleyenDavetGiden;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetrikKart
        baslik="Açık Görevim"
        deger={metrik.acikGorev}
        altYazi="Bana atanan, tamamlanmamış"
        ikon={<CheckCircle2 className="size-4" />}
        vurgu="primary"
      />
      <MetrikKart
        baslik="Geciken"
        deger={metrik.geciken}
        altYazi={
          metrik.geciken > 0 ? "Bitiş tarihi geçti" : "Geciken görev yok"
        }
        ikon={<AlertTriangle className="size-4" />}
        vurgu={metrik.geciken > 0 ? "uyari" : "basari"}
      />
      <MetrikKart
        baslik="Bu Hafta"
        deger={buHaftaToplam}
        altYazi={`Takım: ${metrik.buHaftaTakim} · Sen: ${metrik.buHaftaTamamladiklarim}`}
        ikon={<CalendarCheck className="size-4" />}
        vurgu="basari"
      />
      <MetrikKart
        baslik="Bekleyen Davet"
        deger={davetToplam}
        altYazi={
          davetToplam > 0
            ? `Gelen: ${metrik.bekleyenDavetGelen} · Giden: ${metrik.bekleyenDavetGiden}`
            : "Bekleyen davet yok"
        }
        ikon={<Mail className="size-4" />}
        vurgu="bilgi"
      />
    </div>
  );
}
