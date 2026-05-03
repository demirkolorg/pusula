'use client'

import { useState } from 'react'
import { Trash2, Pencil, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  useYorumlar,
  useYorumOlustur,
  useYorumGuncelle,
  useYorumSil,
  type YorumItem,
} from '../../hooks/use-yorumlar'
import { useCurrentUser } from '@/hooks/use-current-user'

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

function YorumSatiri({
  yorum,
  gorevId,
  benimMi,
}: {
  yorum: YorumItem
  gorevId: string
  benimMi: boolean
}) {
  const [duzenleMod, setDuzenleMod] = useState(false)
  const [icerik, setIcerik] = useState(yorum.icerik)
  const guncelle = useYorumGuncelle(gorevId, yorum.id)
  const sil = useYorumSil(gorevId)

  async function kaydet() {
    if (!icerik.trim()) return
    try {
      await guncelle.mutateAsync({ icerik })
      toast.success('Yorum güncellendi')
      setDuzenleMod(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Güncellenemedi')
    }
  }

  async function silOnayla() {
    if (!confirm('Yorumu silmek istediğinize emin misiniz?')) return
    try {
      await sil.mutateAsync(yorum.id)
      toast.success('Yorum silindi')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Silinemedi')
    }
  }

  return (
    <div className="flex gap-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs">{bashHarfleri(yorum.yazar.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium">{yorum.yazar.name}</span>
          <span className="text-muted-foreground">{zamanFormatla(yorum.olusturmaTarihi)}</span>
          {yorum.guncellemeTarihi !== yorum.olusturmaTarihi && (
            <span className="text-muted-foreground">(düzenlendi)</span>
          )}
        </div>

        {duzenleMod ? (
          <div className="space-y-2">
            <Textarea
              rows={2}
              value={icerik}
              onChange={(e) => setIcerik(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={guncelle.isPending} onClick={kaydet}>
                Kaydet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIcerik(yorum.icerik)
                  setDuzenleMod(false)
                }}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap">
            {yorum.icerik}
          </div>
        )}

        {benimMi && !duzenleMod && (
          <div className="flex gap-1">
            <Button variant="ghost" size="xs" onClick={() => setDuzenleMod(true)}>
              <Pencil className="mr-1 h-3 w-3" /> Düzenle
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="text-destructive hover:text-destructive"
              onClick={silOnayla}
            >
              <Trash2 className="mr-1 h-3 w-3" /> Sil
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function YorumSekmesi({ gorevId }: { gorevId: string }) {
  const { kullanici } = useCurrentUser()
  const { data: yorumlar = [], isLoading } = useYorumlar(gorevId)
  const olustur = useYorumOlustur(gorevId)
  const [yeni, setYeni] = useState('')

  async function gonder() {
    if (!yeni.trim()) return
    try {
      await olustur.mutateAsync({ icerik: yeni.trim() })
      setYeni('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Yorum eklenemedi')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        {isLoading && <div className="text-sm text-muted-foreground">Yorumlar yükleniyor…</div>}
        {!isLoading && yorumlar.length === 0 && (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Henüz yorum yok
          </div>
        )}
        {yorumlar.map((y) => (
          <YorumSatiri
            key={y.id}
            yorum={y}
            gorevId={gorevId}
            benimMi={kullanici?.id === y.yazar.id}
          />
        ))}
      </div>

      <div className="space-y-2 border-t pt-3">
        <Textarea
          rows={2}
          value={yeni}
          onChange={(e) => setYeni(e.target.value)}
          placeholder="Yorum yazın…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              gonder()
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘+Enter ile gönder</span>
          <Button size="sm" disabled={!yeni.trim() || olustur.isPending} onClick={gonder}>
            <Send className="mr-1 h-3.5 w-3.5" />
            Gönder
          </Button>
        </div>
      </div>
    </div>
  )
}
