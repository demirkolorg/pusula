import * as React from "react";

import { cn } from "@/lib/utils";
import { PusulaSpinner } from "./pusula-spinner";

export type PusulaYukleniyorProps = {
  mesaj?: string;
  altMesaj?: string;
  /** "tam-ekran" overlay olarak ekrani kaplar; "alan" sadece kapsayicisini doldurur. */
  kapsam?: "tam-ekran" | "alan";
  className?: string;
};

export function PusulaYukleniyor({
  mesaj = "Yükleniyor",
  altMesaj,
  kapsam = "tam-ekran",
  className,
}: PusulaYukleniyorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={mesaj}
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm",
        kapsam === "tam-ekran"
          ? "fixed inset-0 z-50"
          : "min-h-[200px] w-full",
        className,
      )}
    >
      <PusulaSpinner boyut="xl" dekoratif />
      <div className="grid place-items-center gap-1 text-center">
        <span className="text-sm font-medium text-foreground">{mesaj}</span>
        {altMesaj ? (
          <span className="text-xs text-muted-foreground">{altMesaj}</span>
        ) : null}
      </div>
    </div>
  );
}
