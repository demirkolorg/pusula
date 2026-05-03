import type { Metadata } from 'next'
import { DenetimList } from './components/denetim-list'

export const metadata: Metadata = { title: 'Denetim Kayıtları' }

export default function DenetimPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Denetim Kayıtları</h1>
        <p className="text-sm text-muted-foreground">
          Sistemde yapılan tüm değişikliklerin değiştirilemez kaydı
        </p>
      </div>
      <DenetimList />
    </div>
  )
}
