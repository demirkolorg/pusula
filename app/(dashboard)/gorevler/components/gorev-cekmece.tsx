'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useGorev } from '../hooks/use-gorevler'
import { DetaySekmesi } from './sekmeler/detay-sekmesi'
import { YorumSekmesi } from './sekmeler/yorum-sekmesi'
import { DerkenarSekmesi } from './sekmeler/derkenar-sekmesi'
import { KayitSekmesi } from './sekmeler/kayit-sekmesi'

const DURUM_ETIKETI: Record<string, string> = {
  YAPILACAK: 'Yapılacak',
  SURUYOR: 'Sürüyor',
  ONAY_BEKLIYOR: 'Onay Bekliyor',
  ONAYLANDI: 'Onaylandı',
  DUZELTME: 'Düzeltme',
  IPTAL: 'İptal',
}

export function GorevCekmece({
  gorevId,
  acik,
  onAcikDegisti,
}: {
  gorevId: string | null
  acik: boolean
  onAcikDegisti: (acik: boolean) => void
}) {
  const { data: gorev, isLoading } = useGorev(gorevId ?? '')

  return (
    <Sheet open={acik} onOpenChange={onAcikDegisti}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        {isLoading || !gorev ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {DURUM_ETIKETI[gorev.durum] ?? gorev.durum}
                </Badge>
                <span className="text-xs text-muted-foreground">{gorev.proje.ad}</span>
              </div>
              <SheetTitle className="text-lg">{gorev.baslik}</SheetTitle>
              <SheetDescription className="sr-only">
                Görev detayı sağ çekmece
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="detay" className="flex flex-1 flex-col overflow-hidden">
              <TabsList variant="line" className="mx-4 mt-2 justify-start">
                <TabsTrigger value="detay">Detay</TabsTrigger>
                <TabsTrigger value="yorum">
                  Yorum
                  {gorev._count.yorumlar > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                      {gorev._count.yorumlar}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="derkenar">Derkenar</TabsTrigger>
                <TabsTrigger value="kayit">Kayıt</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  <TabsContent value="detay" className="mt-0">
                    <DetaySekmesi gorev={gorev} />
                  </TabsContent>
                  <TabsContent value="yorum" className="mt-0">
                    <YorumSekmesi gorevId={gorev.id} />
                  </TabsContent>
                  <TabsContent value="derkenar" className="mt-0">
                    <DerkenarSekmesi gorevId={gorev.id} />
                  </TabsContent>
                  <TabsContent value="kayit" className="mt-0">
                    <KayitSekmesi gorev={gorev} />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
