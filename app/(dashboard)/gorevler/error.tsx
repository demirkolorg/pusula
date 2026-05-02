'use client'

export default function GorevlerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 pt-16">
      <p className="text-muted-foreground">Görevler yüklenirken hata oluştu.</p>
      <button onClick={reset} className="text-sm text-primary hover:underline">
        Tekrar dene
      </button>
    </div>
  )
}
