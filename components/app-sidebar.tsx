"use client";

import * as React from "react";

import Link from "next/link";

import { PusulaLogo } from "@/components/branding";
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
import { useKurumAyariStore } from "@/lib/stores/kurum-ayari-store";
import {
  ListChecksIcon,
  ShieldCheckIcon,
  Building2Icon,
  Layers3Icon,
  UsersIcon,
  KeyRoundIcon,
  TagsIcon,
  ScrollTextIcon,
  AlertTriangleIcon,
  SettingsIcon,
} from "lucide-react";

const navGroups: NavGroup[] = [
  {
    label: "Projeler",
    items: [
      { title: "Projeler", url: "/projeler", icon: <ListChecksIcon /> },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { title: "Genel", url: "/ayarlar/genel", icon: <SettingsIcon /> },
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
  const kurumAdi = useKurumAyariStore((s) => s.kurumAdi);
  const uygulamaAdi = useKurumAyariStore((s) => s.uygulamaAdi);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/ana-sayfa" />}>
              <PusulaLogo
                boyut="lg"
                tip="tam"
                baslik={kurumAdi}
                altBaslik={uygulamaAdi}
                className="flex-1"
                ikonClassName="size-9! text-sidebar-primary"
              />
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
