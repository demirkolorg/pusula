'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, ListChecks } from 'lucide-react'
import Link from 'next/link'
import type { Route } from 'next'
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
import { ProjeForm } from './proje-form'
import { useProjeGuncelle, useProjeSil } from '../hooks/use-projeler'
import type { ProjeListeItem } from '../api'
import type { ProjeOlusturIstek } from '../schemas'

export function ProjeSatirAksiyonlari({ proje }: { proje: ProjeListeItem }) {
  const [duzenleModu, setDuzenleModu] = useState(false)
  const [silOnay, setSilOnay] = useState(false)

  const guncelle = useProjeGuncelle(proje.id)
  const sil = useProjeSil()

  async function duzenleGonder(veri: ProjeOlusturIstek) {
    try {
      await guncelle.mutateAsync(veri)
      toast.success('Proje güncellendi')
      setDuzenleModu(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncelleme başarısız')
    }
  }

  async function silOnayla() {
    try {
      await sil.mutateAsync(proje.id)
      toast.success('Proje arşivlendi')
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
          <DropdownMenuItem
            render={<Link href={`/gorevler?projeId=${proje.id}` as Route} />}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Görevleri
          </DropdownMenuItem>
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
            Arşivle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={duzenleModu} onOpenChange={setDuzenleModu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeyi Düzenle</DialogTitle>
          </DialogHeader>
          <ProjeForm
            varsayilan={proje}
            yukleniyor={guncelle.isPending}
            onGonder={duzenleGonder}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={silOnay} onOpenChange={setSilOnay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeyi Arşivle</DialogTitle>
            <DialogDescription>
              <strong>{proje.ad}</strong> projesi arşive alınacak.
              {proje._count.gorevler > 0 && (
                <span className="mt-1 block text-destructive">
                  Bu projede {proje._count.gorevler} aktif görev var, önce görevleri kapatın.
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
              disabled={sil.isPending || proje._count.gorevler > 0}
              onClick={silOnayla}
            >
              {sil.isPending ? 'Arşivleniyor…' : 'Arşivle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
