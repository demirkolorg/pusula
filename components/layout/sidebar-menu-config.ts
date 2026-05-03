import type { Rol } from '@/types/enums'
import {
  HomeIcon,
  ListChecksIcon,
  FolderKanbanIcon,
  Building2Icon,
  UsersIcon,
  StickyNoteIcon,
  UserCogIcon,
  BellIcon,
  ShieldCheckIcon,
  Settings2Icon,
  ArchiveIcon,
  ClockIcon,
  type LucideIcon,
} from 'lucide-react'

export type MenuOgesi = {
  baslik: string
  url: string
  ikon: LucideIcon
  altOgeler?: { baslik: string; url: string }[]
}

export type MenuGrubu = {
  etiket: string
  ogeler: MenuOgesi[]
}

const ANA: MenuOgesi = { baslik: 'Ana Sayfa', url: '/ana-sayfa', ikon: HomeIcon }
const GOREVLERIM: MenuOgesi = { baslik: 'Görevlerim', url: '/gorevler', ikon: ListChecksIcon }
const ONAY_BEKLEYEN: MenuOgesi = {
  baslik: 'Onay Bekleyen',
  url: '/gorevler?durum=ONAY_BEKLIYOR',
  ikon: ClockIcon,
}
const PROJELER: MenuOgesi = { baslik: 'Projeler', url: '/projeler', ikon: FolderKanbanIcon }
const DERKENARLAR: MenuOgesi = { baslik: 'Derkenarlar', url: '/derkenarlar', ikon: StickyNoteIcon }
const BILDIRIMLER: MenuOgesi = { baslik: 'Bildirimler', url: '/bildirimler', ikon: BellIcon }
const VEKALET: MenuOgesi = { baslik: 'Vekâlet', url: '/vekalet', ikon: UserCogIcon }
const AYARLAR: MenuOgesi = { baslik: 'Ayarlar', url: '/ayarlar', ikon: Settings2Icon }
const BIRIMLER: MenuOgesi = { baslik: 'Birimler', url: '/birimler', ikon: Building2Icon }
const KULLANICILAR: MenuOgesi = { baslik: 'Kullanıcılar', url: '/kullanicilar', ikon: UsersIcon }
const DENETIM: MenuOgesi = { baslik: 'Denetim', url: '/denetim', ikon: ShieldCheckIcon }
const ARSIV: MenuOgesi = { baslik: 'Arşiv', url: '/arsiv', ikon: ArchiveIcon }

const PERSONEL_MENU: MenuGrubu[] = [
  {
    etiket: 'Çalışma Alanım',
    ogeler: [ANA, GOREVLERIM, PROJELER, DERKENARLAR, BILDIRIMLER],
  },
  {
    etiket: 'Hesap',
    ogeler: [AYARLAR],
  },
]

const BIRIM_MUDURU_MENU: MenuGrubu[] = [
  {
    etiket: 'Çalışma Alanım',
    ogeler: [ANA, GOREVLERIM, ONAY_BEKLEYEN, PROJELER, DERKENARLAR, BILDIRIMLER],
  },
  {
    etiket: 'Birim Yönetimi',
    ogeler: [KULLANICILAR, VEKALET],
  },
  {
    etiket: 'Hesap',
    ogeler: [AYARLAR],
  },
]

const YONETICI_MENU: MenuGrubu[] = [
  {
    etiket: 'Çalışma Alanım',
    ogeler: [ANA, GOREVLERIM, ONAY_BEKLEYEN, PROJELER, DERKENARLAR, BILDIRIMLER],
  },
  {
    etiket: 'Yönetim',
    ogeler: [BIRIMLER, KULLANICILAR, VEKALET],
  },
  {
    etiket: 'Sistem',
    ogeler: [DENETIM, ARSIV, AYARLAR],
  },
]

export function rolIcinMenu(rol: Rol | string | null | undefined): MenuGrubu[] {
  switch (rol) {
    case 'YONETICI':
      return YONETICI_MENU
    case 'BIRIM_MUDURU':
      return BIRIM_MUDURU_MENU
    case 'PERSONEL':
    default:
      return PERSONEL_MENU
  }
}
