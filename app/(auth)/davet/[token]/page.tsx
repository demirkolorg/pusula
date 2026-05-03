import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DavetKabulForm } from "../components/kabul-form";

export const metadata = {
  title: "Davet — Pusula",
};

export default async function DavetSayfasi({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const davet = await db.davetTokeni.findUnique({ where: { token } });
  if (!davet) notFound();

  const gecerli =
    !davet.kullanildi_mi && davet.son_kullanma > new Date();

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Davete Hoş Geldiniz</CardTitle>
          <CardDescription>
            {gecerli
              ? `${davet.email} hesabını oluşturmak için bilgilerinizi girin.`
              : "Bu davet bağlantısı geçersiz veya süresi dolmuş."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gecerli ? (
            <DavetKabulForm token={token} email={davet.email} />
          ) : (
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
