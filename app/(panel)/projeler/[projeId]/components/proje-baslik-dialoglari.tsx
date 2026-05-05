"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import {
  projeDetayKey,
  useProjeDetayArsivle,
  useProjeDetayGuncelle,
} from "../hooks/detay-sorgulari";
import type { ProjeDetayOzeti } from "../services";

// Header dropdown aksiyonlarına bağlı dialog'lar:
//   - Ad düzenle (Input + react-hook-form)
//   - Açıklama düzenle (Textarea + react-hook-form)
//   - Arşivle onay (AlertDialog)
// Her dialog kontrollü; tek `mod` state'i header tarafından yönetilir.

const adSemasi = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter").max(200),
});
const aciklamaSemasi = z.object({
  // Sıfırdan boş string'e izin ver — null'a dönüşür.
  aciklama: z.string().max(2000),
});

type AdVeri = z.infer<typeof adSemasi>;
type AciklamaVeri = z.infer<typeof aciklamaSemasi>;

export type DialogModu = "ad" | "aciklama" | "arsivle" | null;

type Props = {
  proje: ProjeDetayOzeti;
  mod: DialogModu;
  setMod: (m: DialogModu) => void;
};

export function ProjeBaslikDialoglari({ proje, mod, setMod }: Props) {
  const anahtar = React.useMemo(() => projeDetayKey(proje.id), [proje.id]);
  const guncelle = useProjeDetayGuncelle(anahtar);
  const arsivle = useProjeDetayArsivle(anahtar);
  const router = useRouter();

  const kapat = () => setMod(null);

  return (
    <>
      <AdDuzenleDialog
        acik={mod === "ad"}
        kapat={kapat}
        baslangic={proje.ad}
        yukleniyor={guncelle.isPending}
        kaydet={(ad) => {
          const onceki = proje.ad;
          guncelle.mutate(
            { id: proje.id, ad },
            {
              onSuccess: () => {
                toast.gerial("Proje adı güncellendi", {
                  id: "proje-ad-gerial",
                  butonMetni: "Geri al",
                  onUndo: () =>
                    guncelle.mutate(
                      { id: proje.id, ad: onceki },
                      {
                        onSuccess: () =>
                          toast.basari("Proje adı geri alındı"),
                      },
                    ),
                });
                kapat();
              },
            },
          );
        }}
      />
      <AciklamaDuzenleDialog
        acik={mod === "aciklama"}
        kapat={kapat}
        baslangic={proje.aciklama ?? ""}
        yukleniyor={guncelle.isPending}
        kaydet={(aciklama) => {
          const onceki = proje.aciklama;
          const yeniDeger = aciklama.trim() ? aciklama : null;
          guncelle.mutate(
            { id: proje.id, aciklama: yeniDeger },
            {
              onSuccess: () => {
                toast.gerial("Açıklama güncellendi", {
                  id: "proje-aciklama-gerial",
                  butonMetni: "Geri al",
                  onUndo: () =>
                    guncelle.mutate(
                      { id: proje.id, aciklama: onceki },
                      {
                        onSuccess: () =>
                          toast.basari("Açıklama geri alındı"),
                      },
                    ),
                });
                kapat();
              },
            },
          );
        }}
      />
      <ArsivleOnayDialog
        acik={mod === "arsivle"}
        kapat={kapat}
        yukleniyor={arsivle.isPending}
        onayla={() =>
          arsivle.mutate(
            { id: proje.id, arsiv_mi: true },
            {
              onSuccess: () => {
                toast.basari("Proje arşivlendi");
                kapat();
                router.push("/projeler");
              },
            },
          )
        }
      />
    </>
  );
}

// ============================================================
// Ad düzenle
// ============================================================

function AdDuzenleDialog(props: {
  acik: boolean;
  kapat: () => void;
  baslangic: string;
  yukleniyor: boolean;
  kaydet: (ad: string) => void;
}) {
  const { acik, kapat, baslangic, yukleniyor, kaydet } = props;
  const form = useForm<AdVeri>({
    resolver: zodResolver(adSemasi),
    defaultValues: { ad: baslangic },
  });

  React.useEffect(() => {
    if (acik) form.reset({ ad: baslangic });
  }, [acik, baslangic, form]);

  const gonder = form.handleSubmit((veri) => kaydet(veri.ad.trim()));

  return (
    <ResponsiveDialog open={acik} onOpenChange={(a) => !a && kapat()}>
      <ResponsiveDialogContent className="w-full sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Adı düzenle</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Proje adı listede ve başlıkta görünür.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={gonder} className="grid gap-4 px-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="proje-ad">Proje adı</Label>
            <Input
              id="proje-ad"
              autoFocus
              {...form.register("ad")}
              placeholder="Örn. Mart Ayı Hizmet Takibi"
            />
            {form.formState.errors.ad && (
              <p className="text-destructive text-xs">
                {form.formState.errors.ad.message}
              </p>
            )}
          </div>
        </form>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={kapat}>
            İptal
          </Button>
          <Button onClick={gonder} disabled={yukleniyor}>
            Kaydet
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// ============================================================
// Açıklama düzenle
// ============================================================

function AciklamaDuzenleDialog(props: {
  acik: boolean;
  kapat: () => void;
  baslangic: string;
  yukleniyor: boolean;
  kaydet: (aciklama: string) => void;
}) {
  const { acik, kapat, baslangic, yukleniyor, kaydet } = props;
  const form = useForm<AciklamaVeri>({
    resolver: zodResolver(aciklamaSemasi),
    defaultValues: { aciklama: baslangic },
  });

  React.useEffect(() => {
    if (acik) form.reset({ aciklama: baslangic });
  }, [acik, baslangic, form]);

  const gonder = form.handleSubmit((veri) => kaydet(veri.aciklama));

  return (
    <ResponsiveDialog open={acik} onOpenChange={(a) => !a && kapat()}>
      <ResponsiveDialogContent className="w-full sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Açıklama</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Bu proje neyi takip ediyor? Boş bırakılabilir.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={gonder} className="grid gap-4 px-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="proje-aciklama">Açıklama</Label>
            <Textarea
              id="proje-aciklama"
              rows={5}
              autoFocus
              {...form.register("aciklama")}
              placeholder="Projenin amacı, kapsamı, paydaşları..."
            />
            {form.formState.errors.aciklama && (
              <p className="text-destructive text-xs">
                {form.formState.errors.aciklama.message}
              </p>
            )}
          </div>
        </form>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={kapat}>
            İptal
          </Button>
          <Button onClick={gonder} disabled={yukleniyor}>
            Kaydet
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// ============================================================
// Arşivleme onay
// ============================================================

function ArsivleOnayDialog(props: {
  acik: boolean;
  kapat: () => void;
  yukleniyor: boolean;
  onayla: () => void;
}) {
  const { acik, kapat, yukleniyor, onayla } = props;
  return (
    <AlertDialog open={acik} onOpenChange={(a) => !a && kapat()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Proje arşivlensin mi?</AlertDialogTitle>
          <AlertDialogDescription>
            Arşivlenen proje aktif listeden kaldırılır. Arşiv klasöründen geri
            yükleyebilirsiniz; kartlar ve listeler silinmez.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={kapat}>İptal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={yukleniyor}
            onClick={onayla}
          >
            Arşivle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
