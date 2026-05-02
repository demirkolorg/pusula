import { useEffect, useState } from 'react'

export function useMediaQuery(sorgu: string): boolean {
  const [eslesiyor, setEslesiyor] = useState(false)

  useEffect(() => {
    const medya = window.matchMedia(sorgu)
    setEslesiyor(medya.matches)
    const dinleyici = (e: MediaQueryListEvent) => setEslesiyor(e.matches)
    medya.addEventListener('change', dinleyici)
    return () => medya.removeEventListener('change', dinleyici)
  }, [sorgu])

  return eslesiyor
}
