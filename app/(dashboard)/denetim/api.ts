async function iste<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.hata ?? 'SUNUCU_HATASI')
  return json.veri ?? json
}

export type DenetimKaydi = {
  id: string
  model: string
  modelKimlik: string
  eylem: string
  eskiDeger: unknown
  yeniDeger: unknown
  eyleyenId: string | null
  eyleyen: { id: string; name: string; email: string } | null
  tarih: string
}

export type DenetimListe = {
  kayitlar: DenetimKaydi[]
  toplam: number
  sayfa: number
  sayfaBoyutu: number
}

export type DenetimFiltreIstek = {
  model?: string
  eylem?: string
  eyleyenId?: string
  modelKimlik?: string
  sayfa?: number
  sayfaBoyutu?: number
}

export const denetimApi = {
  listele: (filtre?: DenetimFiltreIstek) => {
    const params = new URLSearchParams()
    Object.entries(filtre ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
    })
    const qs = params.toString()
    return iste<DenetimListe>(`/api/v1/denetim${qs ? `?${qs}` : ''}`)
  },
}
