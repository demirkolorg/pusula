"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { BirimKategorisi, BirimTipi } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useOptimisticMutation, eylemMutasyonu } from "@/lib/optimistic";
import {
  BIRIM_KATEGORI_LABEL,
  BIRIM_KATEGORI_TIPLER,
  BIRIM_TIP_LABEL,
  birimTekilMi,
  birimTipininKategorisi,
} from "@/lib/constants/birim";
import { birimGuncelleEylem, birimOlusturEylem } from "../actions";
import {
  birimGuncelleSemasi,
  birimOlusturSemasi,
  type BirimGuncelle,
  type BirimOlustur,
} from "../schemas";

type Baslangic = {
  id: string;
  ad: string | null;
  kisa_ad: string | null;
  kategori: BirimKategorisi;
  tip: BirimTipi;
  il: string | null;
  ilce: string | null;
  aktif: boolean;
} | null;

type Props = {
  acik: boolean;
  kapat: () => void;
  baslangic: Baslangic;
  basaridaTetikle?: () => void;
};

export function BirimFormSheet({ acik, kapat, baslangic, basaridaTetikle }: Props) {
  const duzenleme = !!baslangic;

  const form = useForm<BirimOlustur & Partial<Pick<BirimGuncelle, "id" | "aktif">>>({
    resolver: zodResolver(duzenleme ? birimGuncelleSemasi : birimOlusturSemasi),
    defaultValues: {
      kategori: "MULKI_IDARE",
      tip: "KAYMAKAMLIK",
      ad: "",
      kisa_ad: "",
      il: "",
      ilce: "",
    },
  });

  React.useEffect(() => {
    if (acik) {
      if (baslangic) {
        form.reset({
          id: baslangic.id,
          kategori: baslangic.kategori,
          tip: baslangic.tip,
          ad: baslangic.ad ?? "",
          kisa_ad: baslangic.kisa_ad ?? "",
          il: baslangic.il ?? "",
          ilce: baslangic.ilce ?? "",
          aktif: baslangic.aktif,
        });
      } else {
        form.reset({
          kategori: "MULKI_IDARE",
          tip: "KAYMAKAMLIK",
          ad: "",
          kisa_ad: "",
          il: "",
          ilce: "",
        });
      }
    }
  }, [acik, baslangic, form]);

  // Liste cache shape'i — hem aktifler hem silinmişler hem her sayfa için
  // birden fazla anahtar olduğundan optimistic patch yerine invalidate ile
  // tazeliyoruz (Kural 108: wrapper). Yeni kayıt eklemede swap karmaşıklığı
  // olmadan basit invalidation iyi UX sağlar — listede bir an boş görünüm
  // olmaz çünkü TanStack Query staleTime default'la mevcut veriyi gösterir.
  const olusturMut = useOptimisticMutation<BirimOlustur, { id: string }>({
    queryKey: ["birimler"],
    mutationFn: eylemMutasyonu(birimOlusturEylem),
    hataMesaji: "Birim eklenemedi",
    basariMesaji: "Birim eklendi.",
    onSettledExtra: () => {
      basaridaTetikle?.();
    },
  });

  const guncelleMut = useOptimisticMutation<BirimGuncelle, { id: string }>({
    queryKey: ["birimler"],
    mutationFn: eylemMutasyonu(birimGuncelleEylem),
    optimistic: (old, vars) => {
      const v = old as
        | {
            kayitlar: Array<{ id: string } & Record<string, unknown>>;
            toplam: number;
          }
        | undefined;
      if (!v) return old;
      return {
        ...v,
        kayitlar: v.kayitlar.map((k) =>
          k.id === vars.id
            ? {
                ...k,
                kategori: vars.kategori,
                tip: vars.tip,
                ad: vars.ad ?? null,
                kisa_ad: vars.kisa_ad ?? null,
                il: vars.il ?? null,
                ilce: vars.ilce ?? null,
                ...(typeof vars.aktif === "boolean"
                  ? { aktif: vars.aktif }
                  : {}),
              }
            : k,
        ),
      };
    },
    hataMesaji: "Birim güncellenemedi",
    basariMesaji: "Birim güncellendi.",
    onSettledExtra: () => {
      basaridaTetikle?.();
    },
  });

  const yukleniyor = olusturMut.isPending || guncelleMut.isPending;

  const gonder = form.handleSubmit(async (veri) => {
    try {
      if (duzenleme && baslangic) {
        await guncelleMut.mutateAsync({
          id: baslangic.id,
          kategori: veri.kategori,
          tip: veri.tip,
          ad: veri.ad,
          kisa_ad: veri.kisa_ad,
          il: veri.il,
          ilce: veri.ilce,
          aktif: veri.aktif ?? baslangic.aktif,
        });
      } else {
        await olusturMut.mutateAsync({
          kategori: veri.kategori,
          tip: veri.tip,
          ad: veri.ad,
          kisa_ad: veri.kisa_ad,
          il: veri.il,
          ilce: veri.ilce,
        });
      }
      kapat();
    } catch {
      // Hata toast'ı useOptimisticMutation tarafından gösterildi;
      // form açık kalsın, kullanıcı düzeltsin.
    }
  });

  const kategoriDeger = form.watch("kategori");
  const tipDeger = form.watch("tip");
  const aktifDeger = form.watch("aktif");
  const tekilTip = tipDeger ? birimTekilMi(tipDeger) : false;

  // Kategori değişince ilk tipi otomatik seç
  const kategoriDegistir = (yeniKategori: BirimKategorisi) => {
    form.setValue("kategori", yeniKategori);
    const tipler = BIRIM_KATEGORI_TIPLER[yeniKategori] ?? [];
    const ilkTip = tipler[0];
    if (ilkTip && !tipler.includes(tipDeger)) {
      form.setValue("tip", ilkTip);
    }
  };

  // Tip değişince kategoriyi otomatik senkronla
  const tipDegistir = (yeniTip: BirimTipi) => {
    form.setValue("tip", yeniTip);
    form.setValue("kategori", birimTipininKategorisi(yeniTip));
  };

  const kategoriler = Object.keys(BIRIM_KATEGORI_LABEL) as BirimKategorisi[];
  const aktifTipler = BIRIM_KATEGORI_TIPLER[kategoriDeger] ?? [];

  return (
    <ResponsiveDialog open={acik} onOpenChange={(o) => (o ? null : kapat())}>
      <ResponsiveDialogContent className="flex w-full flex-col gap-4 p-0 sm:max-w-md">
        <ResponsiveDialogHeader className="border-b p-4">
          <ResponsiveDialogTitle>
            {duzenleme ? "Birimu Düzenle" : "Yeni Birim"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Birimin kategorisini ve tipini seçin. Tekil tiplerde ad opsiyoneldir;
            çoklu tiplerde (eczane, okul, cami vb.) ad zorunludur.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={gonder}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="kategori">Kategori</Label>
            <Select
              value={kategoriDeger}
              onValueChange={(v) => kategoriDegistir(v as BirimKategorisi)}
            >
              <SelectTrigger id="kategori">
                <SelectValue>
                  {(v) =>
                    v ? (BIRIM_KATEGORI_LABEL[v as BirimKategorisi] ?? "") : ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {kategoriler.map((k) => (
                  <SelectItem key={k} value={k}>
                    {BIRIM_KATEGORI_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tip">Tip</Label>
            <Select
              value={tipDeger}
              onValueChange={(v) => tipDegistir(v as BirimTipi)}
            >
              <SelectTrigger id="tip">
                <SelectValue>
                  {(v) => (v ? (BIRIM_TIP_LABEL[v as BirimTipi] ?? "") : "")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {aktifTipler.map((t) => (
                  <SelectItem key={t} value={t}>
                    {BIRIM_TIP_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {tekilTip
                ? "Tekil tip — ad opsiyoneldir."
                : "Çoklu tip — ad zorunludur."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ad">
              Ad {tekilTip ? "(opsiyonel)" : ""}
            </Label>
            <Input
              id="ad"
              autoFocus
              placeholder={
                tekilTip
                  ? BIRIM_TIP_LABEL[tipDeger]
                  : "Örn. Şifa Eczanesi"
              }
              {...form.register("ad")}
            />
            {form.formState.errors.ad && (
              <p className="text-destructive text-sm">
                {form.formState.errors.ad.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="kisa_ad">Kısa Ad (opsiyonel)</Label>
            <Input id="kisa_ad" {...form.register("kisa_ad")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="il">İl</Label>
              <Input id="il" {...form.register("il")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ilce">İlçe</Label>
              <Input id="ilce" {...form.register("ilce")} />
            </div>
          </div>

          {duzenleme && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Aktif</Label>
                <p className="text-muted-foreground text-xs">
                  Pasif birimler listede görünmez.
                </p>
              </div>
              <Switch
                checked={aktifDeger ?? true}
                onCheckedChange={(v) => form.setValue("aktif", v)}
              />
            </div>
          )}
        </form>

        <ResponsiveDialogFooter className="border-t p-4">
          <Button type="button" variant="outline" onClick={kapat}>
            Vazgeç
          </Button>
          <Button type="button" onClick={gonder} disabled={yukleniyor}>
            {yukleniyor ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Kaydediliyor
              </>
            ) : duzenleme ? (
              "Güncelle"
            ) : (
              "Kaydet"
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
