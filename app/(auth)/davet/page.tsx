"use client";

// Sprint 1 / S1-6 — token URL hash fragment ile gelir (`/davet#token=...`).
// Hash sunucuya iletilmez; bu sayfa client-side hash'i okur, sorgulama
// action'ı ile geçerlilik kontrolü yapar, formu render eder.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { DavetKabulForm } from "./components/kabul-form";
import { davetTokeniSorgula } from "./actions";

type Durum =
  | { tip: "yukleniyor" }
  | { tip: "gecerli"; token: string; email: string }
  | { tip: "gecersiz"; sebep: "bulunamadi" | "kullanilmis" | "expired" }
  | { tip: "token-yok" };

function hashtenTokenAl(): string | null {
  if (typeof window === "undefined") return null;
  const ham = window.location.hash;
  if (!ham || ham.length < 2) return null;
  const params = new URLSearchParams(ham.slice(1));
  return params.get("token");
}

export default function DavetSayfasi() {
  const [durum, setDurum] = useState<Durum>({ tip: "yukleniyor" });

  useEffect(() => {
    const token = hashtenTokenAl();
    let iptal = false;
    if (!token) {
      // Microtask defer — sync setState cascading render uyarısını önler.
      void Promise.resolve().then(() => {
        if (!iptal) setDurum({ tip: "token-yok" });
      });
      return () => {
        iptal = true;
      };
    }
    void davetTokeniSorgula({ token }).then((sonuc) => {
      if (iptal) return;
      if (!sonuc.basarili) {
        setDurum({ tip: "gecersiz", sebep: "bulunamadi" });
        return;
      }
      if (!sonuc.veri.gecerli) {
        setDurum({ tip: "gecersiz", sebep: sonuc.veri.sebep });
        return;
      }
      setDurum({ tip: "gecerli", token, email: sonuc.veri.email });
    });
    return () => {
      iptal = true;
    };
  }, []);

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Davete Hoş Geldiniz</CardTitle>
          <CardDescription>{aciklama(durum)}</CardDescription>
        </CardHeader>
        <CardContent>
          {durum.tip === "yukleniyor" && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-6">
              <Loader2 className="size-4 animate-spin" />
              <span>Davet kontrol ediliyor…</span>
            </div>
          )}
          {durum.tip === "gecerli" && (
            <DavetKabulForm token={durum.token} email={durum.email} />
          )}
          {(durum.tip === "gecersiz" || durum.tip === "token-yok") && (
            <div className="text-center text-sm">
              <Link
                href="/giris"
                className="text-primary underline underline-offset-4"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function aciklama(durum: Durum): string {
  switch (durum.tip) {
    case "yukleniyor":
      return "Davet bağlantınızı doğruluyoruz.";
    case "gecerli":
      return `${durum.email} hesabını oluşturmak için bilgilerinizi girin.`;
    case "token-yok":
      return "Davet bağlantısı eksik.";
    case "gecersiz":
      return durum.sebep === "kullanilmis"
        ? "Bu davet daha önce kullanılmış."
        : durum.sebep === "expired"
          ? "Bu davetin süresi dolmuş."
          : "Bu davet bağlantısı geçersiz.";
  }
}
