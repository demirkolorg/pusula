import { useEffect, useState } from 'react'

export function useDebounce<T>(deger: T, gecikmeMilisaniye = 300): T {
  const [geciktirilmisDeger, setGeciktirilmisDeger] = useState(deger)

  useEffect(() => {
    const zamanlayici = setTimeout(() => setGeciktirilmisDeger(deger), gecikmeMilisaniye)
    return () => clearTimeout(zamanlayici)
  }, [deger, gecikmeMilisaniye])

  return geciktirilmisDeger
}
