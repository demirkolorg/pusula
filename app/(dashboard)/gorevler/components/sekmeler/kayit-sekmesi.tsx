'use client'

import type { GorevDetay } from '../../api'

function tarihYazdir(tarih: string | null) {
  if (!tarih) return '—'
  return new Date(tarih).toLocaleString('tr-TR')
}

export function KayitSekmesi({ gorev }: { gorev: GorevDetay }) {
  const satirlar: { etiket: string; deger: string }[] = [
    { etiket: 'ID', deger: gorev.id },
    { etiket: 'Oluşturan', deger: gorev.olusturan.name },
    { etiket: 'Oluşturma Tarihi', deger: tarihYazdir(gorev.olusturmaTarihi) },
    { etiket: 'Son Güncelleme', deger: tarihYazdir(gorev.guncellemeTarihi) },
    { etiket: 'Proje', deger: gorev.proje.ad },
    {
      etiket: 'Üst Görev',
      deger: gorev.ustGorev?.baslik ?? '—',
    },
    {
      etiket: 'Alt Görev Sayısı',
      deger: String(gorev.altGorevler.length),
    },
    {
      etiket: 'Yorum Sayısı',
      deger: String(gorev._count.yorumlar),
    },
    {
      etiket: 'Derkenar Sayısı',
      deger: String(gorev._count.derkenarlar),
    },
  ]

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-muted/20 p-3 text-sm">
        <p className="text-muted-foreground">
          Detaylı denetim kaydı (kim ne yaptı) sonraki etapta (KÖ-8) eklenecek.
        </p>
      </div>
      <dl className="divide-y">
        {satirlar.map((s) => (
          <div key={s.etiket} className="flex justify-between gap-2 py-2 text-sm">
            <dt className="font-medium text-muted-foreground">{s.etiket}</dt>
            <dd className="text-right font-mono text-xs">{s.deger}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
