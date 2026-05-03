import { prisma } from '@/lib/prisma'

export type DenetimEylemi =
  | 'OLUSTUR'
  | 'GUNCELLE'
  | 'SIL'
  | 'ARSIVLE'
  | 'ONAYA_SUN'
  | 'ONAYLA'
  | 'REDDET'
  | 'GIRIS'
  | 'CIKIS'
  | 'IZIN_DENET'

export type DenetimKaydi = {
  eyleyenId?: string | null
  model: string
  modelKimlik: string
  eylem: DenetimEylemi | string
  eskiDeger?: unknown
  yeniDeger?: unknown
}

/**
 * Etkinlik günlüğüne tek bir kayıt yazar.
 * Yazma başarısız olursa sessizce devam eder (asıl işlemi bozmaz).
 */
export async function auditYaz(kayit: DenetimKaydi): Promise<void> {
  try {
    await prisma.etkinlikGunlugu.create({
      data: {
        model: kayit.model,
        modelKimlik: kayit.modelKimlik,
        eylem: kayit.eylem,
        eskiDeger: kayit.eskiDeger as never,
        yeniDeger: kayit.yeniDeger as never,
        eyleyenId: kayit.eyleyenId ?? null,
      },
    })
  } catch (e) {
    console.error('[denetim] kayıt yazılamadı', e)
  }
}

/**
 * Promise'i bekledikten sonra denetim kaydı yazar.
 * Hata olursa kayıt yazmaz, hatayı yukarı fırlatır.
 */
export async function auditSar<T>(
  islem: () => Promise<T>,
  kayitUret: (sonuc: T) => DenetimKaydi,
): Promise<T> {
  const sonuc = await islem()
  await auditYaz(kayitUret(sonuc))
  return sonuc
}
