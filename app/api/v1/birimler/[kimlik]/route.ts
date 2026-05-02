import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli, IzinHatasi } from '@/lib/permissions'
import { birimServisi } from '@/app/(dashboard)/birimler/services'
import { birimGuncelleSchema } from '@/app/(dashboard)/birimler/schemas'
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
  const birim = await birimServisi.tekGetir(kimlik)
  if (!birim) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  return NextResponse.json({ basarili: true, veri: birim })
}

export async function PATCH(istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'birim.duzenle')

  const { kimlik } = await params
  const govde = await istek.json().catch(() => null)
  const sonuc = birimGuncelleSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json({ hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues }, { status: 400 })
  }

  const birim = await birimServisi.guncelle(kimlik, sonuc.data)
  return NextResponse.json({ basarili: true, veri: birim })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'birim.sil')

  const { kimlik } = await params
  try {
    await birimServisi.sil(kimlik)
    return NextResponse.json({ basarili: true })
  } catch (hata) {
    if (hata instanceof IzinHatasi) return NextResponse.json({ hata: hata.message }, { status: 403 })
    if (hata instanceof Error) return NextResponse.json({ hata: hata.message }, { status: 422 })
    return NextResponse.json({ hata: 'SUNUCU_HATASI' }, { status: 500 })
  }
}
