import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli } from '@/lib/permissions'
import { gorevServisi, type GorevFiltre } from '@/app/(dashboard)/gorevler/services'
import { gorevOlusturSchema } from '@/app/(dashboard)/gorevler/schemas'
import { prisma } from '@/lib/prisma'
import { auditYaz } from '@/lib/audit/yazici'
import type { Rol } from '@/types/enums'
import type { GorevDurumu, OncelikDuzeyi } from '@prisma/client'

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

  const sp = istek.nextUrl.searchParams
  const filtre: GorevFiltre = {
    arama: sp.get('arama') ?? undefined,
    projeId: sp.get('projeId') ?? undefined,
    atananId: sp.get('atananId') ?? undefined,
    durum: (sp.get('durum') as GorevDurumu) ?? undefined,
    oncelik: (sp.get('oncelik') as OncelikDuzeyi) ?? undefined,
  }

  // Yönetici dışındaki rollerde proje birim sınırı
  if (kullanici.rol !== 'YONETICI') {
    if (!kullanici.birimId) return NextResponse.json({ basarili: true, veri: [] })
    filtre.birimId = kullanici.birimId

    // Personel yalnızca kendisine atananları görür
    if (kullanici.rol === 'PERSONEL') {
      filtre.atananId = kullanici.id
    }
  }

  const gorevler = await gorevServisi.listele(filtre)
  return NextResponse.json({ basarili: true, veri: gorevler })
}

export async function POST(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'gorev.olustur')

  const govde = await istek.json().catch(() => null)
  const sonuc = gorevOlusturSchema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json(
      { hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues },
      { status: 400 },
    )
  }

  // Birim bağlamı: Görev'in projesinin birimi kullanıcının birimi olmalı (Yönetici hariç)
  const proje = await prisma.proje.findUnique({
    where: { id: sonuc.data.projeId, silinmeTarihi: null },
    select: { birimId: true },
  })
  if (!proje) {
    return NextResponse.json({ hata: 'PROJE_BULUNAMADI' }, { status: 404 })
  }
  if (kullanici.rol !== 'YONETICI' && proje.birimId !== kullanici.birimId) {
    return NextResponse.json(
      { hata: 'Bu proje sizin biriminizde değil' },
      { status: 403 },
    )
  }

  // Üst görev bağlam: 2 düzey kuralı (KÖ/B-Ç plan)
  if (sonuc.data.ustGorevId) {
    const ust = await prisma.gorev.findUnique({
      where: { id: sonuc.data.ustGorevId, silinmeTarihi: null },
      select: { ustGorevId: true, projeId: true },
    })
    if (!ust) {
      return NextResponse.json({ hata: 'UST_GOREV_BULUNAMADI' }, { status: 404 })
    }
    if (ust.ustGorevId) {
      return NextResponse.json(
        { hata: 'En fazla 2 düzey alt görev oluşturulabilir' },
        { status: 422 },
      )
    }
    if (ust.projeId !== sonuc.data.projeId) {
      return NextResponse.json(
        { hata: 'Üst görev farklı bir projede' },
        { status: 422 },
      )
    }
  }

  const gorev = await gorevServisi.olustur(sonuc.data, kullanici.id)
  await auditYaz({
    eyleyenId: kullanici.id,
    model: 'Gorev',
    modelKimlik: gorev.id,
    eylem: 'OLUSTUR',
    yeniDeger: gorev,
  })
  return NextResponse.json({ basarili: true, veri: gorev }, { status: 201 })
}
