'use client'

import { PlusIcon, ListChecksIcon, FolderKanbanIcon, StickyNoteIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function HeaderQuickAdd() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" className="h-8 gap-1.5">
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Yeni</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Hızlı Ekle</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/gorevler" />}>
          <ListChecksIcon />
          Görev
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/projeler" />}>
          <FolderKanbanIcon />
          Proje
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/derkenarlar" />}>
          <StickyNoteIcon />
          Derkenar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
