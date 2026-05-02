import type { Metadata } from 'next'
import { BirimList } from './components/birim-list'

export const metadata: Metadata = { title: 'Birimler' }

export default function BirimlerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Birimler</h1>
        <p className="text-muted-foreground text-sm">Organizasyon birimlerini yönetin</p>
      </div>
      <BirimList />
    </div>
  )
}
