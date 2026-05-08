import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pusula — Kaymakamlık Görev Yönetimi",
  description:
    "Trello tarzı kanban + görev takibi, çekirdek audit ve hata logu, mobil-first UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/* Sprint 4 / S4-1 — Skip Navigation: klavye kullanıcıları sidebar/
            header'ı atlayıp doğrudan ana içeriğe gidebilir. Tab basınca
            görünür, focus dışında sr-only. WCAG 2.1 SC 2.4.1. */}
        <a
          href="#ana-icerik"
          className="bg-background text-foreground sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:px-3 focus:py-2 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Ana içeriğe atla
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryProvider>
          {/* position prop verilmezse Toaster kendisi mobile/desktop'a göre seçer */}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
