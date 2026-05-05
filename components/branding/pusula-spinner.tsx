import * as React from "react";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";

export type PusulaSpinnerBoyut = "xs" | "sm" | "md" | "lg" | "xl";

const IKON_SINIFI: Record<PusulaSpinnerBoyut, string> = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-9",
};

export type PusulaSpinnerProps = {
  boyut?: PusulaSpinnerBoyut;
  className?: string;
  etiket?: string;
  /**
   * true iken role/aria/sr-only metni eklenmez. Erişilebilir bir kapsayıcı
   * (örn. PusulaYukleniyor) içinde kullanılırken çift status okumayı önler.
   */
  dekoratif?: boolean;
};

export function PusulaSpinner({
  boyut = "sm",
  className,
  etiket = "Yükleniyor",
  dekoratif = false,
}: PusulaSpinnerProps) {
  if (dekoratif) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-flex items-center text-primary", className)}
      >
        <Compass className={cn("animate-spin shrink-0", IKON_SINIFI[boyut])} />
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={etiket}
      className={cn("inline-flex items-center text-primary", className)}
    >
      <Compass
        aria-hidden="true"
        className={cn("animate-spin shrink-0", IKON_SINIFI[boyut])}
      />
      <span className="sr-only">{etiket}</span>
    </span>
  );
}
