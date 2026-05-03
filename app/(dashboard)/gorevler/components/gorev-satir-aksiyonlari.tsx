'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { GorevForm } from './gorev-form'
import { useGorevGuncelle, useGorevSil } from '../hooks/use-gorevler'
import type { GorevListeItem } from '../api'
import type { GorevOlusturIstek } from '../schemas'

export function GorevSatirAksiyonlari({ gorev }: { gorev: GorevListeItem }) {
  const [duzenleModu, setDuzenleModu] = useState(false)
  const [silOnay, setSilOnay] = useState(false)

  const guncelle = useGorevGuncelle(gorev.id)
  const sil = useGorevSil()

  async function duzenleGonder(veri: GorevOlusturIstek) {
    try {
      await guncelle.mutateAsync(veri)
      toast.success('Görev güncellendi')
      setDuzenleModu(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncelleme başarısız')
    }
  }

  async function silOnayla() {
    try {
      await sil.mutateAsync(gorev.id)
      toast.success('Görev silindi')
      setSilOnay(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Silme başarısız')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">İşlemler</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDuzenleModu(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setSilOnay(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={duzenleModu} onOpenChange={setDuzenleModu}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Görevi Düzenle</DialogTitle>
          </DialogHeader>
          <GorevForm
            varsayilan={gorev}
            yukleniyor={guncelle.isPending}
            onGonder={duzenleGonder}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={silOnay} onOpenChange={setSilOnay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görevi Sil</DialogTitle>
            <DialogDescription>
              <strong>{gorev.baslik}</strong> görevi silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSilOnay(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" disabled={sil.isPending} onClick={silOnayla}>
              {sil.isPending ? 'Siliniyor…' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
