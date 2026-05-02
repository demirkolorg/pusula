export interface ApiYaniti<T> {
  basarili: true
  veri: T
}

export interface ApiHatasi {
  basarili: false
  hata: string
  kod?: string
}

export type ApiSonucu<T> = ApiYaniti<T> | ApiHatasi

export interface SayfalamaSonucu<T> {
  kayitlar: T[]
  toplam: number
  sayfa: number
  sayfaBoyutu: number
  toplamSayfa: number
}

export interface SiralamaSorgusu {
  alan: string
  yon: 'asc' | 'desc'
}

export interface SayfalamaSorgusu {
  sayfa?: number
  sayfaBoyutu?: number
  siralama?: SiralamaSorgusu
}
