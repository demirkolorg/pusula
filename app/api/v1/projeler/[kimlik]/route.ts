import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli, IzinHatasi } from '@/lib/permissions'
import { projeServisi } from '@/app/(dashboard)/projeler/services'
import { projeGuncelleSchema } from '@/app/(dashboard)/projeler/schemas'
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

export async function GET(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { kimlik } = await params
  const proje = await projeServisi.tekGetir(kimlik)
  if (!proje) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  // Birim sınırlaması (BIRIM_MUDURU + PERSONEL kendi birimi dışındakini göremez)
  if (kullanici.rol !== 'YONETICI' && proje.birimId !== kullanici.birimId) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }

  return NextResponse.json({ basarili: true, veri: proje })
}

export async function PATCH(istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'proje.duzenle')

  const { kimlik } = await params
  const mevcut = await projeServisi.tekGetir(kimlik)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  // Birim Müdürü yalnızca kendi birimindeki projeyi düzenleyebilir
  if (kullanici.rol === 'BIRIM_MUDURU' && mevcut.birimId !== kullanici.birimId) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }

  const govde = await istek.json().catch(() => null)
  const sonuc = projeGuncelleSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json(
      { hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues },
      { status: 400 },
    )
  }

  // Birim Müdürü başka birime taşıyamaz
  if (
    kullanici.rol === 'BIRIM_MUDURU' &&
    sonuc.data.birimId !== undefined &&
    sonuc.data.birimId !== kullanici.birimId
  ) {
    return NextResponse.json(
      { hata: 'Projeyi başka bir birime taşıyamazsınız' },
      { status: 403 },
    )
  }

  const proje = await projeServisi.guncelle(kimlik, sonuc.data)
  await auditYaz({
    eyleyenId: kullanici.id,
    model: 'Proje',
    modelKimlik: proje.id,
    eylem: 'GUNCELLE',
    eskiDeger: mevcut,
    yeniDeger: sonuc.data,
  })
  return NextResponse.json({ basarili: true, veri: proje })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'proje.arsivle')

  const { kimlik } = await params
  const mevcut = await projeServisi.tekGetir(kimlik)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  if (kullanici.rol === 'BIRIM_MUDURU' && mevcut.birimId !== kullanici.birimId) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }

  try {
    await projeServisi.sil(kimlik)
    await auditYaz({
      eyleyenId: kullanici.id,
      model: 'Proje',
      modelKimlik: kimlik,
      eylem: 'ARSIVLE',
      eskiDeger: mevcut,
    })
    return NextResponse.json({ basarili: true })
  } catch (hata) {
    if (hata instanceof IzinHatasi)
      return NextResponse.json({ hata: hata.message }, { status: 403 })
    if (hata instanceof Error)
      return NextResponse.json({ hata: hata.message }, { status: 422 })
    return NextResponse.json({ hata: 'SUNUCU_HATASI' }, { status: 500 })
  }
}
