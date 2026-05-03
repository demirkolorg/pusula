'use client'

import { useState } from 'react'
import { Check, X, Send, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  useGorevOnayaSun,
  useGorevOnayla,
  useGorevReddet,
} from '../../hooks/use-gorevler'
import { useIzin } from '@/hooks/use-permission'
import { useCurrentUser } from '@/hooks/use-current-user'
import type { GorevDetay } from '../../api'

export function OnayEylemleri({ gorev }: { gorev: GorevDetay }) {
  const { kullanici } = useCurrentUser()
  const onayaSun = useGorevOnayaSun()
  const onayla = useGorevOnayla()
  const reddet = useGorevReddet()

  const onayaSunabilir = useIzin('gorev.onaya_sun')
  const onaylayabilir = useIzin('gorev.onayla')
  const reddebilir = useIzin('gorev.reddet')

  const [redDialog, setRedDialog] = useState(false)
  const [gerekce, setGerekce] = useState('')

  const benimAtanan = kullanici?.id === gorev.atananId
  const benimOlusturan = kullanici?.id === gorev.olusturanId

  const onayaSunGoster =
    onayaSunabilir &&
    (benimAtanan || benimOlusturan) &&
    ['YAPILACAK', 'SURUYOR', 'DUZELTME'].includes(gorev.durum)

  const onayBekliyor = gorev.durum === 'ONAY_BEKLIYOR'
  // Maker-Checker: kendi atandığı görevi onaylayamaz
  const onaylayabilirSimdi = onaylayabilir && onayBekliyor && !benimAtanan
  const reddebilirSimdi = reddebilir && onayBekliyor

  async function onayaSunGonder() {
    try {
      await onayaSun.mutateAsync(gorev.id)
      toast.success('Görev onaya gönderildi')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gönderilemedi')
    }
  }

  async function onaylaGonder() {
    try {
      await onayla.mutateAsync(gorev.id)
      toast.success('Görev onaylandı')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Onaylanamadı')
    }
  }

  async function reddetGonder() {
    if (gerekce.trim().length < 10) {
      toast.error('Gerekçe en az 10 karakter olmalı')
      return
    }
    try {
      await reddet.mutateAsync({ id: gorev.id, gerekce: gerekce.trim() })
      toast.success('Görev düzeltmeye geri gönderildi')
      setRedDialog(false)
      setGerekce('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reddedilemedi')
    }
  }

  // Hiçbir eylem gösterilmiyorsa dön
  if (!onayaSunGoster && !onaylayabilirSimdi && !reddebilirSimdi) {
    // Ama "kendi görevini onaylayamazsın" uyarısı gösterilebilir
    if (onayBekliyor && benimAtanan && onaylayabilir) {
      return (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="font-medium text-amber-900 dark:text-amber-200">
                Yapan-Doğrulayan kuralı
              </div>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                Bu görev size atandı. Kendi görevinizi onaylayamazsınız. Onay için başka
                bir müdüre veya yöneticiye yönlendirin.
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 border-t pt-3">
        {onayaSunGoster && (
          <Button
            size="sm"
            disabled={onayaSun.isPending}
            onClick={onayaSunGonder}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Onaya Sun
          </Button>
        )}
        {onaylayabilirSimdi && (
          <Button
            size="sm"
            disabled={onayla.isPending}
            onClick={onaylaGonder}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Onayla
          </Button>
        )}
        {reddebilirSimdi && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRedDialog(true)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Reddet
          </Button>
        )}
      </div>

      <Dialog open={redDialog} onOpenChange={setRedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görevi Reddet</DialogTitle>
            <DialogDescription>
              Görev: <strong>{gorev.baslik}</strong>
              <br />
              Atanan: {gorev.atanan?.name ?? '—'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reddetme Gerekçesi <span className="text-destructive">*</span>
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (en az 10 karakter)
              </span>
            </label>
            <Textarea
              rows={4}
              value={gerekce}
              onChange={(e) => setGerekce(e.target.value)}
              placeholder="Hangi düzeltmelerin yapılması gerektiğini açıklayın"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bu gerekçe yorum olarak görev kaydına eklenecek</span>
              <span>{gerekce.length} karakter</span>
            </div>
            <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
              Görev durumu: <strong>ONAY_BEKLİYOR</strong> →{' '}
              <strong>DÜZELTME</strong>
              <br />
              {gorev.atanan?.name ?? 'Atanan'} bilgilendirilecek.
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRedDialog(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              disabled={reddet.isPending || gerekce.trim().length < 10}
              onClick={reddetGonder}
            >
              {reddet.isPending ? 'Reddediliyor…' : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
