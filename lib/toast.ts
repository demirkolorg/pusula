import { toast as sonner } from "sonner";

type Secenek = {
  aciklama?: string;
  sure?: number;
  id?: string | number;
};

type GerialSecenek = Secenek & {
  onUndo: () => void;
  butonMetni?: string;
};

type YuklemeSecenek<T> = {
  yukleme: string;
  basari: string | ((veri: T) => string);
  hata: string | ((err: unknown) => string);
};

export const toast = {
  basari: (mesaj: string, sec?: Secenek) =>
    sonner.success(mesaj, {
      description: sec?.aciklama,
      duration: sec?.sure,
      id: sec?.id,
    }),

  hata: (mesaj: string, sec?: Secenek) =>
    sonner.error(mesaj, {
      description: sec?.aciklama,
      duration: sec?.sure ?? 6000,
      id: sec?.id,
    }),

  bilgi: (mesaj: string, sec?: Secenek) =>
    sonner.info(mesaj, {
      description: sec?.aciklama,
      duration: sec?.sure,
      id: sec?.id,
    }),

  uyari: (mesaj: string, sec?: Secenek) =>
    sonner.warning(mesaj, {
      description: sec?.aciklama,
      duration: sec?.sure,
      id: sec?.id,
    }),

  gerial: (mesaj: string, sec: GerialSecenek) =>
    sonner(mesaj, {
      description: sec.aciklama,
      duration: sec.sure ?? 5000,
      id: sec.id,
      action: {
        label: sec.butonMetni ?? "Geri al",
        onClick: sec.onUndo,
      },
    }),

  yukleniyor: <T>(soz: Promise<T>, sec: YuklemeSecenek<T>) =>
    sonner.promise<T>(soz, {
      loading: sec.yukleme,
      success: (veri) =>
        typeof sec.basari === "function" ? sec.basari(veri) : sec.basari,
      error: (err) =>
        typeof sec.hata === "function" ? sec.hata(err) : sec.hata,
    }),

  kapat: (id?: string | number) => sonner.dismiss(id),
};

export type ToastApi = typeof toast;
