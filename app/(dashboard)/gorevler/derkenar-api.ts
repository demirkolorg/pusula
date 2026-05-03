import type {
  DerkenarGuncelleIstek,
  DerkenarOlusturIstek,
} from './derkenar-schemas'

async function iste<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export const derkenarApi = {
  listele: (gorevId: string) =>
    iste<DerkenarItem[]>(`/api/v1/gorevler/${gorevId}/derkenarlar`),

  olustur: (gorevId: string, veri: DerkenarOlusturIstek) =>
    iste<DerkenarItem>(`/api/v1/gorevler/${gorevId}/derkenarlar`, {
      method: 'POST',
      body: JSON.stringify(veri),
    }),

  guncelle: (gorevId: string, derkenarId: string, veri: DerkenarGuncelleIstek) =>
    iste<DerkenarItem>(`/api/v1/gorevler/${gorevId}/derkenarlar/${derkenarId}`, {
      method: 'PATCH',
      body: JSON.stringify(veri),
    }),

  sil: (gorevId: string, derkenarId: string) =>
    iste<{ basarili: boolean }>(
      `/api/v1/gorevler/${gorevId}/derkenarlar/${derkenarId}`,
      { method: 'DELETE' },
    ),
}

export type DerkenarTipKodu = 'KARAR' | 'UYARI' | 'ENGEL' | 'BILGI' | 'NOT'

export type DerkenarItem = {
  id: string
  tip: DerkenarTipKodu
  baslik: string | null
  icerik: string
  gorevId: string
  yazarId: string
  yazar: { id: string; name: string; email: string }
  sabitlendi: boolean
  cozuldu: boolean
  cozulmeTarihi: string | null
  surum: number
  olusturmaTarihi: string
  guncellemeTarihi: string
}
