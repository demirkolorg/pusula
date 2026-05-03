import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli, izinVarMi } from '@/lib/permissions'
import { gorevServisi } from '@/app/(dashboard)/gorevler/services'
import { gorevGuncelleSchema } from '@/app/(dashboard)/gorevler/schemas'
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
  const gorev = await gorevServisi.tekGetir(kimlik)
  if (!gorev) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  if (kullanici.rol !== 'YONETICI' && gorev.proje.birimId !== kullanici.birimId) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }
  if (kullanici.rol === 'PERSONEL' && gorev.atananId !== kullanici.id) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }

  return NextResponse.json({ basarili: true, veri: gorev })
}

export async function PATCH(istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { kimlik } = await params
  const mevcut = await gorevServisi.tekGetir(kimlik)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  if (kullanici.rol !== 'YONETICI' && mevcut.proje.birimId !== kullanici.birimId) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }

  // Kendi görevi mi yoksa başkasının mı?
  const kendisininMi =
    mevcut.olusturanId === kullanici.id || mevcut.atananId === kullanici.id

  if (kendisininMi) {
    await izinGerekli(kullanici, 'gorev.duzenle.kendi')
  } else {
    const tumunuDuzenleyebilir = await izinVarMi(kullanici, 'gorev.duzenle.tumu')
    if (!tumunuDuzenleyebilir) {
      return NextResponse.json(
        { hata: 'Bu görevi düzenleme yetkiniz yok' },
        { status: 403 },
      )
    }
  }

  const govde = await istek.json().catch(() => null)
  const sonuc = gorevGuncelleSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json(
      { hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues },
      { status: 400 },
    )
  }

  // Atama değişikliği için ayrı izin
  if (sonuc.data.atananId !== undefined && sonuc.data.atananId !== mevcut.atananId) {
    await izinGerekli(kullanici, 'gorev.ata')
  }

  const gorev = await gorevServisi.guncelle(kimlik, sonuc.data)
  await auditYaz({
    eyleyenId: kullanici.id,
    model: 'Gorev',
    modelKimlik: gorev.id,
    eylem: 'GUNCELLE',
    eskiDeger: {
      durum: mevcut.durum,
      atananId: mevcut.atananId,
      oncelik: mevcut.oncelik,
    },
    yeniDeger: sonuc.data,
  })
  return NextResponse.json({ basarili: true, veri: gorev })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'gorev.sil')

  const { kimlik } = await params
  const mevcut = await gorevServisi.tekGetir(kimlik)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  if (kullanici.rol === 'BIRIM_MUDURU' && mevcut.proje.birimId !== kullanici.birimId) {
    return NextResponse.json({ hata: 'BU_KAYDA_ERISIM_YOK' }, { status: 403 })
  }

  await gorevServisi.sil(kimlik)
  await auditYaz({
    eyleyenId: kullanici.id,
    model: 'Gorev',
    modelKimlik: kimlik,
    eylem: 'SIL',
    eskiDeger: { baslik: mevcut.baslik, durum: mevcut.durum },
  })
  return NextResponse.json({ basarili: true })
}
