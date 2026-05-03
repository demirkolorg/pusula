import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import {
  izinGerekli,
  izinVarMi,
  kendiKaydiDeneti,
  IzinHatasi,
} from '@/lib/permissions'
import { derkenarServisi } from '@/app/(dashboard)/gorevler/derkenar-services'
import { derkenarGuncelleSchema } from '@/app/(dashboard)/gorevler/derkenar-schemas'
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

type Params = { params: Promise<{ kimlik: string; derkenarId: string }> }

export async function PATCH(istek: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { derkenarId } = await params
  const mevcut = await derkenarServisi.tekGetir(derkenarId)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  const govde = await istek.json().catch(() => null)
  const sonuc = derkenarGuncelleSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json(
      { hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues },
      { status: 400 },
    )
  }

  try {
    // Sabitleme/çözme yetki — herkesin yapamayacağı eylem
    if (sonuc.data.sabitlendi !== undefined) {
      await izinGerekli(kullanici, 'derkenar.sabitle')
    }

    // İçerik düzenleme — sadece kendi (veya tümü)
    const icerikDegisiyor =
      sonuc.data.icerik !== undefined ||
      sonuc.data.tip !== undefined ||
      sonuc.data.baslik !== undefined
    if (icerikDegisiyor) {
      const tumunuDuzenleyebilir = await izinVarMi(kullanici, 'derkenar.duzenle.tumu')
      if (!tumunuDuzenleyebilir) {
        await izinGerekli(kullanici, 'derkenar.duzenle.kendi')
        kendiKaydiDeneti(kullanici.id, mevcut.yazarId, 'derkenar.duzenle.kendi')
      }
    }
  } catch (h) {
    if (h instanceof IzinHatasi)
      return NextResponse.json({ hata: h.message }, { status: 403 })
    throw h
  }

  const derkenar = await derkenarServisi.guncelle(derkenarId, sonuc.data)
  return NextResponse.json({ basarili: true, veri: derkenar })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const { derkenarId } = await params
  const mevcut = await derkenarServisi.tekGetir(derkenarId)
  if (!mevcut) return NextResponse.json({ hata: 'BULUNAMADI' }, { status: 404 })

  try {
    const tumunuDuzenleyebilir = await izinVarMi(kullanici, 'derkenar.duzenle.tumu')
    if (!tumunuDuzenleyebilir) {
      await izinGerekli(kullanici, 'derkenar.duzenle.kendi')
      kendiKaydiDeneti(kullanici.id, mevcut.yazarId, 'derkenar.duzenle.kendi')
    }
  } catch (h) {
    if (h instanceof IzinHatasi)
      return NextResponse.json({ hata: h.message }, { status: 403 })
    throw h
  }

  await derkenarServisi.sil(derkenarId)
  return NextResponse.json({ basarili: true })
}
