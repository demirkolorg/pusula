"use client";

import * as React from "react";

// @mention textarea state machine.
//
// Davranış:
// 1. Kullanıcı `@` yazar — açık moduna geç, query = ""
// 2. Sonra harfler yazar — query büyür, popover filtreler
// 3. Boşluk veya newline → kapan
// 4. Backspace `@`'i siler → kapan
// 5. Caret bir mention bölgesinin dışına çıkarsa → kapan
// 6. Kullanıcı seçtiğinde `secimYap(uuid, gosterim)` çağrılır

export type MentionDurum = {
  acik: boolean;
  query: string;
  // @ karakterinin index'i (textarea içinde)
  baslangicIdx: number;
  // Caret pozisyonu (yapısı: textarea.selectionStart)
  caretIdx: number;
};

const KAPALI: MentionDurum = {
  acik: false,
  query: "",
  baslangicIdx: -1,
  caretIdx: -1,
};

export function useMentionInput(
  metin: string,
  setMetin: (s: string) => void,
): {
  durum: MentionDurum;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onMetinDegisti: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKlavye: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  secimYap: (uuid: string) => void;
  iptal: () => void;
} {
  const [durum, setDurum] = React.useState<MentionDurum>(KAPALI);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const yenidenHesapla = React.useCallback((yeniMetin: string, caret: number) => {
    // Caret'ten geriye doğru git, en yakın `@`'i bul. Boşluk/newline'a
    // çarparsa açık modu kapanır.
    let i = caret - 1;
    while (i >= 0) {
      const c = yeniMetin[i];
      if (c === "@") {
        // Önündeki karakter yoksa veya whitespace ise → geçerli mention başlangıcı
        const onceki = i > 0 ? (yeniMetin[i - 1] ?? "") : "";
        if (onceki === "" || /\s/.test(onceki)) {
          const query = yeniMetin.slice(i + 1, caret);
          // Query içinde whitespace varsa zaten kapanmıştır — döngüde yakalanır
          if (!/\s/.test(query)) {
            setDurum({
              acik: true,
              query,
              baslangicIdx: i,
              caretIdx: caret,
            });
            return;
          }
        }
        setDurum(KAPALI);
        return;
      }
      if (/\s/.test(c ?? "")) {
        // Whitespace — kapan
        setDurum(KAPALI);
        return;
      }
      i--;
    }
    setDurum(KAPALI);
  }, []);

  const onMetinDegisti = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const yeni = e.target.value;
      const caret = e.target.selectionStart ?? yeni.length;
      setMetin(yeni);
      yenidenHesapla(yeni, caret);
    },
    [setMetin, yenidenHesapla],
  );

  const onKlavye = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape" && durum.acik) {
        e.preventDefault();
        setDurum(KAPALI);
      }
    },
    [durum.acik],
  );

  const secimYap = React.useCallback(
    (uuid: string) => {
      if (!durum.acik) return;
      const oncesi = metin.slice(0, durum.baslangicIdx);
      const sonrasi = metin.slice(durum.caretIdx);
      const yeniMetin = `${oncesi}@${uuid} ${sonrasi}`;
      setMetin(yeniMetin);
      setDurum(KAPALI);
      // Caret'i mention sonrası boşluğa konumla
      const yeniCaret = (oncesi + "@" + uuid + " ").length;
      // Render sonrası ref güncelliği için microtask
      queueMicrotask(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(yeniCaret, yeniCaret);
        }
      });
    },
    [durum, metin, setMetin],
  );

  const iptal = React.useCallback(() => setDurum(KAPALI), []);

  return {
    durum,
    textareaRef,
    onMetinDegisti,
    onKlavye,
    secimYap,
    iptal,
  };
}
