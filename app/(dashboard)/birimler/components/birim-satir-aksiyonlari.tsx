'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import { BirimForm } from './birim-form'
import { useBirimGuncelle, useBirimSil } from '../hooks/use-birimler'
import type { BirimListeItem } from '../api'
import type { BirimOlusturIstek } from '../schemas'

export function BirimSatirAksiyonlari({ birim }: { birim: BirimListeItem }) {
  const [duzenleModu, setDuzenleModu] = useState(false)
  const [silOnay, setSilOnay] = useState(false)

  const guncelle = useBirimGuncelle(birim.id)
  const sil = useBirimSil()

  async function duzenleGonder(veri: BirimOlusturIstek) {
    try {
      await guncelle.mutateAsync(veri)
      toast.success('Birim güncellendi')
      setDuzenleModu(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncelleme başarısız')
    }
  }

  async function silOnayla() {
    try {
      await sil.mutateAsync(birim.id)
      toast.success('Birim silindi')
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Birimi Düzenle</DialogTitle>
          </DialogHeader>
          <BirimForm
            varsayilan={birim}
            yukleniyor={guncelle.isPending}
            onGonder={duzenleGonder}
            haricKimlik={birim.id}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={silOnay} onOpenChange={setSilOnay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Birimi Sil</DialogTitle>
            <DialogDescription>
              <strong>{birim.ad}</strong> birimi silinecek. Bu işlem geri alınamaz.
              {birim._count.kullanicilar > 0 && (
                <span className="mt-1 block text-destructive">
                  Bu birimde {birim._count.kullanicilar} aktif kullanıcı var, silinemez.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSilOnay(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              disabled={sil.isPending || birim._count.kullanicilar > 0}
              onClick={silOnayla}
            >
              {sil.isPending ? 'Siliniyor…' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
