'use client'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  GOREV_DURUMLARI,
  ONCELIK_DUZEYLERI,
} from '../../schemas'
import { useGorevGuncelle } from '../../hooks/use-gorevler'
import type { GorevDetay } from '../../api'
import { OnayEylemleri } from './onay-eylemleri'

const DURUM_ETIKETI: Record<(typeof GOREV_DURUMLARI)[number], string> = {
  YAPILACAK: 'Yapılacak',
  SURUYOR: 'Sürüyor',
  ONAY_BEKLIYOR: 'Onay Bekliyor',
  ONAYLANDI: 'Onaylandı',
  DUZELTME: 'Düzeltme',
  IPTAL: 'İptal',
}

const ONCELIK_ETIKETI: Record<(typeof ONCELIK_DUZEYLERI)[number], string> = {
  DUSUK: 'Düşük',
  ORTA: 'Orta',
  YUKSEK: 'Yüksek',
  KRITIK: 'Kritik',
}

function tarihYazdir(tarih: string | null) {
  if (!tarih) return '—'
  return new Date(tarih).toLocaleDateString('tr-TR')
}

export function DetaySekmesi({ gorev }: { gorev: GorevDetay }) {
  const guncelle = useGorevGuncelle(gorev.id)
  const [aciklama, setAciklama] = useState(gorev.aciklama ?? '')
  const [aciklamaDuzenle, setAciklamaDuzenle] = useState(false)

  async function durumDegistir(yeniDurum: (typeof GOREV_DURUMLARI)[number]) {
    try {
      await guncelle.mutateAsync({ durum: yeniDurum })
      toast.success('Durum güncellendi')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncellenemedi')
    }
  }

  async function oncelikDegistir(yeni: (typeof ONCELIK_DUZEYLERI)[number]) {
    try {
      await guncelle.mutateAsync({ oncelik: yeni })
      toast.success('Öncelik güncellendi')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncellenemedi')
    }
  }

  async function aciklamaKaydet() {
    try {
      await guncelle.mutateAsync({ aciklama })
      toast.success('Açıklama kaydedildi')
      setAciklamaDuzenle(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kaydedilemedi')
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Durum</div>
          <Select
            value={gorev.durum}
            onValueChange={(v) =>
              v && durumDegistir(v as (typeof GOREV_DURUMLARI)[number])
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOREV_DURUMLARI.map((d) => (
                <SelectItem key={d} value={d}>
                  {DURUM_ETIKETI[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Öncelik</div>
          <Select
            value={gorev.oncelik}
            onValueChange={(v) =>
              v && oncelikDegistir(v as (typeof ONCELIK_DUZEYLERI)[number])
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ONCELIK_DUZEYLERI.map((o) => (
                <SelectItem key={o} value={o}>
                  {ONCELIK_ETIKETI[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">Proje</div>
        <div className="text-sm">{gorev.proje.ad}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Atanan</div>
          <div className="text-sm">
            {gorev.atanan ? gorev.atanan.name : <span className="text-muted-foreground">—</span>}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Oluşturan</div>
          <div className="text-sm">{gorev.olusturan.name}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Başlangıç</div>
          <div className="text-sm">{tarihYazdir(gorev.baslangicTarihi)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Bitiş</div>
          <div className="text-sm">{tarihYazdir(gorev.bitisTarihi)}</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">Açıklama</div>
          {!aciklamaDuzenle && (
            <Button variant="ghost" size="xs" onClick={() => setAciklamaDuzenle(true)}>
              Düzenle
            </Button>
          )}
        </div>
        {aciklamaDuzenle ? (
          <div className="space-y-2">
            <Textarea
              rows={4}
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Görev detayları"
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={guncelle.isPending} onClick={aciklamaKaydet}>
                Kaydet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAciklama(gorev.aciklama ?? '')
                  setAciklamaDuzenle(false)
                }}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
            {gorev.aciklama ?? (
              <span className="text-muted-foreground">Açıklama yok</span>
            )}
          </div>
        )}
      </div>

      {gorev.altGorevler.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Alt Görevler ({gorev.altGorevler.length})
          </div>
          <ul className="space-y-1.5">
            {gorev.altGorevler.map((ag) => (
              <li
                key={ag.id}
                className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
              >
                <span>{ag.baslik}</span>
                <Badge variant="outline">{ag.durum}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <OnayEylemleri gorev={gorev} />
    </div>
  )
}
