'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gorevApi, type GorevFiltre } from '../api'
import type { GorevGuncelleIstek, GorevOlusturIstek } from '../schemas'

export type { GorevListeItem, GorevDetay, GorevFiltre } from '../api'

const ANAHTAR = 'gorevler'

export function useGorevler(filtre?: GorevFiltre) {
  return useQuery({
    queryKey: [ANAHTAR, filtre],
    queryFn: () => gorevApi.listele(filtre),
  })
}

export function useGorev(id: string) {
  return useQuery({
    queryKey: [ANAHTAR, id],
    queryFn: () => gorevApi.tekGetir(id),
    enabled: !!id,
  })
}

export function useGorevOlustur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: GorevOlusturIstek) => gorevApi.olustur(veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useGorevGuncelle(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: GorevGuncelleIstek) => gorevApi.guncelle(id, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useGorevSil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gorevApi.sil(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useGorevOnayaSun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gorevApi.onayaSun(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useGorevOnayla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gorevApi.onayla(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useGorevReddet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, gerekce }: { id: string; gerekce: string }) =>
      gorevApi.reddet(id, gerekce),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}
