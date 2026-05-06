"use client";

import * as React from "react";
import { ListIcon } from "lucide-react";
import { TiptapEditor } from "@/components/tiptap";
import { tiptapDokumaniBosMu, type TiptapDokuman } from "@/lib/tiptap";
import { KartModalSectionBaslik } from "./kart-modal-section-baslik";

// ADR-0023 — Kart açıklaması Tiptap zengin metin editörü.
//
// Edit pattern (kullanıcı onaylı): onBlur debounced — kullanıcı yazarken
// 1500ms idle veya focus kaybı tetikler. Optimistic mutation cache'i anında
// günceller (Kontrol Kural 107-116).
//
// State stratejisi: lokal React state YOK; Tiptap editor kendi içeriğini
// yönetir, harici `dokuman` prop'u editor'e setContent ile yansır
// (tiptap-editor.tsx içinde JSON karşılaştırma var). Burada sadece debounce
// kuyruğu ve "son teslim edilen" referansı tutulur — kuyrukta bekleyen edit
// kart kapanırken flush edilebilsin diye.

const KAYDETME_GECIKMESI_MS = 1500;

type Props = {
  dokuman: TiptapDokuman | null;
  kaydet: (yeni: TiptapDokuman | null) => void;
  yetkili: boolean;
};

function dokumanlarEsit(a: TiptapDokuman | null, b: TiptapDokuman | null): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return tiptapDokumaniBosMu(a) && tiptapDokumaniBosMu(b);
  return JSON.stringify(a) === JSON.stringify(b);
}

export function KartModalAciklama({ dokuman, kaydet, yetkili }: Props) {
  // Editor'ün son ürettiği doc — debounce flush'unda kullanılır.
  const sonGuncelDokRef = React.useRef<TiptapDokuman | null>(dokuman);
  // Sunucuya en son gönderilen doc — gereksiz mutation gönderme kontrolü.
  const sonKaydedilenRef = React.useRef<TiptapDokuman | null>(dokuman);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sunucudan/realtime'dan yeni `dokuman` gelince referansları senkronize et —
  // gelen değer son kaydettiğimizle aynıysa hiçbir şey yapma. (Editor içeriği
  // tiptap-editor.tsx'in kendi useEffect'iyle setContent edilir.)
  React.useEffect(() => {
    if (!dokumanlarEsit(dokuman, sonKaydedilenRef.current)) {
      sonKaydedilenRef.current = dokuman;
    }
    sonGuncelDokRef.current = dokuman;
  }, [dokuman]);

  const teslimEt = React.useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const guncel = sonGuncelDokRef.current;
    if (dokumanlarEsit(guncel, sonKaydedilenRef.current)) return;
    sonKaydedilenRef.current = guncel;
    // Boş doc → null gönder (server da null'a yazar; semantic temizleme).
    kaydet(tiptapDokumaniBosMu(guncel) ? null : guncel);
  }, [kaydet]);

  const degisim = React.useCallback(
    (yeni: TiptapDokuman) => {
      sonGuncelDokRef.current = yeni;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (dokumanlarEsit(yeni, sonKaydedilenRef.current)) {
          debounceRef.current = null;
          return;
        }
        sonKaydedilenRef.current = yeni;
        kaydet(tiptapDokumaniBosMu(yeni) ? null : yeni);
        debounceRef.current = null;
      }, KAYDETME_GECIKMESI_MS);
    },
    [kaydet],
  );

  // Component unmount'ta kuyrukta bekleyen debounce'u flush et — modal
  // kapanırken yazılmış ama gönderilmemiş edit kaybolmasın.
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        teslimEt();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca unmount cleanup
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <KartModalSectionBaslik icon={ListIcon} baslik="Açıklama" />
      <TiptapEditor
        deger={dokuman}
        onDegisim={degisim}
        onTeslimEt={teslimEt}
        yetkili={yetkili}
        placeholder="Detay ekle, bağlam paylaş, link yapıştır…"
      />
    </div>
  );
}
