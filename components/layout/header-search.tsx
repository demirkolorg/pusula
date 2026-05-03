'use client'

import * as React from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/use-debounce'
import {
  AlertTriangle,
  FolderKanbanIcon,
  Info,
  ListChecksIcon,
  MessageSquareIcon,
  Octagon,
  PenLine,
  ScrollText,
  SearchIcon,
  StickyNoteIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { aramaApi, type AramaSonuclari } from '@/app/(dashboard)/arama-api'

const DERKENAR_IKONU = {
  KARAR: ScrollText,
  UYARI: AlertTriangle,
  ENGEL: Octagon,
  BILGI: Info,
  NOT: PenLine,
} as const

const DURUM_ETIKETI: Record<string, string> = {
  YAPILACAK: 'Yapılacak',
  SURUYOR: 'Sürüyor',
  ONAY_BEKLIYOR: 'Onay Bekliyor',
  ONAYLANDI: 'Onaylandı',
  DUZELTME: 'Düzeltme',
  IPTAL: 'İptal',
}

export function HeaderSearch() {
  const [acik, setAcik] = React.useState(false)
  const [sorgu, setSorgu] = React.useState('')
  const gecikSorgu = useDebounce(sorgu, 200)
  const router = useRouter()

  React.useEffect(() => {
    const dinleyici = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setAcik((o) => !o)
      }
    }
    window.addEventListener('keydown', dinleyici)
    return () => window.removeEventListener('keydown', dinleyici)
  }, [])

  const { data: sonuclar, isFetching } = useQuery<AramaSonuclari>({
    queryKey: ['arama', gecikSorgu],
    queryFn: () => aramaApi.ara(gecikSorgu),
    enabled: acik && gecikSorgu.length >= 2,
    staleTime: 30_000,
  })

  function git(yol: string) {
    setAcik(false)
    setSorgu('')
    router.push(yol as Route)
  }

  const bos = !sonuclar
    ? false
    : sonuclar.projeler.length === 0 &&
      sonuclar.gorevler.length === 0 &&
      sonuclar.yorumlar.length === 0 &&
      sonuclar.derkenarlar.length === 0

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        aria-label="Genel arama"
        className="hidden h-8 w-full max-w-md items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:flex"
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">Ara...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={acik}
        onOpenChange={setAcik}
        title="Genel Arama"
        description="Proje, görev, yorum ve derkenarlarda arama"
      >
        <CommandInput
          placeholder="Ara… (en az 2 karakter)"
          value={sorgu}
          onValueChange={setSorgu}
        />
        <CommandList>
          {sorgu.length < 2 && (
            <CommandEmpty>Aramaya başlamak için en az 2 karakter yazın</CommandEmpty>
          )}

          {sorgu.length >= 2 && isFetching && !sonuclar && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Aranıyor…
            </div>
          )}

          {sorgu.length >= 2 && bos && !isFetching && (
            <CommandEmpty>Sonuç bulunamadı</CommandEmpty>
          )}

          {sonuclar && sonuclar.projeler.length > 0 && (
            <CommandGroup heading="Projeler">
              {sonuclar.projeler.map((p) => (
                <CommandItem
                  key={`p-${p.id}`}
                  value={`proje-${p.id}-${p.ad}`}
                  onSelect={() => git(`/projeler`)}
                >
                  <FolderKanbanIcon />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.ad}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.birim.ad}
                      {p.aciklama ? ` · ${p.aciklama}` : ''}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {sonuclar && sonuclar.gorevler.length > 0 && (
            <>
              {sonuclar.projeler.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Görevler">
                {sonuclar.gorevler.map((g) => (
                  <CommandItem
                    key={`g-${g.id}`}
                    value={`gorev-${g.id}-${g.baslik}`}
                    onSelect={() => git(`/gorevler`)}
                  >
                    <ListChecksIcon />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{g.baslik}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {g.proje.ad}
                        {g.atanan ? ` · ${g.atanan.name}` : ''}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {DURUM_ETIKETI[g.durum] ?? g.durum}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {sonuclar && sonuclar.derkenarlar.length > 0 && (
            <>
              {(sonuclar.projeler.length > 0 || sonuclar.gorevler.length > 0) && (
                <CommandSeparator />
              )}
              <CommandGroup heading="Derkenarlar">
                {sonuclar.derkenarlar.map((d) => {
                  const Ikon = DERKENAR_IKONU[d.tip]
                  return (
                    <CommandItem
                      key={`d-${d.id}`}
                      value={`derkenar-${d.id}-${d.baslik ?? d.icerik.slice(0, 40)}`}
                      onSelect={() => git(`/gorevler`)}
                    >
                      <Ikon />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {d.baslik ?? d.icerik.slice(0, 80)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {d.gorev.baslik}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {d.tip}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}

          {sonuclar && sonuclar.yorumlar.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Yorumlar">
                {sonuclar.yorumlar.map((y) => (
                  <CommandItem
                    key={`y-${y.id}`}
                    value={`yorum-${y.id}-${y.icerik.slice(0, 40)}`}
                    onSelect={() => git(`/gorevler`)}
                  >
                    <MessageSquareIcon />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">
                        {y.icerik.length > 80 ? `${y.icerik.slice(0, 80)}…` : y.icerik}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {y.gorev.baslik} · {y.yazar.name}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
