"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "@/lib/toast";
import { KURUM_TIP_LABEL, kurumGorunenAd } from "@/lib/constants/kurum";
import { kurumSecenekleriniGetir } from "../../kurumlar/actions";
import { kullaniciGuncelleEylem, rolListele } from "../actions";
import {
  kullaniciGuncelleSemasi,
  type KullaniciGuncelle,
} from "../schemas";

type Rol = { id: string; kod: string; ad: string };
type Kayit = {
  id: string;
  ad: string;
  soyad: string;
  unvan: string | null;
  telefon: string | null;
  kurum_id: string;
  aktif: boolean;
  roller: Rol[];
} | null;

type Props = {
  kayit: Kayit;
  kapat: () => void;
  basaridaTetikle?: () => void;
};

export function KullaniciDuzenleSheet({ kayit, kapat, basaridaTetikle }: Props) {
  const acik = !!kayit;

  const form = useForm<KullaniciGuncelle>({
    resolver: zodResolver(kullaniciGuncelleSemasi),
    defaultValues: {
      id: "",
      ad: "",
      soyad: "",
      unvan: "",
      telefon: "",
      kurum_id: "",
      aktif: true,
      rol_idleri: [],
    },
  });

  React.useEffect(() => {
    if (kayit) {
      form.reset({
        id: kayit.id,
        ad: kayit.ad,
        soyad: kayit.soyad,
        unvan: kayit.unvan ?? "",
        telefon: kayit.telefon ?? "",
        kurum_id: kayit.kurum_id,
        aktif: kayit.aktif,
        rol_idleri: kayit.roller.map((r) => r.id),
      });
    }
  }, [kayit, form]);

  const rolSorgu = useQuery({
    queryKey: ["roller"],
    queryFn: async () => {
      const r = await rolListele(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: acik,
  });

  const kurumSorgu = useQuery({
    queryKey: ["kurum-secenekleri"],
    queryFn: async () => {
      const r = await kurumSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: acik,
  });

  const guncelleMut = useMutation({
    mutationFn: async (veri: KullaniciGuncelle) => {
      const r = await kullaniciGuncelleEylem(veri);
      if (!r.basarili) throw r;
      return r.veri;
    },
    onSuccess: () => {
      toast.basari("Kullanıcı güncellendi.");
      basaridaTetikle?.();
      kapat();
    },
  });

  const gonder = form.handleSubmit(async (veri) => {
    try {
      await guncelleMut.mutateAsync(veri);
    } catch (err: unknown) {
      const sonuc = err as { hata?: string; alanlar?: Record<string, string> };
      if (sonuc.alanlar) {
        for (const [alan, m] of Object.entries(sonuc.alanlar)) {
          form.setError(alan as keyof KullaniciGuncelle, { message: m });
        }
      }
      toast.hata(sonuc.hata ?? "Kaydedilemedi");
    }
  });

  const kurumDeger = form.watch("kurum_id");
  const aktifDeger = form.watch("aktif");
  const rolDeger = form.watch("rol_idleri");

  const rolSec = (id: string, deger: boolean) => {
    const mevcut = new Set(rolDeger);
    if (deger) mevcut.add(id);
    else mevcut.delete(id);
    form.setValue("rol_idleri", Array.from(mevcut));
  };

  return (
    <ResponsiveDialog open={acik} onOpenChange={(o) => (o ? null : kapat())}>
      <ResponsiveDialogContent className="flex w-full flex-col gap-4 p-0 sm:max-w-md">
        <ResponsiveDialogHeader className="border-b p-4">
          <ResponsiveDialogTitle>Kullanıcıyı Düzenle</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Kişisel bilgiler, kurum ataması ve roller.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={gonder}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ad">Ad</Label>
              <Input id="ad" {...form.register("ad")} />
              {form.formState.errors.ad && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.ad.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="soyad">Soyad</Label>
              <Input id="soyad" {...form.register("soyad")} />
              {form.formState.errors.soyad && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.soyad.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="unvan">Unvan</Label>
            <Input id="unvan" {...form.register("unvan")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input id="telefon" inputMode="tel" {...form.register("telefon")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="kurum_secici">Kurum</Label>
            <Select
              value={kurumDeger}
              onValueChange={(v) => form.setValue("kurum_id", v ?? "")}
            >
              <SelectTrigger id="kurum_secici">
                <SelectValue placeholder="Kurum seçin" />
              </SelectTrigger>
              <SelectContent>
                {(kurumSorgu.data ?? []).map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {kurumGorunenAd({ ad: k.ad, tip: k.tip })}
                    {k.ad && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {KURUM_TIP_LABEL[k.tip]}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.kurum_id && (
              <p className="text-destructive text-sm">
                {form.formState.errors.kurum_id.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Hesap aktif</Label>
              <p className="text-muted-foreground text-xs">
                Pasif kullanıcılar giriş yapamaz.
              </p>
            </div>
            <Switch
              checked={aktifDeger}
              onCheckedChange={(v) => form.setValue("aktif", v)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Roller</Label>
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              {(rolSorgu.data ?? []).map((r) => {
                const secili = rolDeger.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={secili}
                      onCheckedChange={(v) => rolSec(r.id, v === true)}
                    />
                    <span className="font-medium">{r.ad}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.kod}
                    </span>
                  </label>
                );
              })}
              {(rolSorgu.data ?? []).length === 0 && (
                <p className="text-muted-foreground text-xs">
                  Henüz tanımlı rol yok.
                </p>
              )}
            </div>
          </div>
        </form>

        <ResponsiveDialogFooter className="border-t p-4">
          <Button type="button" variant="outline" onClick={kapat}>
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={gonder}
            disabled={guncelleMut.isPending}
          >
            {guncelleMut.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Kaydediliyor
              </>
            ) : (
              "Güncelle"
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
