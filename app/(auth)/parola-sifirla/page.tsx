import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ParolaSifirlaIstekForm } from "./components/istek-form";

export const metadata = {
  title: "Parolamı Unuttum — Pusula",
};

export default function ParolaSifirlaSayfasi() {
  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Parolamı Unuttum</CardTitle>
          <CardDescription>
            E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParolaSifirlaIstekForm />
          <div className="mt-6 text-center text-sm">
            <Link
              href="/giris"
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
