import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli } from '@/lib/permissions'
import { projeServisi } from '@/app/(dashboard)/projeler/services'
import { projeOlusturSchema } from '@/app/(dashboard)/projeler/schemas'
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

export async function GET(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const arama = istek.nextUrl.searchParams.get('arama') ?? undefined
  let birimId = istek.nextUrl.searchParams.get('birimId') ?? undefined

  // Birim Müdürü yalnızca kendi birimini görebilir; Personel için aynı.
  // Yönetici tüm birimleri görebilir, filtre serbest.
  if (kullanici.rol !== 'YONETICI') {
    birimId = kullanici.birimId ?? undefined
    if (!birimId) return NextResponse.json({ basarili: true, veri: [] })
  }

  const projeler = await projeServisi.listele({ arama, birimId })
  return NextResponse.json({ basarili: true, veri: projeler })
}

export async function POST(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'proje.olustur')

  const govde = await istek.json().catch(() => null)
  const sonuc = projeOlusturSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json(
      { hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues },
      { status: 400 },
    )
  }

  // Birim Müdürü yalnızca kendi biriminde proje açabilir.
  if (kullanici.rol === 'BIRIM_MUDURU' && sonuc.data.birimId !== kullanici.birimId) {
    return NextResponse.json(
      { hata: 'Yalnızca kendi biriminizde proje oluşturabilirsiniz' },
      { status: 403 },
    )
  }

  const proje = await projeServisi.olustur(sonuc.data, kullanici.id)
  await auditYaz({
    eyleyenId: kullanici.id,
    model: 'Proje',
    modelKimlik: proje.id,
    eylem: 'OLUSTUR',
    yeniDeger: proje,
  })
  return NextResponse.json({ basarili: true, veri: proje }, { status: 201 })
}
