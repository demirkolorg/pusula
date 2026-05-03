import type { ProjeGuncelleIstek, ProjeOlusturIstek } from './schemas'

const BASE = '/api/v1/projeler'

async function iste<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export const projeApi = {
  listele: (filtreler?: { arama?: string; birimId?: string }) => {
    const params = new URLSearchParams()
    if (filtreler?.arama) params.set('arama', filtreler.arama)
    if (filtreler?.birimId) params.set('birimId', filtreler.birimId)
    const qs = params.toString()
    return iste<ProjeListeItem[]>(`${BASE}${qs ? `?${qs}` : ''}`)
  },

  tekGetir: (id: string) => iste<ProjeDetay>(`${BASE}/${id}`),

  olustur: (veri: ProjeOlusturIstek) =>
    iste<ProjeListeItem>(BASE, { method: 'POST', body: JSON.stringify(veri) }),

  guncelle: (id: string, veri: ProjeGuncelleIstek) =>
    iste<ProjeListeItem>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(veri) }),

  sil: (id: string) => iste<{ basarili: boolean }>(`${BASE}/${id}`, { method: 'DELETE' }),
}

export type ProjeListeItem = {
  id: string
  ad: string
  aciklama: string | null
  birimId: string
  birim: { id: string; ad: string }
  olusturanId: string
  baslangicTarihi: string | null
  bitisTarihi: string | null
  olusturmaTarihi: string
  guncellemeTarihi: string
  _count: { gorevler: number }
}

export type ProjeDetay = ProjeListeItem
