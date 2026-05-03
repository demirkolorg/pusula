'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { yorumApi } from '../yorum-api'
import type { YorumGuncelleIstek, YorumOlusturIstek } from '../yorum-schemas'

export type { YorumItem } from '../yorum-api'

const ANAHTAR = 'yorumlar'

export function useYorumlar(gorevId: string) {
  return useQuery({
    queryKey: [ANAHTAR, gorevId],
    queryFn: () => yorumApi.listele(gorevId),
    enabled: !!gorevId,
  })
}

export function useYorumOlustur(gorevId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: YorumOlusturIstek) => yorumApi.olustur(gorevId, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR, gorevId] }),
  })
}

export function useYorumGuncelle(gorevId: string, yorumId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: YorumGuncelleIstek) => yorumApi.guncelle(gorevId, yorumId, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR, gorevId] }),
  })
}

export function useYorumSil(gorevId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (yorumId: string) => yorumApi.sil(gorevId, yorumId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR, gorevId] }),
  })
}
