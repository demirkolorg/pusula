import * as React from "react";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";

export type PusulaLogoBoyut = "sm" | "md" | "lg" | "xl";
export type PusulaLogoTip = "ikon" | "tam";

const IKON_SINIFI: Record<PusulaLogoBoyut, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-9",
  xl: "size-16",
};

const BASLIK_SINIFI: Record<PusulaLogoBoyut, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
  xl: "text-lg",
};

const ALTBASLIK_SINIFI: Record<PusulaLogoBoyut, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-xs",
  xl: "text-sm",
};

export type PusulaLogoProps = {
  boyut?: PusulaLogoBoyut;
  tip?: PusulaLogoTip;
  baslik?: string;
  altBaslik?: string;
  className?: string;
  ikonClassName?: string;
};

export function PusulaLogo({
  boyut = "md",
  tip = "ikon",
  baslik,
  altBaslik,
  className,
  ikonClassName,
}: PusulaLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Compass
        aria-hidden="true"
        className={cn("shrink-0 text-primary", IKON_SINIFI[boyut], ikonClassName)}
      />
      {tip === "tam" && (baslik || altBaslik) ? (
        <span className="grid leading-tight">
          {baslik ? (
            <span className={cn("truncate font-medium", BASLIK_SINIFI[boyut])}>
              {baslik}
            </span>
          ) : null}
          {altBaslik ? (
            <span
              className={cn(
                "truncate text-muted-foreground",
                ALTBASLIK_SINIFI[boyut],
              )}
            >
              {altBaslik}
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="sr-only">Pusula</span>
    </span>
  );
}
