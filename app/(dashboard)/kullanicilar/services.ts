import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { KullaniciGuncelleIstek, KullaniciOlusturIstek } from './schemas'

const KULLANICI_SELECT = {
  id: true,
  name: true,
  email: true,
  rol: true,
  aktif: true,
  birimId: true,
  createdAt: true,
  birim: { select: { id: true, ad: true } },
} as const

export const kullaniciServisi = {
  async listele(arama?: string, birimId?: string) {
    return prisma.user.findMany({
      where: {
        silinmeTarihi: null,
        ...(arama
          ? {
              OR: [
                { name: { contains: arama, mode: 'insensitive' } },
                { email: { contains: arama, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(birimId ? { birimId } : {}),
      },
      select: KULLANICI_SELECT,
      orderBy: { name: 'asc' },
    })
  },

  async tekGetir(id: string) {
    return prisma.user.findUnique({
      where: { id, silinmeTarihi: null },
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        aktif: true,
        birimId: true,
        createdAt: true,
        birim: { select: { id: true, ad: true } },
        accounts: { select: { providerId: true } },
      },
    })
  },

  async olustur(veri: KullaniciOlusturIstek) {
    const { password, ...kullaniciBilgisi } = veri
    await auth.api.signUpEmail({
      body: { name: kullaniciBilgisi.name, email: kullaniciBilgisi.email, password },
    })
    return prisma.user.update({
      where: { email: kullaniciBilgisi.email },
      data: { rol: kullaniciBilgisi.rol, birimId: kullaniciBilgisi.birimId },
      select: KULLANICI_SELECT,
    })
  },

  async guncelle(id: string, veri: KullaniciGuncelleIstek) {
    return prisma.user.update({
      where: { id },
      data: veri,
      select: KULLANICI_SELECT,
    })
  },

  async devreDisiBırak(id: string) {
    return prisma.user.update({
      where: { id },
      data: { aktif: false },
      select: KULLANICI_SELECT,
    })
  },

  async sil(id: string) {
    const aktifGorevSayisi = await prisma.gorev.count({
      where: { atananId: id, silinmeTarihi: null, durum: { notIn: ['IPTAL'] } },
    })
    if (aktifGorevSayisi > 0) {
      throw new Error('Aktif görevi olan kullanıcı silinemez')
    }
    return prisma.user.update({
      where: { id },
      data: { silinmeTarihi: new Date(), aktif: false },
    })
  },
}
