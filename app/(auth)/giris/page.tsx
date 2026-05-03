import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GirisForm } from "./components/giris-form";

export const metadata = {
  title: "Giriş — Pusula",
};

export default function GirisSayfasi() {
  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pusula</CardTitle>
          <CardDescription>
            Hesabınızla giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GirisForm />
          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            <Link
              href="/parola-sifirla"
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Parolamı unuttum
            </Link>
            <Link
              href="/kayit"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Hesabım yok, kayıt ol
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
