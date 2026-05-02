import { prisma } from '@/lib/prisma'
import type { Rol } from '@/types/enums'
import { ROL_IZIN_MATRISI } from './matris'
import type { IzinAnahtari } from './izinler'

export type { IzinAnahtari }

export interface IzinBaglami {
  gorevId?: string
  projeId?: string
  birimId?: string
  hedefKullaniciId?: string
  [key: string]: unknown
}

interface KullaniciKimlik {
  id: string
  rol: Rol
}

export class IzinHatasi extends Error {
  constructor(
    public readonly eylem: IzinAnahtari,
    mesaj = 'Bu işlem için yetkiniz yok',
  ) {
    super(mesaj)
    this.name = 'IzinHatasi'
  }
}

// ── Temel izin denetimi (rol + kullanıcı istisnaları) ──────────────────────

export async function izinVarMi(
  kullanici: KullaniciKimlik,
  eylem: IzinAnahtari,
  _baglan?: IzinBaglami,
): Promise<boolean> {
  const rolIzinleri = ROL_IZIN_MATRISI[kullanici.rol]
  const roldeVar = rolIzinleri.has(eylem)

  const istisna = await prisma.kullaniciIzinIstisnasi.findUnique({
    where: { kullaniciId_izinAnahtari: { kullaniciId: kullanici.id, izinAnahtari: eylem } },
  })

  if (istisna !== null) return istisna.verildi

  return roldeVar
}

// ── Zorunlu izin denetimi — başarısızsa IzinHatasi fırlatır ───────────────

export async function izinGerekli(
  kullanici: KullaniciKimlik,
  eylem: IzinAnahtari,
  baglan?: IzinBaglami,
): Promise<void> {
  const izinli = await izinVarMi(kullanici, eylem, baglan)
  if (!izinli) throw new IzinHatasi(eylem)
}

// ── Bağlam denetimleri ────────────────────────────────────────────────────

export interface GorevBaglami {
  gorevAtananId: string | null
  gorevOlusturanId: string
  gorevBirimId?: string
}

export function makerCheckerDeneti(
  kullaniciId: string,
  baglan: GorevBaglami,
): void {
  if (baglan.gorevAtananId === kullaniciId) {
    throw new IzinHatasi('gorev.onayla', 'Kendi atandığınız görevi onaylayamazsınız (Maker-Checker)')
  }
}

export function birimEslesmesiDeneti(
  kullaniciBirimId: string | null,
  hedefBirimId: string,
): void {
  if (kullaniciBirimId !== hedefBirimId) {
    throw new IzinHatasi('gorev.duzenle.tumu', 'Bu işlem yalnızca kendi biriminizde yapılabilir')
  }
}

export function kendiKaydiDeneti(
  kullaniciId: string,
  kaydSahibiId: string,
  eylem: IzinAnahtari,
): void {
  if (kullaniciId !== kaydSahibiId) {
    throw new IzinHatasi(eylem, 'Bu işlem yalnızca kendi kaydınızda yapılabilir')
  }
}

// ── Toplu izin denetimi (API endpoint için) ───────────────────────────────

export async function topluIzinDeneti(
  kullanici: KullaniciKimlik,
  eylemler: IzinAnahtari[],
): Promise<Record<IzinAnahtari, boolean>> {
  const sonuclar = await Promise.all(
    eylemler.map(async (eylem) => [eylem, await izinVarMi(kullanici, eylem)] as const),
  )
  return Object.fromEntries(sonuclar) as Record<IzinAnahtari, boolean>
}
