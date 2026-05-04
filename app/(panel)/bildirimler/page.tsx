import { BildirimlerSayfaIcerik } from "./components/bildirimler-sayfa";

export default function BildirimlerPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Bildirimler</h1>
        <p className="text-muted-foreground text-sm">
          Mention&apos;lar, kart atamaları, kontrol madde atamaları ve bitiş
          tarihi uyarıları.
        </p>
      </div>
      <BildirimlerSayfaIcerik />
    </div>
  );
}
