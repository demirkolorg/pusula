import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import * as React from 'react'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppSidebar } from '@/components/app-sidebar'
import { Header } from '@/components/layout/header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const oturum = await auth.api.getSession({ headers: await headers() })
  if (!oturum) {
    redirect('/giris')
  }

  const kullanici = await prisma.user.findUnique({
    where: { id: oturum.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      rol: true,
      image: true,
      birim: { select: { ad: true } },
    },
  })

  if (!kullanici) {
    redirect('/giris')
  }

  const oturumKullanici = {
    ad: kullanici.name,
    eposta: kullanici.email,
    rol: kullanici.rol,
    birimAdi: kullanici.birim?.ad ?? null,
    avatarUrl: kullanici.image ?? null,
  }

  return (
    <SidebarProvider style={{ '--header-height': '3.5rem' } as React.CSSProperties}>
      <div className="flex min-h-svh w-full flex-col">
        <Header kullanici={oturumKullanici} />
        <div className="flex flex-1">
          <AppSidebar kullanici={oturumKullanici} />
          <SidebarInset>
            <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
