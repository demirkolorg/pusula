'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table/data-table'
import { toast } from 'sonner'
import { BirimForm } from './birim-form'
import { BirimSatirAksiyonlari } from './birim-satir-aksiyonlari'
import { useBirimler, useBirimOlustur } from '../hooks/use-birimler'
import type { BirimListeItem } from '../api'
import type { BirimOlusturIstek } from '../schemas'
import { useIzin } from '@/hooks/use-permission'

const sutunlar: ColumnDef<BirimListeItem>[] = [
  {
    accessorKey: 'ad',
    header: 'Birim Adı',
    cell: ({ row }) => <span className="font-medium">{row.original.ad}</span>,
  },
  {
    accessorKey: 'ustBirim',
    header: 'Üst Birim',
    cell: ({ row }) =>
      row.original.ustBirim ? (
        <span className="text-muted-foreground">{row.original.ustBirim.ad}</span>
      ) : (
        <span className="text-muted-foreground/50">—</span>
      ),
  },
  {
    id: 'kullanicilar',
    header: 'Kullanıcılar',
    cell: ({ row }) => <Badge variant="secondary">{row.original._count.kullanicilar}</Badge>,
  },
  {
    id: 'altBirimler',
    header: 'Alt Birimler',
    cell: ({ row }) => <Badge variant="outline">{row.original._count.altBirimler}</Badge>,
  },
  {
    id: 'aksiyonlar',
    header: '',
    cell: ({ row }) => <BirimSatirAksiyonlari birim={row.original} />,
  },
]

export function BirimList() {
  const [arama, setArama] = useState('')
  const [yeniDialog, setYeniDialog] = useState(false)

  const { data: birimler = [], isLoading } = useBirimler(arama || undefined)
  const olustur = useBirimOlustur()
  const olusturabilir = useIzin('birim.olustur')

  async function yeniGonder(veri: BirimOlusturIstek) {
    try {
      await olustur.mutateAsync(veri)
      toast.success('Birim oluşturuldu')
      setYeniDialog(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Oluşturma başarısız')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Birim ara…"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="pl-9"
          />
        </div>

        {olusturabilir && (
          <>
            <Button onClick={() => setYeniDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Birim
            </Button>
            <Dialog open={yeniDialog} onOpenChange={setYeniDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Birim Oluştur</DialogTitle>
                </DialogHeader>
                <BirimForm yukleniyor={olustur.isPending} onGonder={yeniGonder} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <DataTable columns={sutunlar} data={isLoading ? [] : birimler} />
    </div>
  )
}
