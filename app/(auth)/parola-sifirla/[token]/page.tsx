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
import { YeniParolaForm } from "../components/yeni-parola-form";

export const metadata = {
  title: "Parola Belirle — Pusula",
};

export default async function YeniParolaSayfasi({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const kayit = await db.sifirlamaTokeni.findUnique({ where: { token } });
  const gecerli =
    !!kayit && !kayit.kullanildi_mi && kayit.son_kullanma > new Date();

  if (!kayit) notFound();

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Yeni Parola Belirle</CardTitle>
          <CardDescription>
            {gecerli
              ? "Yeni parolanızı belirleyin."
              : "Bu bağlantı geçersiz veya süresi dolmuş."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gecerli ? (
            <YeniParolaForm token={token} />
          ) : (
            <div className="text-center text-sm">
              <Link
                href="/parola-sifirla"
                className="text-primary underline underline-offset-4"
              >
                Yeni bağlantı isteyin
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
