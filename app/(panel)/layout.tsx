import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalSearch } from "@/components/global-search";
import { HeaderUserMenu } from "@/components/header-user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { KomutPaleti } from "@/app/(panel)/genel-arama/components/komut-paleti";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { kullaniciIzinleriniAl } from "@/lib/permissions";
import { gorunurMenuKodlari } from "@/lib/sidebar-yetki";
import { BildirimDropdown } from "@/app/(panel)/bildirimler/components/bildirim-dropdown";

function oturumKullaniciIdAl(
  kullanici: { id?: unknown } | undefined,
): string | null {
  if (typeof kullanici?.id !== "string" || kullanici.id.length === 0) return null;
  return kullanici.id;
}

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const oturum = await auth();
  if (!oturum?.user) {
    redirect("/giris");
  }

  const kullaniciId = oturumKullaniciIdAl(oturum.user);
  if (!kullaniciId) {
    redirect("/api/oturum/gecersiz");
  }

  const kullanici = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: {
      ad: true,
      soyad: true,
      email: true,
      aktif: true,
      silindi_mi: true,
      onay_durumu: true,
      roller: {
        select: {
          rol: { select: { ad: true, kod: true } },
        },
      },
    },
  });

  if (
    !kullanici ||
    !kullanici.aktif ||
    kullanici.silindi_mi ||
    kullanici.onay_durumu !== "ONAYLANDI"
  ) {
    redirect("/api/oturum/gecersiz");
  }

  const adSoyad = `${kullanici.ad} ${kullanici.soyad}`;
  const rolAdlari = kullanici.roller.map((r) => r.rol.ad);
  const rolKodlari = kullanici.roller.map((r) => r.rol.kod);

  const izinSeti = await kullaniciIzinleriniAl(kullaniciId);
  const gorunurKodlar = gorunurMenuKodlari(izinSeti, rolKodlari);

  return (
    <SidebarProvider>
      <AppSidebar gorunurKodlar={gorunurKodlar} />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Pusula</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4">
            <GlobalSearch />
            <ThemeToggle />
            <BildirimDropdown />
            <HeaderUserMenu
              user={{
                name: adSoyad,
                email: kullanici.email,
                roller: rolAdlari,
              }}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>
      </SidebarInset>
      <KomutPaleti />
    </SidebarProvider>
  );
}
