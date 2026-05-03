import type { GorevGuncelleIstek, GorevOlusturIstek } from './schemas'

const BASE = '/api/v1/gorevler'

async function iste<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export type GorevFiltre = {
  arama?: string
  projeId?: string
  atananId?: string
  durum?: string
  oncelik?: string
}

export const gorevApi = {
  listele: (filtre?: GorevFiltre) => {
    const params = new URLSearchParams()
    if (filtre?.arama) params.set('arama', filtre.arama)
    if (filtre?.projeId) params.set('projeId', filtre.projeId)
    if (filtre?.atananId) params.set('atananId', filtre.atananId)
    if (filtre?.durum) params.set('durum', filtre.durum)
    if (filtre?.oncelik) params.set('oncelik', filtre.oncelik)
    const qs = params.toString()
    return iste<GorevListeItem[]>(`${BASE}${qs ? `?${qs}` : ''}`)
  },

  tekGetir: (id: string) => iste<GorevDetay>(`${BASE}/${id}`),

  olustur: (veri: GorevOlusturIstek) =>
    iste<GorevListeItem>(BASE, { method: 'POST', body: JSON.stringify(veri) }),

  guncelle: (id: string, veri: GorevGuncelleIstek) =>
    iste<GorevListeItem>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(veri) }),

  sil: (id: string) => iste<{ basarili: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),

  onayaSun: (id: string) =>
    iste<GorevListeItem>(`${BASE}/${id}/onaya-sun`, { method: 'POST', body: '{}' }),

  onayla: (id: string) =>
    iste<GorevListeItem>(`${BASE}/${id}/onayla`, { method: 'POST', body: '{}' }),

  reddet: (id: string, gerekce: string) =>
    iste<GorevListeItem>(`${BASE}/${id}/reddet`, {
      method: 'POST',
      body: JSON.stringify({ gerekce }),
    }),
}

export type GorevListeItem = {
  id: string
  baslik: string
  aciklama: string | null
  durum:
    | 'YAPILACAK'
    | 'SURUYOR'
    | 'ONAY_BEKLIYOR'
    | 'ONAYLANDI'
    | 'DUZELTME'
    | 'IPTAL'
  oncelik: 'DUSUK' | 'ORTA' | 'YUKSEK' | 'KRITIK'
  projeId: string
  proje: { id: string; ad: string; birimId: string }
  atananId: string | null
  atanan: { id: string; name: string; email: string } | null
  olusturanId: string
  olusturan: { id: string; name: string }
  ustGorevId: string | null
  baslangicTarihi: string | null
  bitisTarihi: string | null
  olusturmaTarihi: string
  guncellemeTarihi: string
  _count: { altGorevler: number; yorumlar: number; derkenarlar?: number }
}

export type GorevDetay = GorevListeItem & {
  ustGorev: { id: string; baslik: string } | null
  altGorevler: { id: string; baslik: string; durum: string }[]
  _count: { altGorevler: number; yorumlar: number; derkenarlar: number }
}
