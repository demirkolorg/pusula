async function iste<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export type AramaProje = {
  id: string
  ad: string
  aciklama: string | null
  birim: { ad: string }
}

export type AramaGorev = {
  id: string
  baslik: string
  durum: string
  proje: { id: string; ad: string }
  atanan: { name: string } | null
}

export type AramaYorum = {
  id: string
  icerik: string
  gorev: { id: string; baslik: string }
  yazar: { name: string }
}

export type AramaDerkenar = {
  id: string
  tip: 'KARAR' | 'UYARI' | 'ENGEL' | 'BILGI' | 'NOT'
  baslik: string | null
  icerik: string
  gorev: { id: string; baslik: string }
}

export type AramaSonuclari = {
  projeler: AramaProje[]
  gorevler: AramaGorev[]
  yorumlar: AramaYorum[]
  derkenarlar: AramaDerkenar[]
}

export const aramaApi = {
  ara: (sorgu: string) =>
    iste<AramaSonuclari>(`/api/v1/arama?q=${encodeURIComponent(sorgu)}`),
}
