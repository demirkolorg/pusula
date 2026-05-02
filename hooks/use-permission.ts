'use client'

import { useQuery } from '@tanstack/react-query'
import type { IzinAnahtari } from '@/lib/permissions/izinler'

async function izinleriGetir(eylemler: IzinAnahtari[]): Promise<Record<IzinAnahtari, boolean>> {
  const res = await fetch('/api/v1/izin-denet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eylemler }),
  })
  if (!res.ok) return {} as Record<IzinAnahtari, boolean>
  const json = await res.json()
  return json.veri
}

// Tek izin kontrolü
export function useIzin(eylem: IzinAnahtari): boolean | undefined {
  const { data } = useQuery({
    queryKey: ['izin', eylem],
    queryFn: () => izinleriGetir([eylem]),
    staleTime: 60_000, // 1 dakika
  })
  return data?.[eylem]
}

// Çoklu izin kontrolü — tek HTTP isteğinde
export function useIzinler(eylemler: IzinAnahtari[]): Record<IzinAnahtari, boolean> | undefined {
  const { data } = useQuery({
    queryKey: ['izinler', ...eylemler],
    queryFn: () => izinleriGetir(eylemler),
    staleTime: 60_000,
    enabled: eylemler.length > 0,
  })
  return data
}
