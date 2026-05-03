import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli, izinVarMi, kendiKaydiDeneti, IzinHatasi } from '@/lib/permissions'
import { yorumServisi } from '@/app/(dashboard)/gorevler/yorum-services'
import { yorumGuncelleSchema } from '@/app/(dashboard)/gorevler/yorum-schemas'
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

type Params = { params: Promise<{ kimlik: string; yorumId: string }> }

export async function PATCH(istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { yorumId } = await params
  const mevcut = await yorumServisi.tekGetir(yorumId)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  try {
    await izinGerekli(kullanici, 'yorum.duzenle.kendi')
    kendiKaydiDeneti(kullanici.id, mevcut.yazarId, 'yorum.duzenle.kendi')
  } catch (h) {
    if (h instanceof IzinHatasi) return NextResponse.json({ hata: h.message }, { status: 403 })
    throw h
  }

  const govde = await istek.json().catch(() => null)
  const sonuc = yorumGuncelleSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json(
      { hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues },
      { status: 400 },
    )
  }

  const yorum = await yorumServisi.guncelle(yorumId, sonuc.data)
  return NextResponse.json({ basarili: true, veri: yorum })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { yorumId } = await params
  const mevcut = await yorumServisi.tekGetir(yorumId)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  // Kendi yorumu mu yoksa başkasınınki mi?
  const kendisininMi = mevcut.yazarId === kullanici.id

  try {
    if (kendisininMi) {
      await izinGerekli(kullanici, 'yorum.sil.kendi')
    } else {
      const tumunuSilebilir = await izinVarMi(kullanici, 'yorum.sil.tumu')
      if (!tumunuSilebilir) {
        return NextResponse.json(
          { hata: 'Bu yorumu silme yetkiniz yok' },
          { status: 403 },
        )
      }
    }
  } catch (h) {
    if (h instanceof IzinHatasi) return NextResponse.json({ hata: h.message }, { status: 403 })
    throw h
  }

  await yorumServisi.sil(yorumId)
  return NextResponse.json({ basarili: true })
}
