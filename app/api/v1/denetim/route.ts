import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli } from '@/lib/permissions'
import { denetimServisi } from '@/app/(dashboard)/denetim/services'
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

export async function GET(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'dizge.denetim')

  const sp = istek.nextUrl.searchParams
  const sayfa = Number(sp.get('sayfa') ?? '1')
  const sayfaBoyutu = Number(sp.get('sayfaBoyutu') ?? '50')

  const sonuc = await denetimServisi.listele({
    model: sp.get('model') ?? undefined,
    eylem: sp.get('eylem') ?? undefined,
    eyleyenId: sp.get('eyleyenId') ?? undefined,
    modelKimlik: sp.get('modelKimlik') ?? undefined,
    sayfa,
    sayfaBoyutu,
  })

  return NextResponse.json({ basarili: true, veri: sonuc })
}
