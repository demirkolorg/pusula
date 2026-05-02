'use client'

import { useSession } from '@/lib/auth/client'
import type { Kullanici } from '@/types/domain'

export function useCurrentUser(): { kullanici: Kullanici | null; yukleniyor: boolean } {
  const { data: oturum, isPending } = useSession()

  return {
    kullanici: (oturum?.user as unknown as Kullanici | null) ?? null,
    yukleniyor: isPending,
  }
}
