"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BadgeCheckIcon,
  BellIcon,
  LogOutIcon,
  Settings2Icon,
} from "lucide-react";
import { cikisYapAction } from "@/lib/auth-actions";

type HeaderUserMenuProps = {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
};

export function HeaderUserMenu({ user }: HeaderUserMenuProps) {
  const cikisFormRef = useRef<HTMLFormElement>(null);

  const bashar = (user.name || user.email)
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <>
      {/* Hidden form — Çıkış Yap için server action submit'i tetikler.
          Menu DOM'una yerleştirilirse Base UI'ın nativeButton uyarısına
          takılıyor; portal dışında tutuyoruz. */}
      <form ref={cikisFormRef} action={cikisYapAction} className="hidden" />
      <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Kullanıcı menüsü"
            className="cursor-pointer rounded-full"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarImage src={user.avatar ?? ""} alt={user.name} />
          <AvatarFallback>{bashar || "PU"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar>
                <AvatarImage src={user.avatar ?? ""} alt={user.name} />
                <AvatarFallback>{bashar || "PU"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            nativeButton={false}
            render={<Link href="/profil" />}
          >
            <BadgeCheckIcon />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem
            nativeButton={false}
            render={<Link href="/ayarlar/kullanicilar" />}
          >
            <Settings2Icon />
            Ayarlar
          </DropdownMenuItem>
          <DropdownMenuItem
            nativeButton={false}
            render={<Link href="/bildirimler" />}
          >
            <BellIcon />
            Bildirimler
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => cikisFormRef.current?.requestSubmit()}
        >
          <LogOutIcon />
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
