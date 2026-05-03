import { prisma } from '@/lib/prisma'
import type { YorumGuncelleIstek, YorumOlusturIstek } from './yorum-schemas'

export const yorumServisi = {
  async listele(gorevId: string) {
    return prisma.yorum.findMany({
      where: { gorevId, silinmeTarihi: null },
      include: { yazar: { select: { id: true, name: true, email: true } } },
      orderBy: { olusturmaTarihi: 'asc' },
    })
  },

  async olustur(gorevId: string, yazarId: string, veri: YorumOlusturIstek) {
    return prisma.yorum.create({
      data: { gorevId, yazarId, icerik: veri.icerik },
      include: { yazar: { select: { id: true, name: true, email: true } } },
    })
  },

  async guncelle(id: string, veri: YorumGuncelleIstek) {
    return prisma.yorum.update({
      where: { id },
      data: { icerik: veri.icerik },
      include: { yazar: { select: { id: true, name: true, email: true } } },
    })
  },

  async sil(id: string) {
    return prisma.yorum.update({
      where: { id },
      data: { silinmeTarihi: new Date() },
    })
  },

  async tekGetir(id: string) {
    return prisma.yorum.findUnique({
      where: { id, silinmeTarihi: null },
      select: { id: true, gorevId: true, yazarId: true },
    })
  },
}
