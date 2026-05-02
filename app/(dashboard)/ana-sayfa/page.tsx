import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Ana Sayfa' }

export default function AnasayfaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">ana-sayfa</h1>
    </div>
  )
}
