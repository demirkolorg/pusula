import type { KullaniciGuncelleIstek, KullaniciOlusturIstek } from './schemas'

const BASE = '/api/v1/kullanicilar'

async function iste<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export const kullaniciApi = {
  listele: (arama?: string, birimId?: string) => {
    const p = new URLSearchParams()
    if (arama) p.set('arama', arama)
    if (birimId) p.set('birimId', birimId)
    const q = p.toString()
    return iste<KullaniciListeItem[]>(`${BASE}${q ? `?${q}` : ''}`)
  },

  tekGetir: (id: string) => iste<KullaniciDetay>(`${BASE}/${id}`),

  olustur: (veri: KullaniciOlusturIstek) =>
    iste<KullaniciListeItem>(BASE, { method: 'POST', body: JSON.stringify(veri) }),

  guncelle: (id: string, veri: KullaniciGuncelleIstek) =>
    iste<KullaniciListeItem>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(veri) }),

  devreDisiBırak: (id: string) =>
    iste<KullaniciListeItem>(`${BASE}/${id}/devre-disi`, { method: 'PATCH' }),

  sil: (id: string) => iste<{ basarili: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),
}

export type KullaniciListeItem = {
  id: string
  name: string
  email: string
  rol: string
  aktif: boolean
  birimId: string | null
  createdAt: string
  birim: { id: string; ad: string } | null
}

export type KullaniciDetay = KullaniciListeItem & {
  accounts: { providerId: string }[]
}
