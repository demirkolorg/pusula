'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { birimApi } from '../api'
import type { BirimOlusturIstek } from '../schemas'
import type { BirimGuncelleIstek } from '../schemas'

export type { BirimListeItem, BirimDetay } from '../api'

const ANAHTAR = 'birimler'

export function useBirimler(arama?: string) {
  return useQuery({
    queryKey: [ANAHTAR, arama],
    queryFn: () => birimApi.listele(arama),
  })
}

export function useBirim(id: string) {
  return useQuery({
    queryKey: [ANAHTAR, id],
    queryFn: () => birimApi.tekGetir(id),
    enabled: !!id,
  })
}

export function useBirimOlustur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: BirimOlusturIstek) => birimApi.olustur(veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useBirimGuncelle(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: BirimGuncelleIstek) => birimApi.guncelle(id, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useBirimSil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => birimApi.sil(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useBirimlerSelect() {
  return useQuery({
    queryKey: [ANAHTAR, 'select'],
    queryFn: () => birimApi.listele(),
    select: (data) => data.map((b) => ({ value: b.id, label: b.ad })),
  })
}
