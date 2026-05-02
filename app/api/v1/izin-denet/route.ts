import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { topluIzinDeneti } from '@/lib/permissions'
import { IZIN_ANAHTARLARI } from '@/lib/permissions/izinler'
import { headers } from 'next/headers'

const istek_schema = z.object({
  eylemler: z.array(z.enum(IZIN_ANAHTARLARI)).min(1).max(20),
})

export async function POST(istek: NextRequest) {
  const oturum = await auth.api.getSession({ headers: await headers() })
  if (!oturum) return NextResponse.json({ hata: 'OTURUM_BULUNAMADI' }, { status: 401 })

  const govde = await istek.json().catch(() => null)
  const sonuc = istek_schema.safeParse(govde)
  if (!sonuc.success) {
    return NextResponse.json({ hata: 'GECERSIZ_ISTEK', detay: sonuc.error.issues }, { status: 400 })
  }

  const izinler = await topluIzinDeneti(
    { id: oturum.user.id, rol: (oturum.user as unknown as { rol: string }).rol as never },
    sonuc.data.eylemler,
  )

  return NextResponse.json({ basarili: true, veri: izinler })
}
