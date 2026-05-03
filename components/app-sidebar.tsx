'use client'

import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from '@/components/ui/sidebar'
import { rolIcinMenu } from '@/components/layout/sidebar-menu-config'

export type AppSidebarKullanicisi = {
  ad: string
  eposta: string
  rol?: string | null
  birimAdi?: string | null
  avatarUrl?: string | null
}

export function AppSidebar({
  kullanici,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  kullanici: AppSidebarKullanicisi
}) {
  const gruplar = React.useMemo(() => rolIcinMenu(kullanici.rol), [kullanici.rol])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain gruplar={gruplar} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
