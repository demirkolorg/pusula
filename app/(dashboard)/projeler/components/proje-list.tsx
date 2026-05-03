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
import { DataTable } from '@/components/data-table/data-table'
import { toast } from 'sonner'
import { ProjeForm } from './proje-form'
import { ProjeSatirAksiyonlari } from './proje-satir-aksiyonlari'
import { useProjeler, useProjeOlustur } from '../hooks/use-projeler'
import type { ProjeListeItem } from '../api'
import type { ProjeOlusturIstek } from '../schemas'
import { useIzin } from '@/hooks/use-permission'

function tarihFormatla(tarih: string | null): string {
  if (!tarih) return '—'
  return new Date(tarih).toLocaleDateString('tr-TR')
}

const sutunlar: ColumnDef<ProjeListeItem>[] = [
  {
    accessorKey: 'ad',
    header: 'Proje Adı',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.ad}</div>
        {row.original.aciklama ? (
          <div className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.aciklama}
          </div>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'birim',
    header: 'Birim',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.birim.ad}</span>
    ),
  },
  {
    id: 'gorevler',
    header: 'Görevler',
    cell: ({ row }) => <Badge variant="secondary">{row.original._count.gorevler}</Badge>,
  },
  {
    accessorKey: 'baslangicTarihi',
    header: 'Başlangıç',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {tarihFormatla(row.original.baslangicTarihi)}
      </span>
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
    cell: ({ row }) => <ProjeSatirAksiyonlari proje={row.original} />,
  },
]

export function ProjeList() {
  const [arama, setArama] = useState('')
  const [yeniDialog, setYeniDialog] = useState(false)

  const { data: projeler = [], isLoading } = useProjeler({
    arama: arama || undefined,
  })
  const olustur = useProjeOlustur()
  const olusturabilir = useIzin('proje.olustur')

  async function yeniGonder(veri: ProjeOlusturIstek) {
    try {
      await olustur.mutateAsync(veri)
      toast.success('Proje oluşturuldu')
      setYeniDialog(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Oluşturma başarısız')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Proje ara…"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="pl-9"
          />
        </div>

        {olusturabilir && (
          <>
            <Button onClick={() => setYeniDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Proje
            </Button>
            <Dialog open={yeniDialog} onOpenChange={setYeniDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Proje Oluştur</DialogTitle>
                </DialogHeader>
                <ProjeForm yukleniyor={olustur.isPending} onGonder={yeniGonder} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <DataTable columns={sutunlar} data={isLoading ? [] : projeler} />
    </div>
  )
}
