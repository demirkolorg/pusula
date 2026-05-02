'use client'

import { useQuery } from '@tanstack/react-query'

export type BirimSecenek = { value: string; label: string }

export function useBirimlerSelect() {
  return useQuery({
    queryKey: ['birimler', 'select'],
    queryFn: async () => {
      const res = await fetch('/api/v1/birimler')
      const json = await res.json()
      const liste = (json.veri ?? []) as { id: string; ad: string }[]
      return liste.map((b): BirimSecenek => ({ value: b.id, label: b.ad }))
    },
    staleTime: 30_000,
  })
}
