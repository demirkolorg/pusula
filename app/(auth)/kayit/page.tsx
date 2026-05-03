import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KayitForm } from "./components/kayit-form";

export const metadata = {
  title: "Kayıt — Pusula",
};

export default function KayitSayfasi() {
  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pusula — Kayıt</CardTitle>
          <CardDescription>
            Kurumunuzu seçip hesap oluşturun. Kaymakamlık tarafından
            onaylandıktan sonra giriş yapabileceksiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KayitForm />
          <div className="mt-6 text-center text-sm">
            <Link
              href="/giris"
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Zaten hesabım var, giriş yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
