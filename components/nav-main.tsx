'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { MenuGrubu } from '@/components/layout/sidebar-menu-config'

export function NavMain({ gruplar }: { gruplar: MenuGrubu[] }) {
  const yol = usePathname()

  return (
    <>
      {gruplar.map((grup) => (
        <SidebarGroup key={grup.etiket}>
          <SidebarGroupLabel>{grup.etiket}</SidebarGroupLabel>
          <SidebarMenu>
            {grup.ogeler.map((oge) => {
              const Ikon = oge.ikon
              const aktif = yol === oge.url || yol?.startsWith(oge.url + '/')
              return (
                <SidebarMenuItem key={oge.url}>
                  <SidebarMenuButton
                    isActive={aktif}
                    tooltip={oge.baslik}
                    render={<Link href={oge.url as Route} />}
                  >
                    <Ikon />
                    <span>{oge.baslik}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
