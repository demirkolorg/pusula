import * as React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";
import { AuthMarkaPanel } from "./auth-marka-panel";

export type AuthKabuguProps = {
  /** Sol kolonda formun üstündeki ana başlık (ör. "Tekrar hoş geldiniz"). */
  baslik: string;
  /** Başlığın altındaki destekleyici metin. */
  aciklama: string;
  /** Form veya sayfaya özgü içerik. */
  children: React.ReactNode;
  /**
   * Form altındaki ek içerik (alt link, ipucu vs.). React node — birden fazla
   * link veya kısa metin verilebilir. `null` verilirse bölüm gizlenir.
   */
  altIcerik?: React.ReactNode;
  /** Sol kolonun maksimum genişliği. Kayıt formu daha geniş olduğu için override edilir. */
  formMaxGenislik?: "sm" | "md";
};

const FORM_MAX: Record<NonNullable<AuthKabuguProps["formMaxGenislik"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
};

/**
 * Auth ekranlarının (giriş, kayıt) ortak split-screen kabuğu.
 *
 * Mobile-first (Kural 9, 10):
 *   - <lg : tek kolon, sadece sol panel görünür.
 *   - lg+ : iki kolon, sol form / sağ marka panosu.
 *
 * Server component — herhangi bir interaktivite yok; istemci formu `children`
 * olarak verilir.
 */
export function AuthKabugu({
  baslik,
  aciklama,
  children,
  altIcerik,
  formMaxGenislik = "sm",
}: AuthKabuguProps) {
  return (
    <div className="bg-background grid min-h-svh lg:grid-cols-2">
      <section className="flex flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
          >
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground inline-flex size-9 items-center justify-center rounded-xl shadow-sm"
            >
              <Compass className="size-5" />
            </span>
            <span>Pusula</span>
          </Link>
          <span className="text-muted-foreground text-xs">
            Kaymakamlık Görev Yönetimi
          </span>
        </header>

        <main
          className={cn(
            "mx-auto flex w-full flex-1 flex-col justify-center py-10",
            FORM_MAX[formMaxGenislik],
          )}
        >
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
              {baslik}
            </h1>
            <p className="text-muted-foreground text-sm">{aciklama}</p>
          </div>

          {children}

          {altIcerik ? (
            <div className="text-muted-foreground mt-6 flex flex-col items-center gap-2 text-center text-sm">
              {altIcerik}
            </div>
          ) : null}
        </main>

        <footer className="text-muted-foreground flex items-center justify-between text-xs">
          <span>© {new Date().getFullYear()} Pusula</span>
          <Link href="/giris" className="hover:text-foreground">
            Yardım
          </Link>
        </footer>
      </section>

      <AuthMarkaPanel />
    </div>
  );
}
