// Sprint 3 / S3-11 — TanStack Query key konvansiyonu.
//
// Kontrol Kural 23: query key array-based, hiyerarşik. Bu modül tüm
// uygulamada kullanılan query key'ler için tek nokta sağlar — typo'ları
// önler ve invalidation pattern'lerini netleştirir.
//
// Kullanım:
//   useQuery({ queryKey: QK.kullanicilar.liste({ sayfa: 1 }), ... })
//   istemci.invalidateQueries({ queryKey: QK.kullanicilar.tum() })

export const QK = {
  // Kullanıcılar
  kullanicilar: {
    tum: () => ["kullanicilar"] as const,
    liste: (filtre: Record<string, unknown>) =>
      ["kullanicilar", "liste", filtre] as const,
    detay: (id: string) => ["kullanicilar", id] as const,
  },

  // Roller
  roller: {
    tum: () => ["roller"] as const,
    liste: () => ["roller", "liste"] as const,
  },

  // Birimler
  birimler: {
    tum: () => ["birimler"] as const,
    liste: () => ["birimler", "liste"] as const,
    secenekler: () => ["birimler", "secenekler"] as const,
  },

  // Projeler
  projeler: {
    tum: () => ["projeler"] as const,
    liste: (filtre?: { filtre?: string }) =>
      filtre ? (["projeler", "liste", filtre] as const) : (["projeler", "liste"] as const),
    detay: (id: string) => ["projeler", id] as const,
  },

  // Kartlar
  kart: {
    tum: () => ["kart"] as const,
    detay: (id: string) => ["kart", id] as const,
    yorumlar: (kartId: string) => ["kart", kartId, "yorumlar"] as const,
    eklentiler: (kartId: string) => ["kart", kartId, "eklentiler"] as const,
    kontrolListeleri: (kartId: string) =>
      ["kart", kartId, "kontrol-listeleri"] as const,
    yetkililer: (kartId: string) => ["kart", kartId, "yetkililer"] as const,
    aktivite: (kartId: string) => ["aktivite", kartId] as const,
  },

  // Listeler (kanban kolonu)
  liste: {
    tum: () => ["liste"] as const,
    detay: (id: string) => ["liste", id] as const,
  },

  // Bildirimler
  bildirimler: {
    tum: () => ["bildirimler"] as const,
    liste: (filtre?: { okundu_mu?: boolean }) =>
      filtre ? (["bildirimler", filtre] as const) : (["bildirimler"] as const),
    sayim: () => ["bildirimler", "sayim"] as const,
  },

  // Dosyalar
  dosyalar: {
    tum: () => ["dosyalar"] as const,
    liste: (filtre: Record<string, unknown>) =>
      ["dosyalar", "liste", filtre] as const,
    detay: (id: string) => ["dosyalar", id] as const,
    projeAgaci: (projeId: string) =>
      ["dosyalar", "proje-agaci", projeId] as const,
    klasorListesi: () => ["dosyalar", "proje-klasor-listesi"] as const,
  },

  // Aktivite günlüğü
  aktivite: {
    tum: () => ["aktivite-gunlugu"] as const,
    liste: (filtre: Record<string, unknown>) =>
      ["aktivite-gunlugu", filtre] as const,
    secenekler: (q?: string) =>
      q ? (["aktivite-gunlugu", "secenekler", q] as const) : (["aktivite-gunlugu", "secenekler"] as const),
  },

  // Onaylar (kart/madde tamamlama önerileri)
  onaylar: {
    tum: () => ["onaylar"] as const,
    bekleyenKart: (filtre: Record<string, unknown>) =>
      ["onaylar", "kart", filtre] as const,
    bekleyenMadde: (filtre: Record<string, unknown>) =>
      ["onaylar", "madde", filtre] as const,
    sayim: () => ["onaylar", "sayim"] as const,
  },

  // Genel arama
  arama: {
    sonuc: (sorgu: string, tipler?: readonly string[]) =>
      ["genel-arama", sorgu, tipler ?? "hepsi"] as const,
  },
} as const;
