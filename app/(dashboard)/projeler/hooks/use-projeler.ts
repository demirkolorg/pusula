'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projeApi } from '../api'
import type { ProjeGuncelleIstek, ProjeOlusturIstek } from '../schemas'

export type { ProjeListeItem, ProjeDetay } from '../api'

const ANAHTAR = 'projeler'

export function useProjeler(filtreler?: { arama?: string; birimId?: string }) {
  return useQuery({
    queryKey: [ANAHTAR, filtreler],
    queryFn: () => projeApi.listele(filtreler),
  })
}

export function useProje(id: string) {
  return useQuery({
    queryKey: [ANAHTAR, id],
    queryFn: () => projeApi.tekGetir(id),
    enabled: !!id,
  })
}

export function useProjeOlustur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: ProjeOlusturIstek) => projeApi.olustur(veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useProjeGuncelle(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: ProjeGuncelleIstek) => projeApi.guncelle(id, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useProjeSil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projeApi.sil(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useProjelerSelect() {
  return useQuery({
    queryKey: [ANAHTAR, 'select'],
    queryFn: () => projeApi.listele(),
    select: (data) => data.map((p) => ({ value: p.id, label: p.ad })),
  })
}
