import type { Metadata } from 'next'
import { KullaniciList } from './components/kullanici-list'

export const metadata: Metadata = { title: 'Kullanıcılar' }

export default function KullanicilarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <p className="text-muted-foreground text-sm">Sistem kullanıcılarını yönetin</p>
      </div>
      <KullaniciList />
    </div>
  )
}
