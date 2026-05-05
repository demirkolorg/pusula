"use client";

// Genel Arama Komut Paleti — Cmd/Ctrl+K + Cmd/Ctrl+Space ile açılır.
// Altay GlobalSearch bileşeninin tasarım dili referans alındı (geniş modal,
// tab bar, sayaç pill, skeleton, durationMs, highlight).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquareIcon,
  FolderKanbanIcon,
  KanbanSquareIcon,
  ListIcon,
  ListFilterIcon,
  MessageSquareIcon,
  PaperclipIcon,
  TagIcon,
  TimerIcon,
  Building2Icon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenelArama } from "../hooks/arama-sorgulari";
import { ARAMA_TIPLERI, type AramaTipi } from "../schemas";
import { tipeGoreGrupla } from "../genel-arama-helper";
import { TIP_BASLIK, type AramaSonucu } from "../tipler";
import { AramaSonucItem } from "./arama-sonuc-item";

// =====================================================================
// Tab tanımı — kategori grupları
// =====================================================================

type SekmeId = "hepsi" | "icerik" | "yapi" | "kisi-yer";

type Sekme = {
  id: SekmeId;
  baslik: string;
  ikon: LucideIcon;
  /** null → tüm tipler. Aksi halde dahil edilen tipler */
  tipler: AramaTipi[] | null;
};

// "İçerik" = kart üzerinde gezinen şeyler (kart, yorum, madde, eklenti)
// "Yapı"  = organizasyonel kabuk (proje, liste, etiket)
// "Kişi/Yer" = kullanıcı + birim (proje yetkisinden bağımsız)
const SEKMELER: Sekme[] = [
  { id: "hepsi", baslik: "Hepsi", ikon: ListFilterIcon, tipler: null },
  {
    id: "icerik",
    baslik: "İçerik",
    ikon: KanbanSquareIcon,
    tipler: ["kart", "yorum", "madde", "eklenti"],
  },
  {
    id: "yapi",
    baslik: "Yapı",
    ikon: FolderKanbanIcon,
    tipler: ["proje", "liste", "etiket"],
  },
  {
    id: "kisi-yer",
    baslik: "Kişi/Yer",
    ikon: UsersIcon,
    tipler: ["kullanici", "birim"],
  },
];

const TIP_IKON: Record<AramaTipi, LucideIcon> = {
  kart: KanbanSquareIcon,
  yorum: MessageSquareIcon,
  madde: CheckSquareIcon,
  eklenti: PaperclipIcon,
  kullanici: UserIcon,
  birim: Building2Icon,
  etiket: TagIcon,
  proje: FolderKanbanIcon,
  liste: ListIcon,
};

// =====================================================================
// Bileşen
// =====================================================================

