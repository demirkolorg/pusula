"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type NavGroup = {
  label: string
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    // Opsiyonel sağa yaslı slot — sayım rozeti, "yeni" işareti vs. (ADR-0019).
    // Reactive bir component (örn. <BekleyenOneriBadge />) verilebilir; o
    // component kendi içinde TanStack Query ile sayımı çeker.
    badge?: React.ReactNode
  }[]
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                >
                  {item.icon}
                  <span className="flex-1">{item.title}</span>
                  {item.badge}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
