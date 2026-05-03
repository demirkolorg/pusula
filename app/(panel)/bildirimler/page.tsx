import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellIcon } from "lucide-react";

export default function BildirimlerPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Bildirimler</h1>
        <p className="text-muted-foreground text-sm">
          Sana gelen mention&apos;lar, kart atamaları ve önemli olaylar burada
          listelenecek.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="size-5" />
            Henüz bildirim yok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Bildirim merkezi sonraki sürümde aktive olacak. Şimdilik kart üyeliği
            ve mention&apos;lar üzerinden gerçek zamanlı bildirim gönderilmiyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
