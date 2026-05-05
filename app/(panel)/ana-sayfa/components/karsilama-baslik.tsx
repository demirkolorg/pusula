const TARIH_UZUN = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export function KarsilamaBaslik({
  adSoyad,
  acikGorev,
}: {
  adSoyad: string;
  acikGorev: number;
}) {
  const bugun = TARIH_UZUN.format(new Date());
  return (
    <div className="bg-card rounded-xl border p-6">
      <h1 className="font-heading text-2xl font-semibold">
        Hoş geldiniz{adSoyad ? `, ${adSoyad}` : ""}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {bugun}
        {acikGorev > 0 ? (
          <>
            {" · "}
            <span className="text-foreground font-medium">{acikGorev}</span>{" "}
            açık görev seni bekliyor
          </>
        ) : (
          <> · Açık görev yok</>
        )}
      </p>
    </div>
  );
}
