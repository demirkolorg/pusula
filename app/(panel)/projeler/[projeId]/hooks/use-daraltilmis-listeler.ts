"use client";

// Liste daralt durumunu reactive olarak okuma + yazma hook'u.
// useSyncExternalStore tabanlı: cross-tab `storage` event ile sync, snapshot
// cache + setlerEsit ile gereksiz re-render önleme. Detay: ADR yok, plan
// federated-swinging-swing.md.

import * as React from "react";
import {
  daraltStorageKey,
  daraltilmisListeleriOku,
  daraltilmisListeleriYaz,
  listeDaralt,
  listeDaraltToggle,
  listeGenislet,
  setlerEsit,
  tumDaralt,
  tumGenislet,
} from "../components/kanban-daralt";

type DaraltApi = {
  daraltilmisListeler: ReadonlySet<string>;
  toggle: (listeId: string) => void;
  daralt: (listeId: string) => void;
  genislet: (listeId: string) => void;
  tumunuDaralt: (idler: ReadonlyArray<string>) => void;
  tumunuGenislet: (idler: ReadonlyArray<string>) => void;
  yaz: (yeni: ReadonlySet<string>) => void;
};

// Modül-singleton dinleyici map'i: aynı projeyi izleyen tüm hook instance'ları
// projeId bazında birbiriyle sync olur. Aynı tab'da localStorage `storage`
// event'i tetiklenmediği için manuel dispatch gerekir (yaz API'si bu işi yapar).
type Dinleyici = () => void;
const dinleyiciler = new Map<string, Set<Dinleyici>>();

function dinleyiciEkle(projeId: string, fn: Dinleyici): () => void {
  let kume = dinleyiciler.get(projeId);
  if (!kume) {
    kume = new Set();
    dinleyiciler.set(projeId, kume);
  }
  kume.add(fn);
  return () => {
    const k = dinleyiciler.get(projeId);
    if (!k) return;
    k.delete(fn);
    if (k.size === 0) dinleyiciler.delete(projeId);
  };
}

function dinleyicileriCagir(projeId: string): void {
  dinleyiciler.get(projeId)?.forEach((fn) => fn());
}

// Snapshot cache: useSyncExternalStore her render'da getSnapshot() çağırır.
// Her seferinde yeni Set referansı dönersek React snapshot değişti sayar.
// Cache + setlerEsit ile referans tutarlılığı: aynı içerik → aynı referans.
const snapshotCache = new Map<string, ReadonlySet<string>>();

function snapshotAl(projeId: string): ReadonlySet<string> {
  const onceki = snapshotCache.get(projeId);
  const yeni = daraltilmisListeleriOku(projeId);
  if (onceki && setlerEsit(onceki, yeni)) return onceki;
  snapshotCache.set(projeId, yeni);
  return yeni;
}

// Modül-singleton storage event listener. Hook her mount'ta yeni listener
// kurmaz; tek listener tüm tab'ler arası `storage` event'ini dispatch eder.
let globalListenerKuruldu = false;
function globalStorageListenerKur(): void {
  if (globalListenerKuruldu || typeof window === "undefined") return;
  globalListenerKuruldu = true;
  const PRE = "pusula:liste-daralt:";
  window.addEventListener("storage", (e) => {
    if (!e.key || !e.key.startsWith(PRE)) return;
    const projeId = e.key.slice(PRE.length);
    snapshotCache.delete(projeId);
    dinleyicileriCagir(projeId);
  });
}

// SSR snapshot için sabit boş Set referansı — hydration mismatch yok.
const SSR_BOSU: ReadonlySet<string> = new Set();
const ssrSnapshot = (): ReadonlySet<string> => SSR_BOSU;

export function useDaraltilmisListeler(projeId: string): DaraltApi {
  React.useEffect(() => {
    globalStorageListenerKur();
  }, []);

  const subscribe = React.useCallback(
    (cb: Dinleyici) => dinleyiciEkle(projeId, cb),
    [projeId],
  );

  const getSnapshot = React.useCallback(
    () => snapshotAl(projeId),
    [projeId],
  );

  const daraltilmisListeler = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    ssrSnapshot,
  );

  const yaz = React.useCallback(
    (yeniSet: ReadonlySet<string>) => {
      daraltilmisListeleriYaz(projeId, yeniSet);
      // Yaz sonrası cache'i güncelle ve aynı tab'daki dinleyicileri uyandır
      // (storage event aynı tab'da tetiklenmez).
      snapshotCache.set(projeId, yeniSet);
      dinleyicileriCagir(projeId);
    },
    [projeId],
  );

  const toggle = React.useCallback(
    (listeId: string) => yaz(listeDaraltToggle(snapshotAl(projeId), listeId)),
    [projeId, yaz],
  );
  const daralt = React.useCallback(
    (listeId: string) => yaz(listeDaralt(snapshotAl(projeId), listeId)),
    [projeId, yaz],
  );
  const genislet = React.useCallback(
    (listeId: string) => yaz(listeGenislet(snapshotAl(projeId), listeId)),
    [projeId, yaz],
  );
  const tumunuDaralt = React.useCallback(
    (idler: ReadonlyArray<string>) =>
      yaz(tumDaralt(snapshotAl(projeId), idler)),
    [projeId, yaz],
  );
  const tumunuGenislet = React.useCallback(
    (idler: ReadonlyArray<string>) =>
      yaz(tumGenislet(snapshotAl(projeId), idler)),
    [projeId, yaz],
  );

  return {
    daraltilmisListeler,
    toggle,
    daralt,
    genislet,
    tumunuDaralt,
    tumunuGenislet,
    yaz,
  };
}

// Test ortamından modül-singleton state'i sıfırlamak için. Sadece test'lerde
// kullanılmalı; production kodunda çağrılmaz.
export function _daraltSingletonResetTestIcin(): void {
  dinleyiciler.clear();
  snapshotCache.clear();
}

// daraltStorageKey re-export — diğer modüller için tek import noktası.
export { daraltStorageKey };
