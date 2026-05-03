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
import { projeOlusturSchema, type ProjeOlusturIstek } from '../schemas'
import { useBirimlerSelect } from '@/app/(dashboard)/birimler/hooks/use-birimler'
import type { ProjeListeItem } from '../api'

type Props = {
  varsayilan?: Partial<ProjeListeItem>
  yukleniyor: boolean
  onGonder: (veri: ProjeOlusturIstek) => void
  birimSabit?: string | null
}

function tariheCevir(tarih: string | null | undefined): string {
  if (!tarih) return ''
  return tarih.slice(0, 10)
}

export function ProjeForm({ varsayilan, yukleniyor, onGonder, birimSabit }: Props) {
  const { data: birimler = [] } = useBirimlerSelect()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjeOlusturIstek>({
    resolver: zodResolver(projeOlusturSchema),
    defaultValues: {
      ad: varsayilan?.ad ?? '',
      aciklama: varsayilan?.aciklama ?? '',
      birimId: varsayilan?.birimId ?? birimSabit ?? '',
      baslangicTarihi: varsayilan?.baslangicTarihi
        ? new Date(varsayilan.baslangicTarihi)
        : null,
      bitisTarihi: varsayilan?.bitisTarihi ? new Date(varsayilan.bitisTarihi) : null,
    },
  })

  useEffect(() => {
    if (varsayilan) {
      reset({
        ad: varsayilan.ad ?? '',
        aciklama: varsayilan.aciklama ?? '',
        birimId: varsayilan.birimId ?? birimSabit ?? '',
        baslangicTarihi: varsayilan.baslangicTarihi
          ? new Date(varsayilan.baslangicTarihi)
          : null,
        bitisTarihi: varsayilan.bitisTarihi ? new Date(varsayilan.bitisTarihi) : null,
      })
    }
  }, [varsayilan, birimSabit, reset])

  const seciliBirim = watch('birimId')

  return (
    <form onSubmit={handleSubmit(onGonder)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ad">Proje Adı *</Label>
        <Input id="ad" {...register('ad')} placeholder="Örn: 2026 Stratejik Plan" />
        {errors.ad && <p className="text-sm text-destructive">{errors.ad.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aciklama">Açıklama</Label>
        <Textarea
          id="aciklama"
          {...register('aciklama')}
          rows={3}
          placeholder="Projenin amacı ve kapsamı"
        />
        {errors.aciklama && (
          <p className="text-sm text-destructive">{errors.aciklama.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Birim *</Label>
        <Select
          value={seciliBirim ?? ''}
          onValueChange={(val) =>
            setValue('birimId', val ?? '', { shouldValidate: true })
          }
          disabled={!!birimSabit}
        >
          <SelectTrigger>
            <SelectValue placeholder="Birim seçin" />
          </SelectTrigger>
          <SelectContent>
            {birimler.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.birimId && (
          <p className="text-sm text-destructive">{errors.birimId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="baslangicTarihi">Başlangıç</Label>
          <Input
            id="baslangicTarihi"
            type="date"
            defaultValue={tariheCevir(varsayilan?.baslangicTarihi)}
            onChange={(e) =>
              setValue('baslangicTarihi', e.target.value ? new Date(e.target.value) : null)
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bitisTarihi">Bitiş</Label>
          <Input
            id="bitisTarihi"
            type="date"
            defaultValue={tariheCevir(varsayilan?.bitisTarihi)}
            onChange={(e) =>
              setValue('bitisTarihi', e.target.value ? new Date(e.target.value) : null)
            }
          />
        </div>
      </div>

      <Button type="submit" disabled={yukleniyor} className="w-full">
        {yukleniyor ? 'Kaydediliyor…' : 'Kaydet'}
      </Button>
    </form>
  )
}
