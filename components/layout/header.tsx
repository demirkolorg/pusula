'use client'

import { CompassIcon } from 'lucide-react'
import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { HeaderSearch } from '@/components/layout/header-search'
import { HeaderQuickAdd } from '@/components/layout/header-quick-add'
import { HeaderNotifications } from '@/components/layout/header-notifications'
import { HeaderUserMenu } from '@/components/layout/header-user-menu'

export function Header({
  kullanici,
  bildirimSayisi = 0,
}: {
  kullanici: {
    ad: string
    eposta: string
    rol?: string | null
    avatarUrl?: string | null
  }
  bildirimSayisi?: number
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
      <SidebarTrigger />

      <Link href="/ana-sayfa" className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CompassIcon className="size-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">PUSULA</span>
      </Link>

      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      <div className="flex flex-1 items-center justify-center px-2">
        <HeaderSearch />
      </div>

      <div className="flex items-center gap-1">
        <HeaderQuickAdd />
        <HeaderNotifications sayim={bildirimSayisi} />
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <HeaderUserMenu kullanici={kullanici} />
      </div>
    </header>
  )
}
