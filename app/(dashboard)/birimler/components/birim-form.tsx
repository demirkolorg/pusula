'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { birimOlusturSchema, type BirimOlusturIstek } from '../schemas'
import { useBirimlerSelect } from '../hooks/use-birimler'
import type { BirimListeItem } from '../api'

type Props = {
  varsayilan?: Partial<BirimListeItem>
  yukleniyor: boolean
  onGonder: (veri: BirimOlusturIstek) => void
  haricKimlik?: string
}

export function BirimForm({ varsayilan, yukleniyor, onGonder, haricKimlik }: Props) {
  const { data: birimler = [] } = useBirimlerSelect()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BirimOlusturIstek>({
    resolver: zodResolver(birimOlusturSchema),
    defaultValues: {
      ad: varsayilan?.ad ?? '',
      aciklama: varsayilan?.aciklama ?? '',
      ustBirimId: varsayilan?.ustBirimId ?? undefined,
    },
  })

  useEffect(() => {
    if (varsayilan) {
      reset({
        ad: varsayilan.ad ?? '',
        aciklama: varsayilan.aciklama ?? '',
        ustBirimId: varsayilan.ustBirimId ?? undefined,
      })
    }
  }, [varsayilan, reset])

  const seciliBirimId = watch('ustBirimId')
  const secenekler = birimler.filter((b) => b.value !== haricKimlik)

  return (
    <form onSubmit={handleSubmit(onGonder)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ad">Birim Adı *</Label>
        <Input id="ad" {...register('ad')} placeholder="Örn: İnsan Kaynakları" />
        {errors.ad && <p className="text-sm text-destructive">{errors.ad.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aciklama">Açıklama</Label>
        <Textarea id="aciklama" {...register('aciklama')} rows={3} placeholder="Opsiyonel açıklama" />
        {errors.aciklama && <p className="text-sm text-destructive">{errors.aciklama.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Üst Birim</Label>
        <Select
          value={seciliBirimId ?? ''}
          onValueChange={(val) => setValue('ustBirimId', !val || val === 'YOK' ? undefined : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seçiniz (opsiyonel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="YOK">— Yok —</SelectItem>
            {secenekler.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={yukleniyor} className="w-full">
        {yukleniyor ? 'Kaydediliyor…' : 'Kaydet'}
      </Button>
    </form>
  )
}
