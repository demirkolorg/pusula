import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli, IzinHatasi } from '@/lib/permissions'
import { onayServisi } from '@/app/(dashboard)/gorevler/onay-services'
import { gorevServisi } from '@/app/(dashboard)/gorevler/services'
import { prisma } from '@/lib/prisma'
import { auditYaz } from '@/lib/audit/yazici'
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

export async function POST(_istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'gorev.onaya_sun')

  const { kimlik } = await params
  const gorev = await gorevServisi.tekGetir(kimlik)
  if (!gorev) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  // Yalnızca atanan veya oluşturan onaya sunabilir
  if (gorev.atananId !== kullanici.id && gorev.olusturanId !== kullanici.id) {
    return NextResponse.json(
      { hata: 'Yalnızca atanan veya oluşturan onaya sunabilir' },
      { status: 403 },
    )
  }

  if (kullanici.rol !== 'YONETICI' && gorev.proje.birimId !== kullanici.birimId) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }

  try {
    const sonuc = await onayServisi.onayaSun(kimlik, kullanici.id)
    await auditYaz({
      eyleyenId: kullanici.id,
      model: 'Gorev',
      modelKimlik: kimlik,
      eylem: 'ONAYA_SUN',
      eskiDeger: { durum: gorev.durum },
      yeniDeger: { durum: 'ONAY_BEKLIYOR' },
    })
    return NextResponse.json({ basarili: true, veri: sonuc })
  } catch (h) {
    if (h instanceof IzinHatasi) return NextResponse.json({ hata: h.message }, { status: 403 })
    if (h instanceof Error) return NextResponse.json({ hata: h.message }, { status: 422 })
    return NextResponse.json({ hata: 'SUNUCU_HATASI' }, { status: 500 })
  }
}
