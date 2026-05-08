import Link from "next/link";
import { FolderKanban, Users, UserCheck, AlertOctagon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MakamKpi } from "../schemas";

// ADR-0026 — Makam KPI şeridi: SUPER_ADMIN/KAYMAKAM ana sayfasında üstte
// görünür. Mevcut metrik kartlarıyla aynı görsel dilde, ama "yönetim
// gözlemi" bağlamı için farklı veri (proje/kullanıcı/hata sayıları).

type Vurgu = "primary" | "uyari" | "basari" | "bilgi";

const VURGU_SINIFLARI: Record<Vurgu, string> = {
  primary: "text-primary",
  uyari: "text-palet-kirmizi",
  basari: "text-palet-yesil",
  bilgi: "text-palet-mavi",
};

function KpiKart({
  baslik,
  deger,
  altYazi,
  ikon,
  vurgu = "primary",
  href,
}: {
  baslik: string;
  deger: number;
  altYazi: string;
  ikon: React.ReactNode;
  vurgu?: Vurgu;
  href?: string;
}) {
  const icerik = (
    <Card
      size="sm"
      className={cn(
        "h-full",
        href &&
          "transition-colors hover:bg-accent/40 group-focus-visible/kart:ring-2 group-focus-visible/kart:ring-ring group-focus-visible/kart:ring-offset-2",
      )}
    >
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
          <div className="text-muted-foreground mt-1.5 line-clamp-1 min-h-4 text-xs">
            {altYazi}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return icerik;
  return (
    <Link
      href={href}
      aria-label={`${baslik}: ${deger}`}
      className="group/kart block h-full rounded-xl outline-none"
    >
      {icerik}
    </Link>
  );
}

export function MakamKpiSeridi({ kpi }: { kpi: MakamKpi }) {
  const onayAltYazi =
    kpi.onayBekleyenKullanici === 0
      ? "Bekleyen kayıt yok"
      : kpi.onayBekleyenKullanici === 1
        ? "1 kullanıcı onay bekliyor"
        : `${kpi.onayBekleyenKullanici} kullanıcı onay bekliyor`;

  const hataAltYazi =
    kpi.kritikHataSon24Sa === 0
      ? "Kritik hata yok"
      : kpi.kritikHataSon24Sa === 1
        ? "1 çözülmemiş hata"
        : `${kpi.kritikHataSon24Sa} çözülmemiş hata`;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiKart
        baslik="Aktif Proje"
        deger={kpi.aktifProje}
        altYazi="Silinmemiş proje sayısı"
        ikon={<FolderKanban className="size-4" />}
        vurgu="primary"
        href="/projeler"
      />
      <KpiKart
        baslik="Aktif Kullanıcı"
        deger={kpi.aktifKullaniciSon7Gun}
        altYazi="Son 7 günde giriş yapan"
        ikon={<Users className="size-4" />}
        vurgu="basari"
        href="/ayarlar/kullanicilar"
      />
      <KpiKart
        baslik="Onay Bekleyen"
        deger={kpi.onayBekleyenKullanici}
        altYazi={onayAltYazi}
        ikon={<UserCheck className="size-4" />}
        vurgu={kpi.onayBekleyenKullanici > 0 ? "bilgi" : "basari"}
        href="/ayarlar/kullanicilar?bekleyen=1"
      />
      <KpiKart
        baslik="Kritik Hata (24sa)"
        deger={kpi.kritikHataSon24Sa}
        altYazi={hataAltYazi}
        ikon={<AlertOctagon className="size-4" />}
        vurgu={kpi.kritikHataSon24Sa > 0 ? "uyari" : "basari"}
        href="/ayarlar/hata-loglari"
      />
    </div>
  );
}
