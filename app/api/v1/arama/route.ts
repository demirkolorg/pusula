import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { izinGerekli } from '@/lib/permissions'
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

const SAYIM_PER_KATEGORI = 5

export async function GET(istek: NextRequest) {
  const kullanici = await oturumAl()
  if (!kullanici) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  await izinGerekli(kullanici, 'arama.kullan')

  const sorgu = (istek.nextUrl.searchParams.get('q') ?? '').trim()
  if (sorgu.length < 2) {
    return NextResponse.json({
      basarili: true,
      veri: { projeler: [], gorevler: [], yorumlar: [], derkenarlar: [] },
    })
  }

  const yoneticiMi = kullanici.rol === 'YONETICI'
  const personelMi = kullanici.rol === 'PERSONEL'
  const birimFiltre = yoneticiMi ? {} : { birimId: kullanici.birimId ?? '__yok__' }

  const ic = { contains: sorgu, mode: 'insensitive' as const }

  const [projeler, gorevler, yorumlar, derkenarlar] = await Promise.all([
    prisma.proje.findMany({
      where: {
        silinmeTarihi: null,
        OR: [{ ad: ic }, { aciklama: ic }],
        ...birimFiltre,
      },
      select: { id: true, ad: true, aciklama: true, birim: { select: { ad: true } } },
      take: SAYIM_PER_KATEGORI,
    }),

    prisma.gorev.findMany({
      where: {
        silinmeTarihi: null,
        OR: [{ baslik: ic }, { aciklama: ic }],
        ...(yoneticiMi
          ? {}
          : { proje: { birimId: kullanici.birimId ?? '__yok__' } }),
        ...(personelMi ? { atananId: kullanici.id } : {}),
      },
      select: {
        id: true,
        baslik: true,
        durum: true,
        proje: { select: { id: true, ad: true } },
        atanan: { select: { name: true } },
      },
      take: SAYIM_PER_KATEGORI,
    }),

    prisma.yorum.findMany({
      where: {
        silinmeTarihi: null,
        icerik: ic,
        ...(yoneticiMi
          ? {}
          : { gorev: { proje: { birimId: kullanici.birimId ?? '__yok__' } } }),
        ...(personelMi ? { gorev: { atananId: kullanici.id } } : {}),
      },
      select: {
        id: true,
        icerik: true,
        gorev: { select: { id: true, baslik: true } },
        yazar: { select: { name: true } },
      },
      take: SAYIM_PER_KATEGORI,
      orderBy: { olusturmaTarihi: 'desc' },
    }),

    prisma.derkenar.findMany({
      where: {
        silinmeTarihi: null,
        OR: [{ baslik: ic }, { icerik: ic }],
        ...(yoneticiMi
          ? {}
          : { gorev: { proje: { birimId: kullanici.birimId ?? '__yok__' } } }),
        ...(personelMi ? { gorev: { atananId: kullanici.id } } : {}),
      },
      select: {
        id: true,
        tip: true,
        baslik: true,
        icerik: true,
        gorev: { select: { id: true, baslik: true } },
      },
      take: SAYIM_PER_KATEGORI,
      orderBy: { olusturmaTarihi: 'desc' },
    }),
  ])

  return NextResponse.json({
    basarili: true,
    veri: { projeler, gorevler, yorumlar, derkenarlar },
  })
}
