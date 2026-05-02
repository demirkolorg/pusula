import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli } from '@/lib/permissions'
import { birimServisi } from '@/app/(dashboard)/birimler/services'
import { birimOlusturSchema } from '@/app/(dashboard)/birimler/schemas'
import type { Rol } from '@/types/enums'

async function oturumAl() {
  const oturum = await auth.api.getSession({ headers: await headers() })
  if (!oturum) return null
  return { id: oturum.user.id, rol: (oturum.user as unknown as { rol: Rol }).rol }
}

export async function GET(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const arama = istek.nextUrl.searchParams.get('arama') ?? undefined
  const birimler = await birimServisi.listele(arama)
  return NextResponse.json({ basarili: true, veri: birimler })
}

export async function POST(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'birim.olustur')

  const govde = await istek.json().catch(() => null)
  const sonuc = birimOlusturSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json({ hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues }, { status: 400 })
  }

  const birim = await birimServisi.olustur(sonuc.data)
  return NextResponse.json({ basarili: true, veri: birim }, { status: 201 })
}
