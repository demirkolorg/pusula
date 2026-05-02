import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // TODO: oturumu kontrol et, yoksa /giris'e yönlendir
  // const oturum = await getOturum()
  // if (!oturum) redirect('/giris')

  return (
    <div className="flex min-h-screen">
      {/* Sidebar buraya gelecek */}
      {/* <Sidebar /> */}
      <div className="flex flex-1 flex-col">
        {/* Header buraya gelecek */}
        {/* <Header /> */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
