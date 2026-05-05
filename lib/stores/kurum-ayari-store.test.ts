import { describe, it, expect, beforeEach } from "vitest";

import {
  KURUM_ADI_VARSAYILAN,
  UYGULAMA_ADI_VARSAYILAN,
  VARSAYILAN_AYARLAR,
  useKurumAyariStore,
} from "./kurum-ayari-store";

beforeEach(() => {
  window.localStorage.clear();
  useKurumAyariStore.setState({ ...VARSAYILAN_AYARLAR });
});

describe("kurum-ayari-store", () => {
  it("varsayılan değerler yüklenir", () => {
    const durum = useKurumAyariStore.getState();
    expect(durum.kurumAdi).toBe(KURUM_ADI_VARSAYILAN);
    expect(durum.uygulamaAdi).toBe(UYGULAMA_ADI_VARSAYILAN);
  });

  it("ayarlariGuncelle: yalnız verilen alanları günceller", () => {
    useKurumAyariStore.getState().ayarlariGuncelle({ kurumAdi: "Yeni Kurum" });
    const durum = useKurumAyariStore.getState();
    expect(durum.kurumAdi).toBe("Yeni Kurum");
    expect(durum.uygulamaAdi).toBe(UYGULAMA_ADI_VARSAYILAN);
  });

  it("ayarlariGuncelle: trim uygular", () => {
    useKurumAyariStore.getState().ayarlariGuncelle({
      kurumAdi: "  Boşluklu Kurum  ",
      uygulamaAdi: "  Uygulama  ",
    });
    const durum = useKurumAyariStore.getState();
    expect(durum.kurumAdi).toBe("Boşluklu Kurum");
    expect(durum.uygulamaAdi).toBe("Uygulama");
  });

  it("ayarlariGuncelle: sadece boşluk içeren değer önceki değeri korur", () => {
    useKurumAyariStore.getState().ayarlariGuncelle({ kurumAdi: "Önceki" });
    useKurumAyariStore.getState().ayarlariGuncelle({ kurumAdi: "   " });
    expect(useKurumAyariStore.getState().kurumAdi).toBe("Önceki");
  });

  it("varsayilanaSifirla: değerleri varsayılana döndürür", () => {
    useKurumAyariStore.getState().ayarlariGuncelle({
      kurumAdi: "Bambaşka",
      uygulamaAdi: "Farklı",
    });
    useKurumAyariStore.getState().varsayilanaSifirla();
    const durum = useKurumAyariStore.getState();
    expect(durum.kurumAdi).toBe(KURUM_ADI_VARSAYILAN);
    expect(durum.uygulamaAdi).toBe(UYGULAMA_ADI_VARSAYILAN);
  });

  it("persist: localStorage'a yazılır (kurumAdi + uygulamaAdi)", () => {
    useKurumAyariStore.getState().ayarlariGuncelle({
      kurumAdi: "Persist Kurum",
      uygulamaAdi: "Persist Uygulama",
    });
    const ham = window.localStorage.getItem("pusula:kurum-ayari");
    expect(ham).not.toBeNull();
    const veri = JSON.parse(ham!);
    expect(veri.state.kurumAdi).toBe("Persist Kurum");
    expect(veri.state.uygulamaAdi).toBe("Persist Uygulama");
    expect(veri.state.ayarlariGuncelle).toBeUndefined();
  });
});
