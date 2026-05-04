"use client";

import * as React from "react";

import Link from "next/link";

import { NavMain, type NavGroup } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BellIcon,
  BuildingIcon,
  ListChecksIcon,
  SearchIcon,
  ShieldCheckIcon,
  StarIcon,
  ArchiveIcon,
  Building2Icon,
  Layers3Icon,
  UsersIcon,
  KeyRoundIcon,
  TagsIcon,
  ScrollTextIcon,
  AlertTriangleIcon,
} from "lucide-react";

const navGroups: NavGroup[] = [
  {
    label: "Projeler",
    items: [
      { title: "Tüm Projeler", url: "/projeler", icon: <ListChecksIcon /> },
      {
        title: "Yıldızlananlar",
        url: "/projeler?filtre=yildizli",
        icon: <StarIcon />,
      },
      { title: "Arşiv", url: "/projeler?filtre=arsiv", icon: <ArchiveIcon /> },
    ],
  },
  {
    label: "Genel",
    items: [
      { title: "Bildirimler", url: "/bildirimler", icon: <BellIcon /> },
      { title: "Arama", url: "/arama", icon: <SearchIcon /> },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { title: "Birimler", url: "/ayarlar/birimler", icon: <Building2Icon /> },
      {
        title: "Kullanıcılar",
        url: "/ayarlar/kullanicilar",
        icon: <UsersIcon />,
      },
      {
        title: "Onay Bekleyenler",
        url: "/ayarlar/onay-bekleyenler",
        icon: <Layers3Icon />,
      },
      { title: "Roller", url: "/ayarlar/roller", icon: <KeyRoundIcon /> },
      { title: "Etiketler", url: "/ayarlar/etiketler", icon: <TagsIcon /> },
      {
        title: "Denetim",
        url: "/ayarlar/denetim",
        icon: <ShieldCheckIcon />,
      },
      {
        title: "Hata Logları",
        url: "/ayarlar/hata-loglari",
        icon: <AlertTriangleIcon />,
      },
    ],
  },
];

const projects = [
  {
    name: "Yönetim",
    url: "/ayarlar/kullanicilar",
    icon: <UsersIcon />,
  },
  {
    name: "Denetim",
    url: "/ayarlar/denetim",
    icon: <ScrollTextIcon />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/ana-sayfa" />}>
              <BuildingIcon
                className="shrink-0 text-sidebar-primary"
                style={{ width: 36, height: 36 }}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  Tekman Kaymakamlığı
                </span>
                <span className="truncate text-xs">
                  Pusula İş Takip Yönetimi
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
