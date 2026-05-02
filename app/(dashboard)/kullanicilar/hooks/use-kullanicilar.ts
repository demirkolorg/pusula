'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { kullaniciApi } from '../api'
import type { KullaniciGuncelleIstek, KullaniciOlusturIstek } from '../schemas'

export type { KullaniciListeItem, KullaniciDetay } from '../api'

const ANAHTAR = 'kullanicilar'

export function useKullanicilar(arama?: string, birimId?: string) {
  return useQuery({
    queryKey: [ANAHTAR, arama, birimId],
    queryFn: () => kullaniciApi.listele(arama, birimId),
  })
}

export function useKullanici(id: string) {
  return useQuery({
    queryKey: [ANAHTAR, id],
    queryFn: () => kullaniciApi.tekGetir(id),
    enabled: !!id,
  })
}

export function useKullaniciOlustur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: KullaniciOlusturIstek) => kullaniciApi.olustur(veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useKullaniciGuncelle(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veri: KullaniciGuncelleIstek) => kullaniciApi.guncelle(id, veri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useKullaniciDevreDisiBırak() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => kullaniciApi.devreDisiBırak(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}

export function useKullaniciSil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => kullaniciApi.sil(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ANAHTAR] }),
  })
}
