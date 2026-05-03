import { prisma } from '@/lib/prisma'
import type { GorevGuncelleIstek, GorevOlusturIstek } from './schemas'
import type { GorevDurumu, OncelikDuzeyi } from '@prisma/client'

export type GorevFiltre = {
  arama?: string
  projeId?: string
  atananId?: string
  durum?: GorevDurumu
  oncelik?: OncelikDuzeyi
  birimId?: string
}

export const gorevServisi = {
  async listele(filtre?: GorevFiltre) {
    return prisma.gorev.findMany({
      where: {
        silinmeTarihi: null,
        ...(filtre?.arama
          ? { baslik: { contains: filtre.arama, mode: 'insensitive' as const } }
          : {}),
        ...(filtre?.projeId ? { projeId: filtre.projeId } : {}),
        ...(filtre?.atananId ? { atananId: filtre.atananId } : {}),
        ...(filtre?.durum ? { durum: filtre.durum } : {}),
        ...(filtre?.oncelik ? { oncelik: filtre.oncelik } : {}),
        ...(filtre?.birimId ? { proje: { birimId: filtre.birimId } } : {}),
      },
      include: {
        proje: { select: { id: true, ad: true, birimId: true } },
        atanan: { select: { id: true, name: true, email: true } },
        olusturan: { select: { id: true, name: true } },
        _count: {
          select: {
            altGorevler: { where: { silinmeTarihi: null } },
            yorumlar: { where: { silinmeTarihi: null } },
          },
        },
      },
      orderBy: [{ oncelik: 'desc' }, { bitisTarihi: 'asc' }, { olusturmaTarihi: 'desc' }],
    })
  },

  async tekGetir(id: string) {
    return prisma.gorev.findUnique({
      where: { id, silinmeTarihi: null },
      include: {
        proje: { select: { id: true, ad: true, birimId: true } },
        atanan: { select: { id: true, name: true, email: true } },
        olusturan: { select: { id: true, name: true } },
        ustGorev: { select: { id: true, baslik: true } },
        altGorevler: {
          where: { silinmeTarihi: null },
          select: { id: true, baslik: true, durum: true },
        },
        _count: {
          select: {
            altGorevler: { where: { silinmeTarihi: null } },
            yorumlar: { where: { silinmeTarihi: null } },
            derkenarlar: { where: { silinmeTarihi: null } },
          },
        },
      },
    })
  },

  async olustur(veri: GorevOlusturIstek, olusturanId: string) {
    return prisma.gorev.create({
      data: {
        baslik: veri.baslik,
        aciklama: veri.aciklama ?? null,
        projeId: veri.projeId,
        atananId: veri.atananId ?? null,
        ustGorevId: veri.ustGorevId ?? null,
        olusturanId,
        oncelik: veri.oncelik ?? 'ORTA',
        baslangicTarihi: veri.baslangicTarihi ?? null,
        bitisTarihi: veri.bitisTarihi ?? null,
      },
    })
  },

  async guncelle(id: string, veri: GorevGuncelleIstek) {
    return prisma.gorev.update({
      where: { id },
      data: {
        ...(veri.baslik !== undefined ? { baslik: veri.baslik } : {}),
        ...(veri.aciklama !== undefined ? { aciklama: veri.aciklama } : {}),
        ...(veri.projeId !== undefined ? { projeId: veri.projeId } : {}),
        ...(veri.atananId !== undefined ? { atananId: veri.atananId } : {}),
        ...(veri.ustGorevId !== undefined ? { ustGorevId: veri.ustGorevId } : {}),
        ...(veri.oncelik !== undefined ? { oncelik: veri.oncelik } : {}),
        ...(veri.durum !== undefined ? { durum: veri.durum } : {}),
        ...(veri.baslangicTarihi !== undefined
          ? { baslangicTarihi: veri.baslangicTarihi }
          : {}),
        ...(veri.bitisTarihi !== undefined ? { bitisTarihi: veri.bitisTarihi } : {}),
      },
    })
  },

  async sil(id: string) {
    return prisma.gorev.update({
      where: { id },
      data: { silinmeTarihi: new Date() },
    })
  },
}
