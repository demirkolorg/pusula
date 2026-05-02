import { prisma } from '@/lib/prisma'
import type { BirimGuncelleIstek, BirimOlusturIstek } from './schemas'

export const birimServisi = {
  async listele(arama?: string) {
    return prisma.birim.findMany({
      where: {
        silinmeTarihi: null,
        ...(arama ? { ad: { contains: arama, mode: 'insensitive' as const } } : {}),
      },
      include: {
        _count: { select: { kullanicilar: true, altBirimler: true } },
        ustBirim: { select: { id: true, ad: true } },
      },
      orderBy: { ad: 'asc' },
    })
  },

  async tekGetir(id: string) {
    return prisma.birim.findUnique({
      where: { id, silinmeTarihi: null },
      include: {
        kullanicilar: {
          where: { silinmeTarihi: null, aktif: true },
          select: { id: true, name: true, email: true, rol: true },
        },
        altBirimler: { where: { silinmeTarihi: null }, select: { id: true, ad: true } },
        ustBirim: { select: { id: true, ad: true } },
      },
    })
  },

  async olustur(veri: BirimOlusturIstek) {
    return prisma.birim.create({ data: veri })
  },

  async guncelle(id: string, veri: BirimGuncelleIstek) {
    return prisma.birim.update({ where: { id }, data: veri })
  },

  async sil(id: string) {
    const aktifKullaniciSayisi = await prisma.user.count({
      where: { birimId: id, silinmeTarihi: null, aktif: true },
    })
    if (aktifKullaniciSayisi > 0) {
      throw new Error('Aktif kullanıcısı olan birim silinemez')
    }
    return prisma.birim.update({ where: { id }, data: { silinmeTarihi: new Date() } })
  },
}