export function KomutPaleti() {
  const [acikMi, setAcikMi] = useState(false);
  const [sorgu, setSorgu] = useState("");
  const [aktifSekme, setAktifSekme] = useState<SekmeId>("hepsi");
  const router = useRouter();

  // Cmd/Ctrl+K + Cmd/Ctrl+Space her ikisi de paleti açar (kullanıcı tercihi).
  useEffect(() => {
    const dinleyici = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === "k" || k === " ") {
        e.preventDefault();
        setAcikMi((onceki) => !onceki);
      }
    };
    document.addEventListener("keydown", dinleyici);
    return () => document.removeEventListener("keydown", dinleyici);
  }, []);

  // Sorgu değişince sekmeyi sıfırla — kullanıcı yeni arama yaparken hepsi'ne dön.
  useEffect(() => {
    setAktifSekme("hepsi");
  }, [sorgu]);

  // Dialog kapanınca sorgu + sekme sıfırlanır.
  useEffect(() => {
    if (!acikMi) {
      setSorgu("");
      setAktifSekme("hepsi");
    }
  }, [acikMi]);

  // Ctrl+1..4 ile sekme geçişi (Altay'dan ilham — Pusula'da 4 sekme)
  useEffect(() => {
    if (!acikMi) return;
    const dinleyici = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= SEKMELER.length) {
        e.preventDefault();
        setAktifSekme(SEKMELER[num - 1]!.id);
      }
    };
    window.addEventListener("keydown", dinleyici, true);
    return () => window.removeEventListener("keydown", dinleyici, true);
  }, [acikMi]);

  const { data, isFetching } = useGenelArama({ sorgu });
  const sonuclar = data?.sonuclar ?? [];
  const sureMs = data?.sureMs ?? 0;
  const toplam = sonuclar.length;

  const gruplar = useMemo(() => tipeGoreGrupla(sonuclar), [sonuclar]);

  // Boş olmayan tipler — sıraları ARAMA_TIPLERI deklarasyon sırası ile
  const doluTipler = useMemo(
    () => ARAMA_TIPLERI.filter((t) => gruplar.has(t)),
    [gruplar],
  );

  // Aktif sekmeye göre filtrelenmiş tipler
  const goruntulenenTipler = useMemo(() => {
    if (aktifSekme === "hepsi") return doluTipler;
    const sekme = SEKMELER.find((s) => s.id === aktifSekme);
    if (!sekme || sekme.tipler === null) return doluTipler;
    const izinli = new Set<AramaTipi>(sekme.tipler);
    return doluTipler.filter((t) => izinli.has(t));
  }, [aktifSekme, doluTipler]);

  // Sekme adetleri
  const sekmeSayisi = (sekme: Sekme): number => {
    if (sekme.tipler === null) return toplam;
    return sekme.tipler.reduce((acc, t) => acc + (gruplar.get(t)?.length ?? 0), 0);
  };

  const yukleniyor = isFetching && sorgu.trim().length >= 2;
  const bos = !yukleniyor && sorgu.trim().length >= 2 && toplam === 0;
  const sonucGoster = !yukleniyor && sorgu.trim().length >= 2 && toplam > 0;
  const baslangic = sorgu.trim().length < 2;

  const sec = (sonuc: AramaSonucu) => {
    setAcikMi(false);
    router.push(yonlendirmeUrl(sonuc));
  };

  return (
    <CommandDialog
      open={acikMi}
      onOpenChange={setAcikMi}
      title="Genel Arama"
      description="Kart, yorum, kullanıcı, proje ara"
      className="sm:max-w-[90vw] max-w-[calc(100%-2rem)] max-h-[92dvh] sm:max-h-[86vh]"
    >
      <Command shouldFilter={false} className="rounded-xl">
        <CommandInput
          placeholder="Ara… (Cmd/Ctrl+K • Cmd/Ctrl+Space)"
          value={sorgu}
          onValueChange={setSorgu}
        />

        {/* Sonuç sayacı + tab bar + süre */}
        {sonucGoster && (
          <div className="bg-muted/30 scrollbar-hide flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b px-3 py-2">
            <span className="text-muted-foreground mr-1 text-xs">
              {toplam} sonuç bulundu
            </span>
            {sureMs > 0 && (
              <span className="text-muted-foreground/60 mr-1 flex items-center gap-0.5 text-[10px]">
                <TimerIcon className="h-3 w-3" />
                {sureMs}ms
              </span>
            )}
            <div className="bg-border mr-1 h-4 w-px" />
            {SEKMELER.map((sekme, idx) => {
              const sayi = sekmeSayisi(sekme);
              const Ikon = sekme.ikon;
              const aktif = aktifSekme === sekme.id;
              const sonucVar = sayi > 0;
              return (
                <button
                  key={sekme.id}
                  type="button"
                  onClick={() => setAktifSekme(sekme.id)}
                  disabled={!sonucVar && sekme.id !== "hepsi"}
                  title={`Ctrl+${idx + 1}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                    aktif
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : sonucVar
                        ? "bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
                        : "bg-background/50 text-muted-foreground/50 cursor-not-allowed",
                  )}
                >
                  <Ikon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{sekme.baslik}</span>
                  {sonucVar && (
                    <span
                      className={cn(
                        "ml-0.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                        aktif
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {sayi}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <CommandList className="max-h-[65dvh] sm:max-h-[620px]">
          {/* Idle: arama başlamadı */}
          {baslangic && (
            <div className="text-muted-foreground p-8 text-center text-sm">
              Aramaya başlamak için en az 2 karakter yazın.
              <br />
              <span className="text-xs">
                İpucu: <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px]">⌘K</kbd>{" "}
                veya{" "}
                <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px]">⌘Space</kbd>{" "}
                paleti açar/kapatır
              </span>
            </div>
          )}

          {/* Loading: skeleton'lar */}
          {yukleniyor && (
            <div className="space-y-3 p-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-muted/30 flex items-start gap-4 rounded-lg px-3 py-3"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty: sonuç yok */}
          {bos && (
            <CommandEmpty>
              <p>
                "<span className="font-medium">{sorgu}</span>" için sonuç bulunamadı.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Farklı bir kelime deneyin veya yazımı kontrol edin.
              </p>
            </CommandEmpty>
          )}

          {/* Results: gruplar */}
          {sonucGoster &&
            goruntulenenTipler.map((tip) => {
              const grup = gruplar.get(tip)!;
              const Ikon = TIP_IKON[tip];
              return (
                <CommandGroup
                  key={tip}
                  heading={
                    <div className="flex items-center gap-2">
                      <Ikon className="h-3.5 w-3.5" />
                      <span>{TIP_BASLIK[tip]}</span>
                      <span className="text-muted-foreground/60">({grup.length})</span>
                    </div>
                  }
                >
                  {grup.slice(0, 5).map((s) => (
                    <AramaSonucItem
                      key={`${tip}-${s.id}`}
                      sonuc={s}
                      sorgu={sorgu}
                      onSec={sec}
                    />
                  ))}
                </CommandGroup>
              );
            })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// =====================================================================
// Yönlendirme — sonuç tipine göre router push URL'i
// =====================================================================

function yonlendirmeUrl(s: AramaSonucu): string {
  switch (s.tip) {
    case "kart":
      return `/projeler/${s.proje_id}?kart=${s.id}`;
    case "yorum":
    case "eklenti":
    case "madde":
      return `/kartlar/${s.kart_id}`;
    case "proje":
      return `/projeler/${s.id}`;
    case "liste":
      return `/projeler/${s.proje_id}`;
    case "etiket":
      return `/projeler/${s.proje_id}`;
    case "kullanici":
      return `/ayarlar/kullanicilar?aranan=${encodeURIComponent(s.email)}`;
    case "birim":
      return `/ayarlar/birimler?aranan=${encodeURIComponent(s.id)}`;
    default: {
      const _exhaustive: never = s;
      void _exhaustive;
      return "/";
    }
  }
}
