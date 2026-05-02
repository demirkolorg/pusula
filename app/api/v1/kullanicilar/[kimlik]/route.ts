import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli, IzinHatasi } from '@/lib/permissions'
import { kullaniciServisi } from '@/app/(dashboard)/kullanicilar/services'
import { kullaniciGuncelleSchema } from '@/app/(dashboard)/kullanicilar/schemas'
import type { Rol } from '@/types/enums'

async function oturumAl() {
  const oturum = await auth.api.getSession({ headers: await headers() })
  if (!oturum) return null
  return { id: oturum.user.id, rol: (oturum.user as unknown as { rol: Rol }).rol }
}

type Params = { params: Promise<{ kimlik: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { kimlik } = await params
  const hedef = await kullaniciServisi.tekGetir(kimlik)
  if (!hedef) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  return NextResponse.json({ basarili: true, veri: hedef })
}

export async function PATCH(istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'kullanici.duzenle')

  const { kimlik } = await params
  const govde = await istek.json().catch(() => null)
  const sonuc = kullaniciGuncelleSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json({ hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues }, { status: 400 })
  }

  const guncellendi = await kullaniciServisi.guncelle(kimlik, sonuc.data)
  return NextResponse.json({ basarili: true, veri: guncellendi })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'kullanici.sil')

  const { kimlik } = await params
  try {
    await kullaniciServisi.sil(kimlik)
    return NextResponse.json({ basarili: true })
  } catch (hata) {
    if (hata instanceof IzinHatasi) return NextResponse.json({ hata: hata.message }, { status: 403 })
    if (hata instanceof Error) return NextResponse.json({ hata: hata.message }, { status: 422 })
    return NextResponse.json({ hata: 'SUNUCU_HATASI' }, { status: 500 })
  }
}
