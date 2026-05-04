import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderUserMenu } from "@/components/header-user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { BildirimDropdown } from "@/app/(panel)/bildirimler/components/bildirim-dropdown";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const oturum = await auth();
  if (!oturum?.user) {
    redirect("/giris");
  }

  const adSoyad =
    (oturum.user as { adSoyad?: string }).adSoyad ?? oturum.user.email ?? "Kullanıcı";

  return (
    <SidebarProvider>
      <AppSidebar />
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
          <div className="flex items-center gap-1 px-4">
            <ThemeToggle />
            <BildirimDropdown />
            <HeaderUserMenu
              user={{
                name: adSoyad,
                email: oturum.user.email ?? "",
              }}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
