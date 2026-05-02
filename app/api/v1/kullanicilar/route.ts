import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli } from '@/lib/permissions'
import { kullaniciServisi } from '@/app/(dashboard)/kullanicilar/services'
import { kullaniciOlusturSchema } from '@/app/(dashboard)/kullanicilar/schemas'
import type { Rol } from '@/types/enums'

async function oturumAl() {
  const oturum = await auth.api.getSession({ headers: await headers() })
  if (!oturum) return null
  return { id: oturum.user.id, rol: (oturum.user as unknown as { rol: Rol }).rol }
}

export async function GET(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const params = istek.nextUrl.searchParams
  const arama = params.get('arama') ?? undefined
  const birimId = params.get('birimId') ?? undefined

  const kullanicilar = await kullaniciServisi.listele(arama, birimId)
  return NextResponse.json({ basarili: true, veri: kullanicilar })
}

export async function POST(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'kullanici.olustur')

  const govde = await istek.json().catch(() => null)
  const sonuc = kullaniciOlusturSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json({ hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues }, { status: 400 })
  }

  try {
    const yeniKullanici = await kullaniciServisi.olustur(sonuc.data)
    return NextResponse.json({ basarili: true, veri: yeniKullanici }, { status: 201 })
  } catch (hata) {
    if (hata instanceof Error) return NextResponse.json({ hata: hata.message }, { status: 422 })
    return NextResponse.json({ hata: 'SUNUCU_HATASI' }, { status: 500 })
  }
}
