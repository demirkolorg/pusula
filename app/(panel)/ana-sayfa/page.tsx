import { auth } from "@/auth";

export default async function AnaSayfa() {
  const oturum = await auth();
  const adSoyad =
    (oturum?.user as { adSoyad?: string } | undefined)?.adSoyad ??
    oturum?.user?.email ??
    "";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-xl border p-6">
        <h1 className="text-2xl font-semibold">Hoş geldiniz, {adSoyad}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Pusula — Kaymakamlık Görev Yönetimi
        </p>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[60vh] flex-1 rounded-xl" />
    </div>
  );
}
