import type { Metadata } from 'next'
import { GorevList } from './components/gorev-list'

export const metadata: Metadata = { title: 'Görevler' }

type Aramalar = Promise<{ projeId?: string; durum?: string }>

export default async function GorevlerPage({
  searchParams,
}: {
  searchParams: Aramalar
}) {
  const { projeId, durum } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Görevler</h1>
        <p className="text-sm text-muted-foreground">
          Atanmış ve takip ettiğiniz görevler
        </p>
      </div>
      <GorevList projeId={projeId} baslangicDurumu={durum} />
    </div>
  )
}
