"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useMobil } from "@/hooks/use-breakpoint"

const Toaster = ({ position, ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const mobil = useMobil()

  React.useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  // Plan 1.5/E: mobil = top-center, desktop = top-right
  const calculatedPosition: ToasterProps["position"] =
    position ?? (mobil ? "top-center" : "top-right")

  return (
    <Sonner
      theme={(mounted ? theme : "light") as ToasterProps["theme"]}
      position={calculatedPosition}
      className="toaster group"
      // Sprint 4 / S4-7 — Sonner default `aria-live="polite"` kullanır;
      // hata mesajları için `assertive` daha uygun. `hotkey` ve `closeButton`
      // çevirileri Türkçe.
      hotkey={["altKey", "KeyT"]}
      icons={{
        success: <CircleCheckIcon aria-hidden className="size-4" />,
        info: <InfoIcon aria-hidden className="size-4" />,
        warning: <TriangleAlertIcon aria-hidden className="size-4" />,
        error: <OctagonXIcon aria-hidden className="size-4" />,
        loading: <Loader2Icon aria-hidden className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
