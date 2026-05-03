import { prisma } from '@/lib/prisma'
import type { ProjeGuncelleIstek, ProjeOlusturIstek } from './schemas'

export const projeServisi = {
  async listele(filtreler?: { arama?: string; birimId?: string }) {
    return prisma.proje.findMany({
      where: {
        silinmeTarihi: null,
        ...(filtreler?.arama
          ? { ad: { contains: filtreler.arama, mode: 'insensitive' as const } }
          : {}),
        ...(filtreler?.birimId ? { birimId: filtreler.birimId } : {}),
      },
      include: {
        birim: { select: { id: true, ad: true } },
        _count: { select: { gorevler: { where: { silinmeTarihi: null } } } },
      },
      orderBy: { olusturmaTarihi: 'desc' },
    })
  },

  async tekGetir(id: string) {
    return prisma.proje.findUnique({
      where: { id, silinmeTarihi: null },
      include: {
        birim: { select: { id: true, ad: true } },
        _count: { select: { gorevler: { where: { silinmeTarihi: null } } } },
      },
    })
  },

  async olustur(veri: ProjeOlusturIstek, olusturanId: string) {
    return prisma.proje.create({
      data: {
        ad: veri.ad,
        aciklama: veri.aciklama ?? null,
        birimId: veri.birimId,
        olusturanId,
        baslangicTarihi: veri.baslangicTarihi ?? null,
        bitisTarihi: veri.bitisTarihi ?? null,
      },
    })
  },

  async guncelle(id: string, veri: ProjeGuncelleIstek) {
    return prisma.proje.update({
      where: { id },
      data: {
        ...(veri.ad !== undefined ? { ad: veri.ad } : {}),
        ...(veri.aciklama !== undefined ? { aciklama: veri.aciklama } : {}),
        ...(veri.birimId !== undefined ? { birimId: veri.birimId } : {}),
        ...(veri.baslangicTarihi !== undefined
          ? { baslangicTarihi: veri.baslangicTarihi }
          : {}),
        ...(veri.bitisTarihi !== undefined ? { bitisTarihi: veri.bitisTarihi } : {}),
      },
    })
  },

  async sil(id: string) {
    const aktifGorevSayisi = await prisma.gorev.count({
      where: { projeId: id, silinmeTarihi: null },
    })
    if (aktifGorevSayisi > 0) {
      throw new Error('Aktif görevi olan proje silinemez')
    }
    return prisma.proje.update({
      where: { id },
      data: { silinmeTarihi: new Date() },
    })
  },
}
