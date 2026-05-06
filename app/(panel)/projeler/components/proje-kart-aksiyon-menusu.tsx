"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  silinmis: boolean;
  arsivde: boolean;
  yetkili: boolean;
  onDuzenle: () => void;
  onArsivAc: (yeniDurum: boolean) => void;
  onSil: () => void;
  onGeriYukle: () => void;
};

// Kart üzerindeki tüm yıkıcı/yönetimsel aksiyonlar tek bir dropdown'da toplanır.
// Yıldız hızlı erişimde ayrı buton olarak kalır (sık kullanılan toggle).
// Why granüler boolean yerine tek `yetkili`: mevcut sayfa server-side tek
// `PROJE_OLUSTUR` izni kontrol ediyor; resource-level RBAC genişlemesi (Kural
// V.2) burada scope dışı. Tek yetki tek tek tüm aksiyonlara uygulanır.
export function ProjeKartAksiyonMenusu({
  silinmis,
  arsivde,
  yetkili,
  onDuzenle,
  onArsivAc,
  onSil,
  onGeriYukle,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="size-8 shrink-0 p-0"
            aria-label="Aksiyonlar"
            disabled={!yetkili}
          />
        }
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
        {silinmis ? (
          <DropdownMenuItem onClick={onGeriYukle} disabled={!yetkili}>
            <RotateCcwIcon className="size-4" />
            Geri Yükle
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={onDuzenle} disabled={!yetkili}>
              <PencilIcon className="size-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onArsivAc(!arsivde)}
              disabled={!yetkili}
            >
              {arsivde ? (
                <>
                  <ArchiveRestoreIcon className="size-4" />
                  Arşivden Çıkar
                </>
              ) : (
                <>
                  <ArchiveIcon className="size-4" />
                  Arşivle
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={onSil}
              disabled={!yetkili}
            >
              <Trash2Icon className="size-4" />
              Sil
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
