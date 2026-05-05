"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  projeDetayKey,
  useProjeDetayGuncelle,
} from "../hooks/detay-sorgulari";

const MIN_UZUNLUK = 2;
const MAX_UZUNLUK = 200;
const GERIAL_TOAST_ID = "proje-ad-gerial";

type Props = {
  projeId: string;
  ad: string;
  duzenleyebilir: boolean;
  className?: string;
};

// Inline ad düzenleme — header'da `<h1>` yerine render edilir.
// Tıklayınca text -> input; Enter/blur kaydet, Esc iptal. Yetki yoksa pasif.
// Optimistic update zaten useProjeDetayGuncelle içinde (Kural 107-108).
// Yanlış silme/değiştirme için 5sn'lik undo toast (Kural 65) — kayıt sonrası
// "Geri al" butonu eski adı geri yükler (server'a yeni mutate atılır).
export function ProjeBaslikAdInline({
  projeId,
  ad,
  duzenleyebilir,
  className,
}: Props) {
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const guncelle = useProjeDetayGuncelle(anahtar);
  const [duzenleniyor, setDuzenleniyor] = React.useState(false);
  const [taslak, setTaslak] = React.useState(ad);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const olcumRef = React.useRef<HTMLSpanElement | null>(null);
  const [genislikPx, setGenislikPx] = React.useState<number | null>(null);

  // `ad` prop'u dışarıdan değişirse (realtime/başka kullanıcı düzenlerse) ve
  // yerel olarak düzenlenmiyorsa render-time'da taslak'ı sıfırla. useEffect
  // ile yapmak gereksiz cascade render'a sebep olur (react-hooks/set-state-in-effect).
  if (!duzenleniyor && taslak !== ad) {
    setTaslak(ad);
  }

  // Görünmez ölçüm span'inden taslak metnin pixel genişliğini oku → input'a uygula.
  // useLayoutEffect: kullanıcı yazarken titreme olmasın diye paint öncesi yaz.
  React.useLayoutEffect(() => {
    if (!duzenleniyor) return;
    const m = olcumRef.current;
    if (!m) return;
    // 4px buffer = caret + sağ padding güvenliği
    setGenislikPx(Math.ceil(m.getBoundingClientRect().width) + 4);
  }, [taslak, duzenleniyor]);

  React.useEffect(() => {
    if (duzenleniyor) {
      const r = inputRef.current;
      if (r) {
        // Caret metnin sonuna — tüm metni seçme (kullanıcı yanlışlıkla hepsini
        // silmesin). Düzenleme bilinçli karakter düzeltme akışına yönlendirilir.
        r.focus();
        const son = r.value.length;
        r.setSelectionRange(son, son);
      }
    }
  }, [duzenleniyor]);

  const ac = () => {
    if (!duzenleyebilir) return;
    setTaslak(ad);
    setDuzenleniyor(true);
  };

  const iptal = () => {
    setTaslak(ad);
    setDuzenleniyor(false);
  };

  // Undo: önceki adı server'a tekrar yaz. Optimistic mutate cache'i hemen toparlar.
  const geriAl = (eskiAd: string) => {
    if (!duzenleyebilir) return;
    guncelle.mutate(
      { id: projeId, ad: eskiAd },
      { onSuccess: () => toast.basari("Proje adı geri alındı") },
    );
  };

  const kaydet = () => {
    const yeni = taslak.trim();
    if (yeni === ad) {
      setDuzenleniyor(false);
      return;
    }
    if (yeni.length < MIN_UZUNLUK || yeni.length > MAX_UZUNLUK) {
      toast.hata(`Ad ${MIN_UZUNLUK}-${MAX_UZUNLUK} karakter arasında olmalı`);
      return;
    }
    const onceki = ad;
    guncelle.mutate(
      { id: projeId, ad: yeni },
      {
        onSuccess: () =>
          toast.gerial("Proje adı güncellendi", {
            id: GERIAL_TOAST_ID,
            butonMetni: "Geri al",
            onUndo: () => geriAl(onceki),
          }),
      },
    );
    setDuzenleniyor(false);
  };

  const tusYakala = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      kaydet();
    } else if (e.key === "Escape") {
      e.preventDefault();
      iptal();
    }
  };

  if (duzenleniyor) {
    // Input genişliği = ölçülen metin genişliği. Parent flex container'ında
    // mevcut alan kadar maksimuma sınırlanır (max-w-full). Min-w-0 ile hiç
    // metin yokken bile çökmez (clamp altta input kendi padding'iyle).
    return (
      <span className={cn("relative inline-block max-w-full", className)}>
        {/* Görünmez ölçüm — input ile aynı font/padding/border */}
        <span
          ref={olcumRef}
          aria-hidden
          className="invisible absolute -z-10 whitespace-pre px-2 text-sm font-semibold sm:text-base"
        >
          {taslak || " "}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={taslak}
          maxLength={MAX_UZUNLUK}
          onChange={(e) => setTaslak(e.target.value)}
          onBlur={kaydet}
          onKeyDown={tusYakala}
          aria-label="Proje adı"
          style={genislikPx ? { width: genislikPx } : undefined}
          className={cn(
            "border-input bg-background min-h-9 max-w-full rounded-sm border px-2 text-sm font-semibold sm:text-base",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={ac}
      disabled={!duzenleyebilir}
      aria-label={duzenleyebilir ? "Adı düzenle" : undefined}
      className={cn(
        "min-w-0 truncate rounded-sm px-1 text-left",
        duzenleyebilir
          ? "hover:bg-muted/60 cursor-text"
          : "cursor-default",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {ad}
    </button>
  );
}
