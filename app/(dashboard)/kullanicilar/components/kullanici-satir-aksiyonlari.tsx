'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, ShieldOff, Trash2 } from 'lucide-react'
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
import { KullaniciForm } from './kullanici-form'
import {
  useKullaniciGuncelle,
  useKullaniciDevreDisiBırak,
  useKullaniciSil,
} from '../hooks/use-kullanicilar'
import type { KullaniciListeItem } from '../api'
import type { KullaniciOlusturIstek } from '../schemas'

export function KullaniciSatirAksiyonlari({ kullanici }: { kullanici: KullaniciListeItem }) {
  const [duzenleModu, setDuzenleModu] = useState(false)
  const [devreDisiOnay, setDevreDisiOnay] = useState(false)
  const [silOnay, setSilOnay] = useState(false)

  const guncelle = useKullaniciGuncelle(kullanici.id)
  const devreDisiBırak = useKullaniciDevreDisiBırak()
  const sil = useKullaniciSil()

  async function duzenleGonder(veri: KullaniciOlusturIstek) {
    const { password: _, ...guncellemeVerisi } = veri
    try {
      await guncelle.mutateAsync(guncellemeVerisi)
      toast.success('Kullanıcı güncellendi')
      setDuzenleModu(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncelleme başarısız')
    }
  }

  async function devreDisiBırakOnayla() {
    try {
      await devreDisiBırak.mutateAsync(kullanici.id)
      toast.success('Kullanıcı devre dışı bırakıldı')
      setDevreDisiOnay(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'İşlem başarısız')
    }
  }

  async function silOnayla() {
    try {
      await sil.mutateAsync(kullanici.id)
      toast.success('Kullanıcı silindi')
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
          {kullanici.aktif && (
            <DropdownMenuItem onClick={() => setDevreDisiOnay(true)}>
              <ShieldOff className="mr-2 h-4 w-4" />
              Devre Dışı Bırak
            </DropdownMenuItem>
          )}
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
            <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
          </DialogHeader>
          <KullaniciForm
            varsayilan={kullanici}
            yukleniyor={guncelle.isPending}
            onGonder={duzenleGonder}
            duzenleModu
          />
        </DialogContent>
      </Dialog>

      <Dialog open={devreDisiOnay} onOpenChange={setDevreDisiOnay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devre Dışı Bırak</DialogTitle>
            <DialogDescription>
              <strong>{kullanici.name}</strong> kullanıcısı sisteme giremeyecek.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevreDisiOnay(false)}>Vazgeç</Button>
            <Button variant="destructive" disabled={devreDisiBırak.isPending} onClick={devreDisiBırakOnayla}>
              {devreDisiBırak.isPending ? 'İşleniyor…' : 'Devre Dışı Bırak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={silOnay} onOpenChange={setSilOnay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
            <DialogDescription>
              <strong>{kullanici.name}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSilOnay(false)}>Vazgeç</Button>
            <Button variant="destructive" disabled={sil.isPending} onClick={silOnayla}>
              {sil.isPending ? 'Siliniyor…' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
