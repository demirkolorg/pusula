'use server'

import { auth } from '@/lib/auth'
import { APIError } from 'better-auth/api'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { girisSchema } from './schemas'

export async function girisYap(
  _oncekiDurum: { hata?: string } | null,
  formVerisi: FormData,
): Promise<{ hata: string }> {
  const ham = {
    eposta: formVerisi.get('eposta'),
    parola: formVerisi.get('parola'),
  }

  const sonuc = girisSchema.safeParse(ham)
  if (!sonuc.success) {
    return { hata: sonuc.error.issues[0].message }
  }

  try {
    // nextCookies() plugin'i Set-Cookie header'larını otomatik
    // Next.js cookie store'una aktarır.
    await auth.api.signInEmail({
      body: { email: sonuc.data.eposta, password: sonuc.data.parola },
      headers: await headers(),
    })
  } catch (hataDeger) {
    if (hataDeger instanceof APIError) {
      return { hata: 'E-posta veya parola hatalı' }
    }
    throw hataDeger
  }

  redirect('/ana-sayfa')
}

export async function cikisYap(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() })
  } catch {
    // sessizce devam — yine de /giris'e yönlendir
  }

  redirect('/giris')
}
