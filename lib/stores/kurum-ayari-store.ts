import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const KURUM_ADI_VARSAYILAN = "Tekman Kaymakamlığı";
export const UYGULAMA_ADI_VARSAYILAN = "Pusula İş Takip Yönetimi";

export const KURUM_ADI_MAX = 80;
export const UYGULAMA_ADI_MAX = 100;

const STORAGE_KEY = "pusula:kurum-ayari";

export type KurumAyari = {
  kurumAdi: string;
  uygulamaAdi: string;
};

export type KurumAyariStore = KurumAyari & {
  ayarlariGuncelle: (ayar: Partial<KurumAyari>) => void;
  varsayilanaSifirla: () => void;
};

export const VARSAYILAN_AYARLAR: KurumAyari = {
  kurumAdi: KURUM_ADI_VARSAYILAN,
  uygulamaAdi: UYGULAMA_ADI_VARSAYILAN,
};

export const useKurumAyariStore = create<KurumAyariStore>()(
  persist(
    (set) => ({
      ...VARSAYILAN_AYARLAR,
      ayarlariGuncelle: (ayar) =>
        set((onceki) => ({
          kurumAdi:
            ayar.kurumAdi !== undefined
              ? ayar.kurumAdi.trim() || onceki.kurumAdi
              : onceki.kurumAdi,
          uygulamaAdi:
            ayar.uygulamaAdi !== undefined
              ? ayar.uygulamaAdi.trim() || onceki.uygulamaAdi
              : onceki.uygulamaAdi,
        })),
      varsayilanaSifirla: () => set(VARSAYILAN_AYARLAR),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      partialize: ({ kurumAdi, uygulamaAdi }) => ({ kurumAdi, uygulamaAdi }),
      version: 1,
    },
  ),
);

const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};
