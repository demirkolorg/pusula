"use client";

// Genel Arama Komut Paleti — Cmd/Ctrl+K + Cmd/Ctrl+Space ile açılır.
// ADR-0017 + Kontrol Kural 13 (mobilde sheet — şimdilik dialog, mobile follow-up)
// + Kural 70 (DOMPurify gerekli olursa — şimdi plain text vurgulama yapılıyor).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquareIcon,
  FolderKanbanIcon,
  KanbanSquareIcon,
  ListIcon,
  MessageSquareIcon,
  PaperclipIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useGenelArama } from "../hooks/arama-sorgulari";
import { ARAMA_TIPLERI, type AramaTipi } from "../schemas";
import { metniKirp, tipeGoreGrupla } from "../genel-arama-helper";
import { TIP_BASLIK, type AramaSonucu } from "../tipler";

const TIP_IKON: Record<AramaTipi, LucideIcon> = {
  kart: KanbanSquareIcon,
  yorum: MessageSquareIcon,
  madde: CheckSquareIcon,
  eklenti: PaperclipIcon,
  kullanici: UserIcon,
  birim: UsersIcon,
  etiket: TagIcon,
  proje: FolderKanbanIcon,
  liste: ListIcon,
};

/**
 * Tek noktada kontrol edilen komut paleti. Sayfanın kök layout'una bir kez
 * mount edilir; içeride global keyboard shortcut yakalama yapılır.
 */
export function KomutPaleti() {
  const [acikMi, setAcikMi] = useState(false);
  const [sorgu, setSorgu] = useState("");
  const router = useRouter();

  // Cmd/Ctrl+K + Cmd/Ctrl+Space her ikisi de paleti açar (Kullanıcı tercihi).
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

  const { data: sonuclar, isFetching } = useGenelArama({ sorgu });

  const gruplar = tipeGoreGrupla(sonuclar ?? []);
  const tiplerSirali = ARAMA_TIPLERI.filter((t) => gruplar.has(t));

  const sec = (sonuc: AramaSonucu) => {
    setAcikMi(false);
    setSorgu("");
    router.push(yonlendirmeUrl(sonuc));
  };

  return (
    <CommandDialog
      open={acikMi}
      onOpenChange={setAcikMi}
      title="Genel Arama"
      description="Kart, yorum, kullanıcı, proje ara"
    >
      <CommandInput
        placeholder="Ara… (Cmd/Ctrl+K • Cmd/Ctrl+Space)"
        value={sorgu}
        onValueChange={setSorgu}
      />
      <CommandList>
        {sorgu.trim().length < 2 ? (
          <CommandEmpty>Aramaya başlamak için en az 2 karakter yazın.</CommandEmpty>
        ) : !sonuclar && isFetching ? (
          <CommandEmpty>Aranıyor…</CommandEmpty>
        ) : tiplerSirali.length === 0 ? (
          <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
        ) : (
          tiplerSirali.map((tip, idx) => {
            const grup = gruplar.get(tip)!;
            const Ikon = TIP_IKON[tip];
            return (
              <div key={tip}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={`${TIP_BASLIK[tip]} (${grup.length})`}>
                  {grup.slice(0, 5).map((s) => (
                    <CommandItem
                      key={`${tip}-${s.id}`}
                      // cmdk değer eşleşmesi için sorguyu içerir; arama
                      // server-side yapıldı, biz sadece tıklanabilir kalalım.
                      value={`${tip}-${s.id}-${s.baslik}`}
                      onSelect={() => sec(s)}
                    >
                      <Ikon />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{s.baslik}</span>
                        {s.detay && (
                          <span className="text-muted-foreground truncate text-xs">
                            {metniKirp(s.detay, sorgu, 80)}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            );
          })
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Sonuç tipine göre yönlendirme URL'i. Kart/madde/yorum/eklenti karta açılır
 * (modal); proje/liste pano sayfasına; kullanıcı/birim ayar sayfasına; etiket
 * proje sayfasına gider.
 */
function yonlendirmeUrl(s: AramaSonucu): string {
  switch (s.tip) {
    case "kart":
      return `/projeler/${s.proje_id}?kart=${s.id}`;
    case "yorum":
    case "eklenti":
      // Yorum/eklenti karta yönlendirir — kart_id var, proje_id'yi DB'den çekmek
      // yerine kart route'una git, kart modal proje bağlamını yükler.
      return `/kartlar/${s.kart_id}`;
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
      // Tip exhaustiveness guard
      const _exhaustive: never = s;
      void _exhaustive;
      return "/";
    }
  }
}
