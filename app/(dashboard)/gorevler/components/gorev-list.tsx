'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/data-table/data-table'
import { toast } from 'sonner'
import { GorevForm } from './gorev-form'
import { GorevSatirAksiyonlari } from './gorev-satir-aksiyonlari'
import { GorevCekmece } from './gorev-cekmece'
import { useGorevler, useGorevOlustur } from '../hooks/use-gorevler'
import type { GorevListeItem } from '../api'
import type { GorevOlusturIstek } from '../schemas'
import { useIzin } from '@/hooks/use-permission'

const DURUM_ETIKETI: Record<GorevListeItem['durum'], string> = {
  YAPILACAK: 'Yapılacak',
  SURUYOR: 'Sürüyor',
  ONAY_BEKLIYOR: 'Onay Bekliyor',
  ONAYLANDI: 'Onaylandı',
  DUZELTME: 'Düzeltme',
  IPTAL: 'İptal',
}

const DURUM_VARYANT: Record<
  GorevListeItem['durum'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  YAPILACAK: 'outline',
  SURUYOR: 'default',
  ONAY_BEKLIYOR: 'secondary',
  ONAYLANDI: 'secondary',
  DUZELTME: 'destructive',
  IPTAL: 'outline',
}

const ONCELIK_ETIKETI: Record<GorevListeItem['oncelik'], string> = {
  DUSUK: 'Düşük',
  ORTA: 'Orta',
  YUKSEK: 'Yüksek',
  KRITIK: 'Kritik',
}

const ONCELIK_VARYANT: Record<
  GorevListeItem['oncelik'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DUSUK: 'outline',
  ORTA: 'secondary',
  YUKSEK: 'default',
  KRITIK: 'destructive',
}

function tarihFormatla(tarih: string | null): string {
  if (!tarih) return '—'
  const d = new Date(tarih)
  const bugun = new Date()
  const fark = Math.ceil((d.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))
  const tarihStr = d.toLocaleDateString('tr-TR')
  if (fark < 0) return `${tarihStr} (${Math.abs(fark)}g önce)`
  if (fark === 0) return `${tarihStr} (bugün)`
  return `${tarihStr} (${fark}g)`
}

const sutunlar: ColumnDef<GorevListeItem>[] = [
  {
    accessorKey: 'baslik',
    header: 'Başlık',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.baslik}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.proje.ad}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'atanan',
    header: 'Atanan',
    cell: ({ row }) =>
      row.original.atanan ? (
        <span className="text-sm">{row.original.atanan.name}</span>
      ) : (
        <span className="text-sm text-muted-foreground/50">—</span>
      ),
  },
  {
    accessorKey: 'durum',
    header: 'Durum',
    cell: ({ row }) => (
      <Badge variant={DURUM_VARYANT[row.original.durum]}>
        {DURUM_ETIKETI[row.original.durum]}
      </Badge>
    ),
  },
  {
    accessorKey: 'oncelik',
    header: 'Öncelik',
    cell: ({ row }) => (
      <Badge variant={ONCELIK_VARYANT[row.original.oncelik]}>
        {ONCELIK_ETIKETI[row.original.oncelik]}
      </Badge>
    ),
  },
  {
    accessorKey: 'bitisTarihi',
    header: 'Bitiş',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {tarihFormatla(row.original.bitisTarihi)}
      </span>
    ),
  },
  {
    id: 'aksiyonlar',
    header: '',
    cell: ({ row }) => <GorevSatirAksiyonlari gorev={row.original} />,
  },
]

export function GorevList({
  projeId,
  baslangicDurumu,
}: {
  projeId?: string
  baslangicDurumu?: string
}) {
  const [arama, setArama] = useState('')
  const [durum, setDurum] = useState<string>(baslangicDurumu ?? 'TUMU')
  const [yeniDialog, setYeniDialog] = useState(false)
  const [acikGorevId, setAcikGorevId] = useState<string | null>(null)

  const { data: gorevler = [], isLoading } = useGorevler({
    arama: arama || undefined,
    projeId,
    durum: durum === 'TUMU' ? undefined : durum,
  })
  const olustur = useGorevOlustur()
  const olusturabilir = useIzin('gorev.olustur')

  async function yeniGonder(veri: GorevOlusturIstek) {
    try {
      await olustur.mutateAsync(veri)
      toast.success('Görev oluşturuldu')
      setYeniDialog(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Oluşturma başarısız')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Görev ara…"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={durum} onValueChange={(v) => setDurum(v ?? 'TUMU')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TUMU">Tüm durumlar</SelectItem>
              <SelectItem value="YAPILACAK">Yapılacak</SelectItem>
              <SelectItem value="SURUYOR">Sürüyor</SelectItem>
              <SelectItem value="ONAY_BEKLIYOR">Onay Bekliyor</SelectItem>
              <SelectItem value="DUZELTME">Düzeltme</SelectItem>
              <SelectItem value="ONAYLANDI">Onaylandı</SelectItem>
              <SelectItem value="IPTAL">İptal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {olusturabilir && (
          <>
            <Button onClick={() => setYeniDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Görev
            </Button>
            <Dialog open={yeniDialog} onOpenChange={setYeniDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Yeni Görev Oluştur</DialogTitle>
                </DialogHeader>
                <GorevForm
                  yukleniyor={olustur.isPending}
                  onGonder={yeniGonder}
                  projeSabit={projeId ?? null}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <DataTable
        columns={sutunlar}
        data={isLoading ? [] : gorevler}
        onRowClick={(g) => setAcikGorevId(g.id)}
      />

      <GorevCekmece
        gorevId={acikGorevId}
        acik={!!acikGorevId}
        onAcikDegisti={(a) => !a && setAcikGorevId(null)}
      />
    </div>
  )
}
