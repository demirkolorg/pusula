'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Octagon,
  PenLine,
  Pencil,
  Pin,
  PinOff,
  Plus,
  ScrollText,
  Trash2,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  useDerkenarlar,
  useDerkenarOlustur,
  useDerkenarGuncelle,
  useDerkenarSil,
  type DerkenarItem,
  type DerkenarTipKodu,
} from '../../hooks/use-derkenarlar'
import { DERKENAR_TIPLERI } from '../../derkenar-schemas'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useIzin } from '@/hooks/use-permission'

const TIP_BILGISI: Record<
  DerkenarTipKodu,
  { etiket: string; ikon: typeof Info; renk: string }
> = {
  KARAR: {
    etiket: 'Karar',
    ikon: ScrollText,
    renk: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  UYARI: {
    etiket: 'Uyarı',
    ikon: AlertTriangle,
    renk:
      'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
  },
  ENGEL: {
    etiket: 'Engel',
    ikon: Octagon,
    renk: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
  },
  BILGI: {
    etiket: 'Bilgi',
    ikon: Info,
    renk:
      'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  NOT: {
    etiket: 'Not',
    ikon: PenLine,
    renk: 'border-muted-foreground/30 bg-muted/30 text-foreground',
  },
}

function bashHarfleri(ad: string): string {
  return ad
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function zamanFormatla(tarih: string): string {
  const d = new Date(tarih)
  const fark = Date.now() - d.getTime()
  const dakika = Math.floor(fark / 60000)
  if (dakika < 1) return 'az önce'
  if (dakika < 60) return `${dakika}dk önce`
  const saat = Math.floor(dakika / 60)
  if (saat < 24) return `${saat}sa önce`
  const gun = Math.floor(saat / 24)
  if (gun < 7) return `${gun}g önce`
  return d.toLocaleDateString('tr-TR')
}

function DerkenarKart({
  derkenar,
  gorevId,
  benimMi,
  sabitleyebilir,
}: {
  derkenar: DerkenarItem
  gorevId: string
  benimMi: boolean
  sabitleyebilir: boolean
}) {
  const guncelle = useDerkenarGuncelle(gorevId, derkenar.id)
  const sil = useDerkenarSil(gorevId)
  const tipBilgi = TIP_BILGISI[derkenar.tip]
  const Ikon = tipBilgi.ikon

  async function sabitleToggle() {
    try {
      await guncelle.mutateAsync({ sabitlendi: !derkenar.sabitlendi })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncellenemedi')
    }
  }

  async function cozumToggle() {
    try {
      await guncelle.mutateAsync({ cozuldu: !derkenar.cozuldu })
      toast.success(derkenar.cozuldu ? 'Engel yeniden açıldı' : 'Engel çözüldü')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncellenemedi')
    }
  }

  async function silOnayla() {
    if (!confirm('Derkenarı silmek istediğinize emin misiniz?')) return
    try {
      await sil.mutateAsync(derkenar.id)
      toast.success('Derkenar silindi')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Silinemedi')
    }
  }

  return (
    <div className={`rounded-md border ${tipBilgi.renk} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ikon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {tipBilgi.etiket}
          </span>
          {derkenar.sabitlendi && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Pin className="h-2.5 w-2.5" /> Sabit
            </Badge>
          )}
          {derkenar.tip === 'ENGEL' && derkenar.cozuldu && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <CheckCircle2 className="h-2.5 w-2.5" /> Çözüldü
            </Badge>
          )}
          {derkenar.surum > 1 && (
            <span className="text-[10px] text-muted-foreground">
              v{derkenar.surum}
            </span>
          )}
        </div>
      </div>

      {derkenar.baslik && (
        <div className="mt-2 text-sm font-semibold">{derkenar.baslik}</div>
      )}
      <div className="mt-1 text-sm whitespace-pre-wrap text-foreground">
        {derkenar.icerik}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-current/10 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px]">
              {bashHarfleri(derkenar.yazar.name)}
            </AvatarFallback>
          </Avatar>
          <span>{derkenar.yazar.name}</span>
          <span>·</span>
          <span>{zamanFormatla(derkenar.olusturmaTarihi)}</span>
        </div>
        <div className="flex gap-0.5">
          {derkenar.tip === 'ENGEL' && (
            <Button variant="ghost" size="icon-xs" onClick={cozumToggle}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="sr-only">
                {derkenar.cozuldu ? 'Yeniden Aç' : 'Çözüldü'}
              </span>
            </Button>
          )}
          {sabitleyebilir && (
            <Button variant="ghost" size="icon-xs" onClick={sabitleToggle}>
              {derkenar.sabitlendi ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">
                {derkenar.sabitlendi ? 'Sabit Kaldır' : 'Sabitle'}
              </span>
            </Button>
          )}
          {benimMi && (
            <>
              <Button variant="ghost" size="icon-xs">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-destructive hover:text-destructive"
                onClick={silOnayla}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function YeniDerkenarDialog({
  acik,
  onAcikDegisti,
  gorevId,
}: {
  acik: boolean
  onAcikDegisti: (a: boolean) => void
  gorevId: string
}) {
  const olustur = useDerkenarOlustur(gorevId)
  const sabitleyebilir = useIzin('derkenar.sabitle')
  const [tip, setTip] = useState<DerkenarTipKodu>('NOT')
  const [baslik, setBaslik] = useState('')
  const [icerik, setIcerik] = useState('')
  const [sabit, setSabit] = useState(false)

  function sifirla() {
    setTip('NOT')
    setBaslik('')
    setIcerik('')
    setSabit(false)
  }

  async function gonder() {
    if (!icerik.trim()) {
      toast.error('İçerik boş olamaz')
      return
    }
    try {
      await olustur.mutateAsync({
        tip,
        baslik: baslik.trim() || null,
        icerik: icerik.trim(),
        sabitlendi: sabit,
      })
      toast.success('Derkenar eklendi')
      sifirla()
      onAcikDegisti(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Eklenemedi')
    }
  }

  return (
    <Dialog open={acik} onOpenChange={onAcikDegisti}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Derkenar</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tip</Label>
            <Select
              value={tip}
              onValueChange={(v) => v && setTip(v as DerkenarTipKodu)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DERKENAR_TIPLERI.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIP_BILGISI[t].etiket}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-baslik">Başlık (opsiyonel)</Label>
            <Input
              id="d-baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Kısa başlık"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-icerik">İçerik *</Label>
            <Textarea
              id="d-icerik"
              rows={5}
              value={icerik}
              onChange={(e) => setIcerik(e.target.value)}
              placeholder="Derkenar içeriği"
            />
          </div>

          {sabitleyebilir && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sabit}
                onChange={(e) => setSabit(e.target.checked)}
              />
              Sabitle (üst sırada göster)
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onAcikDegisti(false)}>
            Vazgeç
          </Button>
          <Button disabled={olustur.isPending || !icerik.trim()} onClick={gonder}>
            {olustur.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DerkenarSekmesi({ gorevId }: { gorevId: string }) {
  const { kullanici } = useCurrentUser()
  const { data: derkenarlar = [], isLoading } = useDerkenarlar(gorevId)
  const olusturabilir = useIzin('derkenar.olustur')
  const sabitleyebilir = useIzin('derkenar.sabitle')
  const [yeniAcik, setYeniAcik] = useState(false)

  return (
    <div className="space-y-3">
      {olusturabilir && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setYeniAcik(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Yeni Derkenar
        </Button>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground">Derkenarlar yükleniyor…</div>
      )}

      {!isLoading && derkenarlar.length === 0 && (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Henüz derkenar yok
        </div>
      )}

      {derkenarlar.map((d) => (
        <DerkenarKart
          key={d.id}
          derkenar={d}
          gorevId={gorevId}
          benimMi={kullanici?.id === d.yazar.id}
          sabitleyebilir={!!sabitleyebilir}
        />
      ))}

      <YeniDerkenarDialog
        acik={yeniAcik}
        onAcikDegisti={setYeniAcik}
        gorevId={gorevId}
      />
    </div>
  )
}
