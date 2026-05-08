import { cn } from "@/lib/utils"

// Sprint 4 / S4-5 — Yükleme placeholder'ı için a11y semantic.
// `role="status" + aria-busy + aria-live="polite"` screen reader'a
// "yükleniyor" durumunu duyurur. Sr-only "Yükleniyor…" metni ilk
// duyuru için (sonradan gerçek içerik geldiğinde otomatik silinir).
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    >
      <span className="sr-only">Yükleniyor…</span>
    </div>
  )
}

export { Skeleton }
