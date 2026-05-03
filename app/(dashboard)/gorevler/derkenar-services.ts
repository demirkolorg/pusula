import { prisma } from '@/lib/prisma'
import type {
  DerkenarGuncelleIstek,
  DerkenarOlusturIstek,
} from './derkenar-schemas'

export const derkenarServisi = {
  async listele(gorevId: string) {
    return prisma.derkenar.findMany({
      where: { gorevId, silinmeTarihi: null },
      include: { yazar: { select: { id: true, name: true, email: true } } },
      orderBy: [{ sabitlendi: 'desc' }, { olusturmaTarihi: 'desc' }],
    })
  },

  async tekGetir(id: string) {
    return prisma.derkenar.findUnique({
      where: { id, silinmeTarihi: null },
      select: { id: true, gorevId: true, yazarId: true, surum: true, tip: true },
    })
  },

  async olustur(gorevId: string, yazarId: string, veri: DerkenarOlusturIstek) {
    return prisma.derkenar.create({
      data: {
        gorevId,
        yazarId,
        tip: veri.tip,
        baslik: veri.baslik ?? null,
        icerik: veri.icerik,
        sabitlendi: veri.sabitlendi ?? false,
      },
      include: { yazar: { select: { id: true, name: true, email: true } } },
    })
  },

  async guncelle(id: string, veri: DerkenarGuncelleIstek) {
    const mevcut = await prisma.derkenar.findUnique({
      where: { id },
      select: { surum: true, cozuldu: true },
    })
    if (!mevcut) throw new Error('Derkenar bulunamadı')

    const cozuldu = veri.cozuldu ?? mevcut.cozuldu
    const cozulmeTarihi =
      veri.cozuldu === true && !mevcut.cozuldu
        ? new Date()
        : veri.cozuldu === false
          ? null
          : undefined

    return prisma.derkenar.update({
      where: { id },
      data: {
        ...(veri.tip !== undefined ? { tip: veri.tip } : {}),
        ...(veri.baslik !== undefined ? { baslik: veri.baslik } : {}),
        ...(veri.icerik !== undefined ? { icerik: veri.icerik, surum: { increment: 1 } } : {}),
        ...(veri.sabitlendi !== undefined ? { sabitlendi: veri.sabitlendi } : {}),
        ...(veri.cozuldu !== undefined ? { cozuldu, cozulmeTarihi } : {}),
      },
      include: { yazar: { select: { id: true, name: true, email: true } } },
    })
  },

  async sil(id: string) {
    return prisma.derkenar.update({
      where: { id },
      data: { silinmeTarihi: new Date() },
    })
  },
}
