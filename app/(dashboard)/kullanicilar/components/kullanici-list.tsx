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
import { KullaniciForm } from './kullanici-form'
import { KullaniciSatirAksiyonlari } from './kullanici-satir-aksiyonlari'
import { useKullanicilar, useKullaniciOlustur } from '../hooks/use-kullanicilar'
import type { KullaniciListeItem } from '../api'
import type { KullaniciOlusturIstek } from '../schemas'
import { useIzin } from '@/hooks/use-permission'

const ROL_RENK: Record<string, 'default' | 'secondary' | 'outline'> = {
  YONETICI: 'default',
  BIRIM_MUDURU: 'secondary',
  PERSONEL: 'outline',
}

const ROL_ETIKET: Record<string, string> = {
  YONETICI: 'Yönetici',
  BIRIM_MUDURU: 'Birim Müdürü',
  PERSONEL: 'Personel',
}

const sutunlar: ColumnDef<KullaniciListeItem>[] = [
  {
    accessorKey: 'name',
    header: 'Ad Soyad',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'email',
    header: 'E-posta',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: 'rol',
    header: 'Rol',
    cell: ({ row }) => (
      <Badge variant={ROL_RENK[row.original.rol] ?? 'outline'}>
        {ROL_ETIKET[row.original.rol] ?? row.original.rol}
      </Badge>
    ),
  },
  {
    accessorKey: 'birim',
    header: 'Birim',
    cell: ({ row }) =>
      row.original.birim ? (
        <span className="text-muted-foreground">{row.original.birim.ad}</span>
      ) : (
        <span className="text-muted-foreground/50">—</span>
      ),
  },
  {
    accessorKey: 'aktif',
    header: 'Durum',
    cell: ({ row }) => (
      <Badge variant={row.original.aktif ? 'default' : 'secondary'}>
        {row.original.aktif ? 'Aktif' : 'Pasif'}
      </Badge>
    ),
  },
  {
    id: 'aksiyonlar',
    header: '',
    cell: ({ row }) => <KullaniciSatirAksiyonlari kullanici={row.original} />,
  },
]

export function KullaniciList() {
  const [arama, setArama] = useState('')
  const [yeniDialog, setYeniDialog] = useState(false)

  const { data: kullanicilar = [], isLoading } = useKullanicilar(arama || undefined)
  const olustur = useKullaniciOlustur()
  const olusturabilir = useIzin('kullanici.olustur')

  async function yeniGonder(veri: KullaniciOlusturIstek) {
    try {
      await olustur.mutateAsync(veri)
      toast.success('Kullanıcı oluşturuldu')
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
            placeholder="Kullanıcı ara…"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="pl-9"
          />
        </div>

        {olusturabilir && (
          <>
            <Button onClick={() => setYeniDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
            <Dialog open={yeniDialog} onOpenChange={setYeniDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
                </DialogHeader>
                <KullaniciForm yukleniyor={olustur.isPending} onGonder={yeniGonder} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <DataTable columns={sutunlar} data={isLoading ? [] : kullanicilar} />
    </div>
  )
}
