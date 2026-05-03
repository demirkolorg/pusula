'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDownIcon,
  UserIcon,
  BellIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { cikisYap } from '@/app/(auth)/giris/actions'

const ROL_ETIKETI: Record<string, string> = {
  YONETICI: 'Yönetici',
  BIRIM_MUDURU: 'Birim Müdürü',
  PERSONEL: 'Personel',
}

function bashHarfleri(ad: string): string {
  return ad
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function HeaderUserMenu({
  kullanici,
}: {
  kullanici: {
    ad: string
    eposta: string
    rol?: string | null
    avatarUrl?: string | null
  }
}) {
  const { setTheme } = useTheme()
  const rolEtiketi = kullanici.rol ? (ROL_ETIKETI[kullanici.rol] ?? kullanici.rol) : ''

  const avatar = (
    <Avatar className="h-7 w-7">
      {kullanici.avatarUrl ? <AvatarImage src={kullanici.avatarUrl} alt={kullanici.ad} /> : null}
      <AvatarFallback className="text-xs">{bashHarfleri(kullanici.ad)}</AvatarFallback>
    </Avatar>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
            {avatar}
            <span className="hidden text-sm font-medium sm:inline">{kullanici.ad}</span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-9 w-9">
              {kullanici.avatarUrl ? (
                <AvatarImage src={kullanici.avatarUrl} alt={kullanici.ad} />
              ) : null}
              <AvatarFallback>{bashHarfleri(kullanici.ad)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{kullanici.ad}</span>
              <span className="truncate text-xs text-muted-foreground">{kullanici.eposta}</span>
              {rolEtiketi ? (
                <span className="truncate text-[11px] text-primary">{rolEtiketi}</span>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/ayarlar" />}>
            <UserIcon />
            Profilim
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/bildirimler" />}>
            <BellIcon />
            Bildirimler
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Görünüm</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <SunIcon />
            Aydınlık
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <MoonIcon />
            Karanlık
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <MonitorIcon />
            Sistem
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <form action={cikisYap}>
          <DropdownMenuItem
            closeOnClick={false}
            render={<button type="submit" className="w-full cursor-pointer" />}
          >
            <LogOutIcon />
            Çıkış Yap
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
