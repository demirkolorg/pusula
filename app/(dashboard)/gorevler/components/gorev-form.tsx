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
import {
  gorevOlusturSchema,
  ONCELIK_DUZEYLERI,
  type GorevOlusturIstek,
} from '../schemas'
import { useProjelerSelect } from '@/app/(dashboard)/projeler/hooks/use-projeler'
import { useKullanicilar } from '@/app/(dashboard)/kullanicilar/hooks/use-kullanicilar'
import type { GorevListeItem } from '../api'

const ONCELIK_ETIKETI: Record<(typeof ONCELIK_DUZEYLERI)[number], string> = {
  DUSUK: 'Düşük',
  ORTA: 'Orta',
  YUKSEK: 'Yüksek',
  KRITIK: 'Kritik',
}

type Props = {
  varsayilan?: Partial<GorevListeItem>
  yukleniyor: boolean
  onGonder: (veri: GorevOlusturIstek) => void
  projeSabit?: string | null
}

function tariheCevir(tarih: string | null | undefined): string {
  if (!tarih) return ''
  return tarih.slice(0, 10)
}

export function GorevForm({ varsayilan, yukleniyor, onGonder, projeSabit }: Props) {
  const { data: projeler = [] } = useProjelerSelect()
  const { data: kullanicilar = [] } = useKullanicilar()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GorevOlusturIstek>({
    resolver: zodResolver(gorevOlusturSchema),
    defaultValues: {
      baslik: varsayilan?.baslik ?? '',
      aciklama: varsayilan?.aciklama ?? '',
      projeId: varsayilan?.projeId ?? projeSabit ?? '',
      atananId: varsayilan?.atananId ?? null,
      oncelik: varsayilan?.oncelik ?? 'ORTA',
      baslangicTarihi: varsayilan?.baslangicTarihi
        ? new Date(varsayilan.baslangicTarihi)
        : null,
      bitisTarihi: varsayilan?.bitisTarihi ? new Date(varsayilan.bitisTarihi) : null,
    },
  })

  useEffect(() => {
    if (varsayilan) {
      reset({
        baslik: varsayilan.baslik ?? '',
        aciklama: varsayilan.aciklama ?? '',
        projeId: varsayilan.projeId ?? projeSabit ?? '',
        atananId: varsayilan.atananId ?? null,
        oncelik: varsayilan.oncelik ?? 'ORTA',
        baslangicTarihi: varsayilan.baslangicTarihi
          ? new Date(varsayilan.baslangicTarihi)
          : null,
        bitisTarihi: varsayilan.bitisTarihi ? new Date(varsayilan.bitisTarihi) : null,
      })
    }
  }, [varsayilan, projeSabit, reset])

  const seciliProje = watch('projeId')
  const seciliAtanan = watch('atananId')
  const seciliOncelik = watch('oncelik')

  return (
    <form onSubmit={handleSubmit(onGonder)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="baslik">Başlık *</Label>
        <Input
          id="baslik"
          {...register('baslik')}
          placeholder="Örn: Bayram töreni hazırlığı"
        />
        {errors.baslik && (
          <p className="text-sm text-destructive">{errors.baslik.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aciklama">Açıklama</Label>
        <Textarea
          id="aciklama"
          {...register('aciklama')}
          rows={3}
          placeholder="Görev detayları"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Proje *</Label>
          <Select
            value={seciliProje ?? ''}
            onValueChange={(val) =>
              setValue('projeId', val ?? '', { shouldValidate: true })
            }
            disabled={!!projeSabit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Proje seçin" />
            </SelectTrigger>
            <SelectContent>
              {projeler.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projeId && (
            <p className="text-sm text-destructive">{errors.projeId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Öncelik</Label>
          <Select
            value={seciliOncelik ?? 'ORTA'}
            onValueChange={(val) =>
              setValue('oncelik', (val ?? 'ORTA') as (typeof ONCELIK_DUZEYLERI)[number])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ONCELIK_DUZEYLERI.map((o) => (
                <SelectItem key={o} value={o}>
                  {ONCELIK_ETIKETI[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Atanan</Label>
        <Select
          value={seciliAtanan ?? 'YOK'}
          onValueChange={(val) =>
            setValue('atananId', !val || val === 'YOK' ? null : val)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Kişi seçin (opsiyonel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="YOK">— Atanmamış —</SelectItem>
            {kullanicilar.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.name} ({k.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
