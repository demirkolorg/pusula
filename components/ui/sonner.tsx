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
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
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
