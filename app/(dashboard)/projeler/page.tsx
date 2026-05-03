import type { Metadata } from 'next'
import { ProjeList } from './components/proje-list'

export const metadata: Metadata = { title: 'Projeler' }

export default function ProjelerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projeler</h1>
        <p className="text-sm text-muted-foreground">
          Birim altında çalıştığınız projeleri yönetin
        </p>
      </div>
      <ProjeList />
    </div>
  )
}
