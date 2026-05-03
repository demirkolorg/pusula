import { prisma } from '@/lib/prisma'

export type OnayaSunIstek = { not?: string }
export type OnaylaIstek = { not?: string }
export type ReddetIstek = { gerekce: string }

export const onayServisi = {
  /**
   * YAPILACAK/SURUYOR/DUZELTME → ONAY_BEKLIYOR
   */
  async onayaSun(gorevId: string, _yapanId: string, _veri?: OnayaSunIstek) {
    const gorev = await prisma.gorev.findUnique({
      where: { id: gorevId, silinmeTarihi: null },
      select: { durum: true, atananId: true, olusturanId: true },
    })
    if (!gorev) throw new Error('GOREV_BULUNAMADI')

    if (!['YAPILACAK', 'SURUYOR', 'DUZELTME'].includes(gorev.durum)) {
      throw new Error(`Bu durumdaki görev onaya sunulamaz: ${gorev.durum}`)
    }

    return prisma.gorev.update({
      where: { id: gorevId },
      data: { durum: 'ONAY_BEKLIYOR' },
    })
  },

  /**
   * ONAY_BEKLIYOR → ONAYLANDI (Maker-Checker: onaylayan ≠ atanan)
   */
  async onayla(gorevId: string, onaylayanId: string, _veri?: OnaylaIstek) {
    const gorev = await prisma.gorev.findUnique({
      where: { id: gorevId, silinmeTarihi: null },
      select: { durum: true, atananId: true },
    })
    if (!gorev) throw new Error('GOREV_BULUNAMADI')
    if (gorev.durum !== 'ONAY_BEKLIYOR') {
      throw new Error('Yalnızca onay bekleyen görev onaylanabilir')
    }
    if (gorev.atananId === onaylayanId) {
      throw new Error('Kendi atandığınız görevi onaylayamazsınız (Yapan-Doğrulayan kuralı)')
    }

    return prisma.gorev.update({
      where: { id: gorevId },
      data: { durum: 'ONAYLANDI' },
    })
  },

  /**
   * ONAY_BEKLIYOR → DUZELTME + gerekçe yorum olarak eklenir
   */
  async reddet(gorevId: string, reddedenId: string, veri: ReddetIstek) {
    const gorev = await prisma.gorev.findUnique({
      where: { id: gorevId, silinmeTarihi: null },
      select: { durum: true, atananId: true },
    })
    if (!gorev) throw new Error('GOREV_BULUNAMADI')
    if (gorev.durum !== 'ONAY_BEKLIYOR') {
      throw new Error('Yalnızca onay bekleyen görev reddedilebilir')
    }
    if (!veri.gerekce || veri.gerekce.trim().length < 10) {
      throw new Error('Reddetme gerekçesi en az 10 karakter olmalı')
    }

    return prisma.$transaction(async (tx) => {
      const guncel = await tx.gorev.update({
        where: { id: gorevId },
        data: { durum: 'DUZELTME' },
      })
      // Reddetme gerekçesi otomatik UYARI tipinde derkenar olarak eklenir.
      await tx.derkenar.create({
        data: {
          gorevId,
          yazarId: reddedenId,
          tip: 'UYARI',
          baslik: 'Reddetme Gerekçesi',
          icerik: veri.gerekce.trim(),
        },
      })
      return guncel
    })
  },
}
