'use client'

import { BellIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function HeaderNotifications({ sayim = 0 }: { sayim?: number }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            aria-label={`Bildirimler${sayim ? ` (${sayim})` : ''}`}
          />
        }
      >
        <BellIcon className="size-4" />
        {sayim > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {sayim > 99 ? '99+' : sayim}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2 text-sm font-medium">Bildirimler</div>
        <div className="max-h-80 overflow-y-auto p-2 text-sm text-muted-foreground">
          {sayim === 0 ? (
            <div className="px-2 py-6 text-center">Yeni bildirim yok</div>
          ) : (
            <div className="px-2 py-2">
              {/* TODO: KÖ-... — bildirim listesi */}
              {sayim} okunmamış bildirim
            </div>
          )}
        </div>
        <div className="border-t px-3 py-2">
          <Link
            href="/bildirimler"
            className="text-xs text-primary hover:underline"
          >
            Tümünü gör
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
