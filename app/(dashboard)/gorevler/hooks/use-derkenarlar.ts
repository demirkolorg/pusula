'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { derkenarApi } from '../derkenar-api'
import type {
  DerkenarGuncelleIstek,
  DerkenarOlusturIstek,
} from '../derkenar-schemas'

export type { DerkenarItem, DerkenarTipKodu } from '../derkenar-api'

const ANAHTAR = 'derkenarlar'

export function useDerkenarlar(gorevId: string) {
  return useQuery({
    queryKey: [ANAHTAR, gorevId],
    queryFn: () => derkenarApi.listele(gorevId),
    enabled: !!gorevId,
  })
}

export function useDerkenarOlustur(gorevId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: DerkenarOlusturIstek) => derkenarApi.olustur(gorevId, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR, gorevId] }),
  })
}

export function useDerkenarGuncelle(gorevId: string, derkenarId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: DerkenarGuncelleIstek) =>
      derkenarApi.guncelle(gorevId, derkenarId, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR, gorevId] }),
  })
}

export function useDerkenarSil(gorevId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => derkenarApi.sil(gorevId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR, gorevId] }),
  })
}
