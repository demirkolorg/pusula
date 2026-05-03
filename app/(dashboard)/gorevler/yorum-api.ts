import type { YorumGuncelleIstek, YorumOlusturIstek } from './yorum-schemas'

async function iste<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export const yorumApi = {
  listele: (gorevId: string) =>
    iste<YorumItem[]>(`/api/v1/gorevler/${gorevId}/yorumlar`),

  olustur: (gorevId: string, veri: YorumOlusturIstek) =>
    iste<YorumItem>(`/api/v1/gorevler/${gorevId}/yorumlar`, {
      method: 'POST',
      body: JSON.stringify(veri),
    }),

  guncelle: (gorevId: string, yorumId: string, veri: YorumGuncelleIstek) =>
    iste<YorumItem>(`/api/v1/gorevler/${gorevId}/yorumlar/${yorumId}`, {
      method: 'PATCH',
      body: JSON.stringify(veri),
    }),

  sil: (gorevId: string, yorumId: string) =>
    iste<{ basarili: boolean }>(`/api/v1/gorevler/${gorevId}/yorumlar/${yorumId}`, {
      method: 'DELETE',
    }),
}

export type YorumItem = {
  id: string
  icerik: string
  gorevId: string
  yazarId: string
  yazar: { id: string; name: string; email: string }
  olusturmaTarihi: string
  guncellemeTarihi: string
}
