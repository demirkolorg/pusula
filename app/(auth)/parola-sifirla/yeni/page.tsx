"use client";

// Sprint 1 / S1-6 — token URL hash fragment ile gelir
// (`/parola-sifirla/yeni#token=...`). Hash sunucuya iletilmez; bu sayfa
// client-side hash'i okur ve token'ı sorgulayıp formu render eder.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { AuthKabugu } from "@/components/auth/auth-kabugu";
import { YeniParolaForm } from "../components/yeni-parola-form";
import { sifirlamaTokeniSorgula } from "../actions";

type Durum =
  | { tip: "yukleniyor" }
  | { tip: "gecerli"; token: string }
  | { tip: "gecersiz"; sebep: "bulunamadi" | "kullanilmis" | "expired" }
  | { tip: "token-yok" };

function hashtenTokenAl(): string | null {
  if (typeof window === "undefined") return null;
  const ham = window.location.hash;
  if (!ham || ham.length < 2) return null;
  const params = new URLSearchParams(ham.slice(1));
  return params.get("token");
}

export default function YeniParolaSayfasi() {
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
    void sifirlamaTokeniSorgula({ token }).then((sonuc) => {
      if (iptal) return;
      if (!sonuc.basarili) {
        setDurum({ tip: "gecersiz", sebep: "bulunamadi" });
        return;
      }
      if (!sonuc.veri.gecerli) {
        setDurum({ tip: "gecersiz", sebep: sonuc.veri.sebep });
        return;
      }
      setDurum({ tip: "gecerli", token });
    });
    return () => {
      iptal = true;
    };
  }, []);

  return (
    <AuthKabugu
      baslik="Yeni parola belirle"
      aciklama={aciklama(durum)}
      altIcerik={
        <Link
          href="/giris"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      }
    >
      {durum.tip === "yukleniyor" && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-6">
          <Loader2 className="size-4 animate-spin" />
          <span>Bağlantı doğrulanıyor…</span>
        </div>
      )}
      {durum.tip === "gecerli" && <YeniParolaForm token={durum.token} />}
      {(durum.tip === "gecersiz" || durum.tip === "token-yok") && (
        <div className="text-center text-sm">
          <Link
            href="/parola-sifirla"
            className="text-primary underline underline-offset-4"
          >
            Yeni bağlantı isteyin
          </Link>
        </div>
      )}
    </AuthKabugu>
  );
}

function aciklama(durum: Durum): string {
  switch (durum.tip) {
    case "yukleniyor":
      return "Bağlantınızı doğruluyoruz.";
    case "gecerli":
      return "Yeni parolanızı belirleyin.";
    case "token-yok":
      return "Bağlantı eksik.";
    case "gecersiz":
      return durum.sebep === "kullanilmis"
        ? "Bu bağlantı daha önce kullanılmış."
        : durum.sebep === "expired"
          ? "Bu bağlantının süresi dolmuş."
          : "Bu bağlantı geçersiz.";
  }
}
