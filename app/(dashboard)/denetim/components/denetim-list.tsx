'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDenetimKayitlari } from '../hooks/use-denetim'

const EYLEM_VARYANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  OLUSTUR: 'default',
  GUNCELLE: 'secondary',
  SIL: 'destructive',
  ARSIVLE: 'destructive',
  ONAYA_SUN: 'secondary',
  ONAYLA: 'default',
  REDDET: 'destructive',
}

const EYLEM_ETIKETI: Record<string, string> = {
  OLUSTUR: 'Oluşturuldu',
  GUNCELLE: 'Güncellendi',
  SIL: 'Silindi',
  ARSIVLE: 'Arşivlendi',
  ONAYA_SUN: 'Onaya Sunuldu',
  ONAYLA: 'Onaylandı',
  REDDET: 'Reddedildi',
}

export function DenetimList() {
  const [model, setModel] = useState<string>('TUMU')
  const [eylem, setEylem] = useState<string>('TUMU')
  const [sayfa, setSayfa] = useState(1)
  const sayfaBoyutu = 50

  const { data, isLoading } = useDenetimKayitlari({
    model: model === 'TUMU' ? undefined : model,
    eylem: eylem === 'TUMU' ? undefined : eylem,
    sayfa,
    sayfaBoyutu,
  })

  const kayitlar = data?.kayitlar ?? []
  const toplam = data?.toplam ?? 0
  const sonSayfa = Math.max(1, Math.ceil(toplam / sayfaBoyutu))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Model</label>
          <Select value={model} onValueChange={(v) => v && setModel(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TUMU">Tüm modeller</SelectItem>
              <SelectItem value="Proje">Proje</SelectItem>
              <SelectItem value="Gorev">Görev</SelectItem>
              <SelectItem value="Yorum">Yorum</SelectItem>
              <SelectItem value="Derkenar">Derkenar</SelectItem>
              <SelectItem value="Birim">Birim</SelectItem>
              <SelectItem value="User">Kullanıcı</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Eylem</label>
          <Select value={eylem} onValueChange={(v) => v && setEylem(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TUMU">Tüm eylemler</SelectItem>
              {Object.entries(EYLEM_ETIKETI).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {isLoading ? 'Yükleniyor…' : `${toplam} kayıt`}
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Tarih</th>
              <th className="px-3 py-2 font-medium">Eyleyen</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium">Eylem</th>
              <th className="px-3 py-2 font-medium">Kayıt</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && kayitlar.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {kayitlar.map((k) => (
              <tr key={k.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-2 align-top whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(k.tarih).toLocaleString('tr-TR')}
                </td>
                <td className="px-3 py-2 align-top">
                  {k.eyleyen ? (
                    <div>
                      <div className="font-medium">{k.eyleyen.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {k.eyleyen.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <Badge variant="outline">{k.model}</Badge>
                </td>
                <td className="px-3 py-2 align-top">
                  <Badge variant={EYLEM_VARYANT[k.eylem] ?? 'outline'}>
                    {EYLEM_ETIKETI[k.eylem] ?? k.eylem}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-top">
                  <code className="font-mono text-xs text-muted-foreground">
                    {k.modelKimlik.slice(0, 8)}…
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Sayfa {sayfa} / {sonSayfa}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={sayfa <= 1}
            onClick={() => setSayfa((s) => Math.max(1, s - 1))}
          >
            Önceki
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={sayfa >= sonSayfa}
            onClick={() => setSayfa((s) => Math.min(sonSayfa, s + 1))}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  )
}
