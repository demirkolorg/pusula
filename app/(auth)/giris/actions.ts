'use server'

import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
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

  let yanit: Response
  try {
    yanit = await auth.api.signInEmail({
      body: { email: sonuc.data.eposta, password: sonuc.data.parola },
      headers: await headers(),
      asResponse: true,
    })
  } catch {
    return { hata: 'E-posta veya parola hatalı' }
  }

  if (!yanit.ok) {
    return { hata: 'E-posta veya parola hatalı' }
  }

  const cookieDepo = await cookies()
  yanit.headers.getSetCookie().forEach((ham) => {
    const parcalar = ham.split(';').map((s) => s.trim())
    const ilk = parcalar[0]
    // İlk '=' işaretinde böl — değer içinde '=' olabilir (base64)
    const esitIdx = ilk.indexOf('=')
    const ad = ilk.substring(0, esitIdx)
    const deger = ilk.substring(esitIdx + 1)

    const secenekler: Parameters<typeof cookieDepo.set>[2] = { path: '/' }
    parcalar.slice(1).forEach((p) => {
      const alt = p.toLowerCase()
      if (alt === 'httponly') secenekler.httpOnly = true
      else if (alt === 'secure') secenekler.secure = true
      else if (alt.startsWith('samesite=')) secenekler.sameSite = p.split('=')[1] as 'lax' | 'strict' | 'none'
      else if (alt.startsWith('max-age=')) secenekler.maxAge = parseInt(p.split('=')[1])
      else if (alt.startsWith('path=')) secenekler.path = p.split('=')[1]
      else if (alt.startsWith('expires=')) secenekler.expires = new Date(p.substring(8))
    })

    cookieDepo.set(ad, deger, secenekler)
  })

  redirect('/ana-sayfa')
}
