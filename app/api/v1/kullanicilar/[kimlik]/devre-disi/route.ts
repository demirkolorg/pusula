import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli } from '@/lib/permissions'
import { kullaniciServisi } from '@/app/(dashboard)/kullanicilar/services'
import type { Rol } from '@/types/enums'

async function oturumAl() {
  const oturum = await auth.api.getSession({ headers: await headers() })
  if (!oturum) return null
  return { id: oturum.user.id, rol: (oturum.user as unknown as { rol: Rol }).rol }
}

type Params = { params: Promise<{ kimlik: string }> }

export async function PATCH(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'kullanici.duzenle')

  const { kimlik } = await params
  const guncellendi = await kullaniciServisi.devreDisiBırak(kimlik)
  return NextResponse.json({ basarili: true, veri: guncellendi })
}
