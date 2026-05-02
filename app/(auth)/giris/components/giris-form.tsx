'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { girisYap } from '../actions'

function GonderButonu() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Giriş yapılıyor…' : 'Giriş Yap'}
    </Button>
  )
}

export function GirisForm() {
  const [durum, eylem] = useActionState(girisYap, null)

  return (
    <form action={eylem} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="eposta">E-posta</Label>
        <Input
          id="eposta"
          name="eposta"
          type="email"
          autoComplete="email"
          placeholder="ad@kurum.gov.tr"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parola">Parola</Label>
        <Input
          id="parola"
          name="parola"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {durum?.hata && (
        <p className="text-sm text-destructive">{durum.hata}</p>
      )}

      <GonderButonu />
    </form>
  )
}
