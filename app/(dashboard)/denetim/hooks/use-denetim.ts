'use client'

import { useQuery } from '@tanstack/react-query'
import { denetimApi, type DenetimFiltreIstek } from '../api'

export function useDenetimKayitlari(filtre?: DenetimFiltreIstek) {
  return useQuery({
    queryKey: ['denetim', filtre],
    queryFn: () => denetimApi.listele(filtre),
  })
}
