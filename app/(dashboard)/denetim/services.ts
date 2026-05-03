import { prisma } from '@/lib/prisma'

export type DenetimFiltre = {
  model?: string
  eylem?: string
  eyleyenId?: string
  modelKimlik?: string
  baslangic?: Date
  bitis?: Date
  sayfa?: number
  sayfaBoyutu?: number
}

export const denetimServisi = {
  async listele(filtre?: DenetimFiltre) {
    const sayfaBoyutu = Math.min(filtre?.sayfaBoyutu ?? 50, 200)
    const sayfa = Math.max(filtre?.sayfa ?? 1, 1)

    const where = {
      ...(filtre?.model ? { model: filtre.model } : {}),
      ...(filtre?.eylem ? { eylem: filtre.eylem } : {}),
      ...(filtre?.eyleyenId ? { eyleyenId: filtre.eyleyenId } : {}),
      ...(filtre?.modelKimlik ? { modelKimlik: filtre.modelKimlik } : {}),
      ...(filtre?.baslangic || filtre?.bitis
        ? {
            tarih: {
              ...(filtre.baslangic ? { gte: filtre.baslangic } : {}),
              ...(filtre.bitis ? { lte: filtre.bitis } : {}),
            },
          }
        : {}),
    }

    const [kayitlar, toplam] = await Promise.all([
      prisma.etkinlikGunlugu.findMany({
        where,
        include: { eyleyen: { select: { id: true, name: true, email: true } } },
        orderBy: { tarih: 'desc' },
        skip: (sayfa - 1) * sayfaBoyutu,
        take: sayfaBoyutu,
      }),
      prisma.etkinlikGunlugu.count({ where }),
    ])

    return { kayitlar, toplam, sayfa, sayfaBoyutu }
  },
}
