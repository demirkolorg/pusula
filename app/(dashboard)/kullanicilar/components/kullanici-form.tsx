'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { kullaniciOlusturSchema, type KullaniciOlusturIstek } from '../schemas'
import { useBirimlerSelect } from '@/hooks/use-birimler-select'
import type { KullaniciListeItem } from '../api'

const ROL_ETIKETLERI: Record<string, string> = {
  YONETICI: 'Yönetici',
  BIRIM_MUDURU: 'Birim Müdürü',
  PERSONEL: 'Personel',
}

type Props = {
  varsayilan?: Partial<KullaniciListeItem>
  yukleniyor: boolean
  onGonder: (veri: KullaniciOlusturIstek) => void
  duzenleModu?: boolean
}

export function KullaniciForm({ varsayilan, yukleniyor, onGonder, duzenleModu = false }: Props) {
  const { data: birimler = [] } = useBirimlerSelect()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<KullaniciOlusturIstek>({
    resolver: zodResolver(kullaniciOlusturSchema),
    defaultValues: {
      name: varsayilan?.name ?? '',
      email: varsayilan?.email ?? '',
      password: '',
      rol: (varsayilan?.rol as KullaniciOlusturIstek['rol']) ?? 'PERSONEL',
      birimId: varsayilan?.birimId ?? undefined,
    },
  })

  useEffect(() => {
    if (varsayilan) {
      reset({
        name: varsayilan.name ?? '',
        email: varsayilan.email ?? '',
        password: '',
        rol: (varsayilan.rol as KullaniciOlusturIstek['rol']) ?? 'PERSONEL',
        birimId: varsayilan.birimId ?? undefined,
      })
    }
  }, [varsayilan, reset])

  const seciliRol = watch('rol')
  const seciliBirimId = watch('birimId')

  return (
    <form onSubmit={handleSubmit(onGonder)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Ad Soyad *</Label>
        <Input id="name" {...register('name')} placeholder="Örn: Ahmet Yılmaz" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta *</Label>
        <Input id="email" type="email" {...register('email')} placeholder="ornek@kurum.gov.tr" disabled={duzenleModu} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {!duzenleModu && (
        <div className="space-y-1.5">
          <Label htmlFor="password">Parola *</Label>
          <Input id="password" type="password" {...register('password')} placeholder="En az 12 karakter" />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Rol *</Label>
        <Select
          value={seciliRol}
          onValueChange={(val) => val && setValue('rol', val as KullaniciOlusturIstek['rol'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROL_ETIKETLERI).map(([deger, etiket]) => (
              <SelectItem key={deger} value={deger}>
                {etiket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Birim</Label>
        <Select
          value={seciliBirimId ?? ''}
          onValueChange={(val) => setValue('birimId', !val || val === 'YOK' ? undefined : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seçiniz (opsiyonel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="YOK">— Yok —</SelectItem>
            {birimler.map((b) => (
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
