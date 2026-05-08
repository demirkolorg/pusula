import * as React from "react";
import { ArrowUpRight, CheckCircle2, Compass } from "lucide-react";

import { cn } from "@/lib/utils";

export type AuthMarkaPanelProps = {
  className?: string;
};

/**
 * Auth ekranlarının (giriş/kayıt) sağ kolonunda gösterilen marka panosu.
 * Sadece `lg:` ve üzeri ekranlarda görünür — mobil tarafta tamamen gizlenir.
 *
 * Tasarım dili: lacivert (primary) gradient + serif başlık + dekoratif
 * "proje özet" mock kartı. İçerikler kaymakamlık görev yönetimi temasına
 * göre yazılmıştır.
 */
export function AuthMarkaPanel({ className }: AuthMarkaPanelProps) {
  return (
    <aside
      aria-hidden="true"
      className={cn(
        "relative isolate hidden overflow-hidden lg:flex",
        "bg-primary text-primary-foreground",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(at 20% 10%, color-mix(in oklch, var(--primary) 65%, white) 0%, transparent 55%), radial-gradient(at 80% 90%, color-mix(in oklch, var(--primary) 80%, black) 0%, transparent 60%), linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 70%, black) 100%)",
      }}
    >
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
        <header className="flex items-center gap-2 text-sm/none font-medium opacity-80">
          <Compass className="size-5" aria-hidden="true" />
          <span>Pusula · Kaymakamlık Görev Yönetimi</span>
        </header>

        <div className="flex flex-col gap-6">
          <h2 className="font-serif text-4xl/[1.05] font-semibold tracking-tight xl:text-5xl/[1.05]">
            Kamu hizmetinde
            <br />
            <span className="italic opacity-90">yönünüzü</span> hiç kaybetmeyin.
          </h2>
          <p className="max-w-md text-sm/relaxed opacity-80 xl:text-base/relaxed">
            Birim, makam ve görev karmaşasını tek bir panelde toplayın.
            Yetki, takip ve denetim — her aşamada şeffaf, her ekranda Türkçe.
          </p>
          <ul className="flex flex-col gap-2 text-sm opacity-90">
            {AVANTAJLAR.map((avantaj) => (
              <li key={avantaj} className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 opacity-80"
                  aria-hidden="true"
                />
                <span>{avantaj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <OzetKart />
          <p className="text-xs opacity-60">
            Tüm veriler T.C. Cumhurbaşkanlığı Dijital Dönüşüm rehberine uygun
            saklanır.
          </p>
        </div>
      </div>
    </aside>
  );
}

const AVANTAJLAR = [
  "Birim bazlı yetki ve görev dağılımı",
  "Mobil-uyumlu kanban panosu",
  "Audit log ile geri alınabilir işlemler",
] as const;

function OzetKart() {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md",
        "shadow-[0_20px_40px_-20px_rgb(0_0_0_/_0.5)]",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider opacity-60">
            Aktif Proje
          </p>
          <p className="mt-0.5 text-base font-medium">
            2026 Yatırım Programı
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] opacity-90">
          <ArrowUpRight className="size-3" aria-hidden="true" />
          Devam ediyor
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Metrik baslik="Açık görev" deger="24" />
        <Metrik baslik="Bu hafta" deger="7" />
        <Metrik baslik="Birim" deger="12" />
      </dl>
    </div>
  );
}

function Metrik({ baslik, deger }: { baslik: string; deger: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-2.5">
      <dt className="text-[11px] opacity-60">{baslik}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{deger}</dd>
    </div>
  );
}
