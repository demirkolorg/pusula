"use client";

import * as React from "react";

import Link from "next/link";

import { PusulaLogo } from "@/components/branding";
import { NavMain, type NavGroup } from "@/components/nav-main";
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
import { MENU_KODLARI, type MenuKodu } from "@/lib/sidebar-yetki";
import {
  ListChecksIcon,
  ShieldCheckIcon,
  Building2Icon,
  ClipboardCheckIcon,
  Layers3Icon,
  UsersIcon,
  KeyRoundIcon,
  AlertTriangleIcon,
  BellIcon,
  SettingsIcon,
  Trash2Icon,
  ActivityIcon,
} from "lucide-react";
import { BekleyenOneriRozeti } from "@/app/(panel)/onaylar/components/bekleyen-oneri-rozeti";

// ADR-0020 — Sidebar RBAC: tanım ve görünürlük ayrı.
// Tüm menü öğeleri burada tanımlı; `gorunurKodlar` prop'una göre filtrelenir.
// İzin haritası saf modülde (`lib/sidebar-yetki.ts`); buradaki `kod` alanı
// item'ı haritayla eşleştirir.

type IcMenuItem = NavGroup["items"][number] & { kod: MenuKodu };
type IcMenuGrup = { label: string; items: IcMenuItem[] };

const TUM_GRUPLAR: IcMenuGrup[] = [
  {
    label: "Projeler",
    items: [
      {
        kod: MENU_KODLARI.PROJELER,
        title: "Projeler",
        url: "/projeler",
        icon: <ListChecksIcon />,
      },
      {
        kod: MENU_KODLARI.AKTIVITE_GUNLUGU,
        title: "Aktivite Günlüğü",
        url: "/aktivite-gunlugu",
        icon: <ActivityIcon />,
      },
      {
        kod: MENU_KODLARI.ONAYLAR,
        title: "Tamamlama Onayları",
        url: "/onaylar",
        icon: <ClipboardCheckIcon />,
        badge: <BekleyenOneriRozeti />,
      },
      {
        kod: MENU_KODLARI.COP_KUTUSU,
        title: "Çöp Kutusu",
        url: "/cop-kutusu",
        icon: <Trash2Icon />,
      },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      {
        kod: MENU_KODLARI.AYAR_GENEL,
        title: "Genel",
        url: "/ayarlar/genel",
        icon: <SettingsIcon />,
      },
      {
        kod: MENU_KODLARI.AYAR_BILDIRIMLER,
        title: "Bildirim Ayarları",
        url: "/ayarlar/bildirimler",
        icon: <BellIcon />,
      },
      {
        kod: MENU_KODLARI.AYAR_BIRIMLER,
        title: "Birimler",
        url: "/ayarlar/birimler",
        icon: <Building2Icon />,
      },
      {
        kod: MENU_KODLARI.AYAR_KULLANICILAR,
        title: "Kullanıcılar",
        url: "/ayarlar/kullanicilar",
        icon: <UsersIcon />,
      },
      {
        kod: MENU_KODLARI.AYAR_ROLLER,
        title: "Roller",
        url: "/ayarlar/roller",
        icon: <KeyRoundIcon />,
      },
      {
        kod: MENU_KODLARI.AYAR_SABLONLAR,
        title: "Şablonlar",
        url: "/ayarlar/sablonlar",
        icon: <Layers3Icon />,
      },
      {
        kod: MENU_KODLARI.AYAR_DENETIM,
        title: "Denetim (Forensik)",
        url: "/ayarlar/denetim",
        icon: <ShieldCheckIcon />,
      },
      {
        kod: MENU_KODLARI.AYAR_HATA_LOGLARI,
        title: "Hata Logları",
        url: "/ayarlar/hata-loglari",
        icon: <AlertTriangleIcon />,
      },
    ],
  },
];

function gruplariFiltrele(
  gorunurSet: ReadonlySet<MenuKodu>,
): NavGroup[] {
  const sonuc: NavGroup[] = [];
  for (const grup of TUM_GRUPLAR) {
    const filtreli = grup.items
      .filter((item) => gorunurSet.has(item.kod))
      .map(({ kod: _kod, ...rest }) => rest);
    if (filtreli.length > 0) {
      sonuc.push({ label: grup.label, items: filtreli });
    }
  }
  return sonuc;
}

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  gorunurKodlar: MenuKodu[];
};

export function AppSidebar({ gorunurKodlar, ...props }: AppSidebarProps) {
  const kurumAdi = useKurumAyariStore((s) => s.kurumAdi);
  const uygulamaAdi = useKurumAyariStore((s) => s.uygulamaAdi);

  const gorunurGruplar = React.useMemo(
    () => gruplariFiltrele(new Set(gorunurKodlar)),
    [gorunurKodlar],
  );

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
        <NavMain groups={gorunurGruplar} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
