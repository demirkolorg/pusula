import type { BirimGuncelleIstek, BirimOlusturIstek } from './schemas'

const BASE = '/api/v1/birimler'

async function iste<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export const birimApi = {
  listele: (arama?: string) =>
    iste<BirimListeItem[]>(`${BASE}${arama ? `?arama=${encodeURIComponent(arama)}` : ''}`),

  tekGetir: (id: string) => iste<BirimDetay>(`${BASE}/${id}`),

  olustur: (veri: BirimOlusturIstek) =>
    iste<BirimListeItem>(BASE, { method: 'POST', body: JSON.stringify(veri) }),

  guncelle: (id: string, veri: BirimGuncelleIstek) =>
    iste<BirimListeItem>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(veri) }),

  sil: (id: string) => iste<{ basarili: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),
}

export type BirimListeItem = {
  id: string
  ad: string
  aciklama: string | null
  ustBirimId: string | null
  ustBirim: { id: string; ad: string } | null
  olusturmaTarihi: string
  _count: { kullanicilar: number; altBirimler: number }
}

export type BirimDetay = BirimListeItem & {
  kullanicilar: { id: string; name: string; email: string; rol: string }[]
  altBirimler: { id: string; ad: string }[]
}
