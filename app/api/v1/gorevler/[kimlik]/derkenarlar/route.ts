import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli, IzinHatasi } from '@/lib/permissions'
import { derkenarServisi } from '@/app/(dashboard)/gorevler/derkenar-services'
import { derkenarOlusturSchema } from '@/app/(dashboard)/gorevler/derkenar-schemas'
import { gorevServisi } from '@/app/(dashboard)/gorevler/services'
import { prisma } from '@/lib/prisma'
import type { Rol } from '@/types/enums'

async function oturumAl() {
  const oturum = await auth.api.getSession({ headers: await headers() })
  if (!oturum) return null
  const tam = await prisma.user.findUnique({
    where: { id: oturum.user.id },
    select: { id: true, rol: true, birimId: true },
  })
  return tam ? { id: tam.id, rol: tam.rol as Rol, birimId: tam.birimId } : null
}

type Params = { params: Promise<{ kimlik: string }> }

async function gorevErisim(
  kullanici: { id: string; rol: Rol; birimId: string | null },
  gorevId: string,
) {
  const gorev = await gorevServisi.tekGetir(gorevId)
  if (!gorev) return { hata: 'BULUNAMADI', durum: 404 as const }
  if (kullanici.rol !== 'YONETICI' && gorev.proje.birimId !== kullanici.birimId) {
    return { hata: 'BU_KAYDA_ERISIM_YOK', durum: 403 as const }
  }
  if (kullanici.rol === 'PERSONEL' && gorev.atananId !== kullanici.id) {
    return { hata: 'BU_KAYDA_ERISIM_YOK', durum: 403 as const }
  }
  return { gorev }
}

export async function GET(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { kimlik } = await params
  const erisim = await gorevErisim(kullanici, kimlik)
  if ('hata' in erisim)
    return NextResponse.json({ hata: erisim.hata }, { status: erisim.durum })

  const derkenarlar = await derkenarServisi.listele(kimlik)
  return NextResponse.json({ basarili: true, veri: derkenarlar })
}

export async function POST(istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'derkenar.olustur')

  const { kimlik } = await params
  const erisim = await gorevErisim(kullanici, kimlik)
  if ('hata' in erisim)
    return NextResponse.json({ hata: erisim.hata }, { status: erisim.durum })

  const govde = await istek.json().catch(() => null)
  const sonuc = derkenarOlusturSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json(
      { hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues },
      { status: 400 },
    )
  }

  // Sabitleme yetkisi ayrı
  if (sonuc.data.sabitlendi) {
    try {
      await izinGerekli(kullanici, 'derkenar.sabitle')
    } catch (h) {
      if (h instanceof IzinHatasi)
        return NextResponse.json({ hata: h.message }, { status: 403 })
      throw h
    }
  }

  const derkenar = await derkenarServisi.olustur(kimlik, kullanici.id, sonuc.data)
  return NextResponse.json({ basarili: true, veri: derkenar }, { status: 201 })
}
