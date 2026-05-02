import type { Rol, GorevDurumu, OncelikDuzeyi } from './enums'

export interface Kullanici {
  id: string
  name: string
  email: string
  rol: Rol
  birimId: string | null
  aktif: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Birim {
  id: string
  ad: string
  aciklama: string | null
  mudurId: string | null
  olusturmaTarihi: Date
}

export interface Proje {
  id: string
  ad: string
  aciklama: string | null
  birimId: string
  olusturanId: string
  baslangicTarihi: Date | null
  bitisTarihi: Date | null
  olusturmaTarihi: Date
  guncellemeTarihi: Date
}

export interface Gorev {
  id: string
  baslik: string
  aciklama: string | null
  durum: GorevDurumu
  oncelik: OncelikDuzeyi
  projeId: string
  atananId: string | null
  olusturanId: string
  ustGorevId: string | null
  baslangicTarihi: Date | null
  bitisTarihi: Date | null
  olusturmaTarihi: Date
  guncellemeTarihi: Date
}
