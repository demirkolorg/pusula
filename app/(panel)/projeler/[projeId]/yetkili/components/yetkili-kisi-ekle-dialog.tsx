"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  UserPlusIcon,
  UserRoundIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
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
import { useOptimisticMutation } from "@/lib/optimistic";
import { toast } from "@/lib/toast";
import {
  davetAdaptor,
  extraKisiKeys,
  kisiAdaptor,
} from "../yetkili-adaptor";
import { optimistikKisiEkle } from "../yetkili-optimistic";
import {
  PROJE_YETKI_SEVIYELERI,
  type ProjeYetkiSeviyesi,
} from "../schemas";
import {
  seviyeDestekliMi,
  type BekleyenDavetOzeti,
  type YetkiliKaynagi,
  type YetkiliKisiAdayi,
  type YetkiliKisiOzeti,
} from "../yetkili-tipler";
import { KisiAvatar } from "./kisi-avatar";
import { davetUygunlugunuHesapla } from "./yetkili-kisi-ekle-helper";

type Props = {
  acik: boolean;
  acikDegis: (acik: boolean) => void;
  kaynak: YetkiliKaynagi;
  mevcutKullaniciIdleri: ReadonlyArray<string>;
};

const SEVIYE_ETIKET: Record<ProjeYetkiSeviyesi, string> = {
  ADMIN: "Yönetici",
  NORMAL: "Üye",
  IZLEYICI: "İzleyici",
};

type Mod = "ara" | "davet";

export function YetkiliKisiEkleDialog({
  acik,
  acikDegis,
  kaynak,
  mevcutKullaniciIdleri,
}: Props) {
  const adaptor = React.useMemo(() => kisiAdaptor(kaynak), [kaynak]);
  const ekKeys = React.useMemo(() => extraKisiKeys(kaynak), [kaynak]);
  const davet = React.useMemo(() => davetAdaptor(kaynak), [kaynak]);
  const seviyeli = seviyeDestekliMi(kaynak);
  const [arama, setArama] = React.useState("");
  const [mod, setMod] = React.useState<Mod>("ara");
  const [davetEmail, setDavetEmail] = React.useState("");
  const [davetSeviye, setDavetSeviye] =
    React.useState<ProjeYetkiSeviyesi>("NORMAL");

  const adaylar = useQuery({
    queryKey: adaptor.adayQueryKey(arama),
    queryFn: () => adaptor.adaylar(arama),
    enabled: acik && mod === "ara",
    staleTime: 30_000,
  });

  const bekleyenDavetler = useQuery({
    queryKey: davet?.bekleyenleriQueryKey ?? ["proje-bekleyen-davetler", "yok"],
    queryFn: () => (davet ? davet.bekleyenler() : Promise.resolve([])),
    enabled: Boolean(davet) && acik,
    staleTime: 30_000,
  });

  const ekle = useOptimisticMutation<
    {
      kullanici_id: string;
      seviye: ProjeYetkiSeviyesi;
      aday: YetkiliKisiAdayi;
    },
    { kullanici_id: string; ozet?: YetkiliKisiOzeti }
  >({
    queryKey: adaptor.queryKey,
    mutationFn: ({ kullanici_id, seviye }) =>
      adaptor.ekle(kullanici_id, seviye),
    optimistic: (eski, vars) =>
      optimistikKisiEkle(
        eski as YetkiliKisiOzeti[] | undefined,
        vars.aday,
        seviyeli ? vars.seviye : null,
      ),
    swap: (eski, vars, yanit) => {
      if (!yanit.ozet) return eski as YetkiliKisiOzeti[] | undefined;
      const liste = (eski as YetkiliKisiOzeti[] | undefined) ?? [];
      return liste.map((k) =>
        k.kullanici_id === vars.kullanici_id ? yanit.ozet! : k,
      );
    },
    ekInvalidate: ekKeys,
    hataMesaji: "Yetkili eklenemedi",
    basariMesaji: "Yetkili eklendi",
  });

  const istemci = useQueryClient();
  const davetGonder = useMutation({
    mutationFn: ({
      email,
      seviye,
    }: {
      email: string;
      seviye: ProjeYetkiSeviyesi;
    }) => {
      if (!davet) throw new Error("Davet yalnız proje kaynağında mümkün.");
      return davet.davetGonder({ email, seviye });
    },
    onSuccess: async () => {
      toast.basari("Davet gönderildi.");
      if (davet) {
        await istemci.invalidateQueries({
          queryKey: davet.bekleyenleriQueryKey,
        });
      }
      setMod("ara");
      setDavetEmail("");
      setArama("");
    },
    onError: (err) => {
      toast.hata(err instanceof Error ? err.message : "Davet gönderilemedi.");
    },
  });

  const handleAcikDegis = (yeni: boolean) => {
    if (!yeni) {
      setArama("");
      setMod("ara");
      setDavetEmail("");
      setDavetSeviye("NORMAL");
    }
    acikDegis(yeni);
  };

  const mevcutSet = React.useMemo(
    () => new Set(mevcutKullaniciIdleri),
    [mevcutKullaniciIdleri],
  );
  const filtreliAdaylar = (adaylar.data ?? []).filter(
    (aday) => !mevcutSet.has(aday.id),
  );
  const yukleniyor = adaylar.isLoading;
  const aramaVar = arama.trim().length > 0;

  const bekleyenler = bekleyenDavetler.data ?? [];
  const bekleyenEmailleri = React.useMemo(
    () => bekleyenler.map((b) => b.email),
    [bekleyenler],
  );
  const adayEmailleri = React.useMemo(
    () => (adaylar.data ?? []).map((a) => a.email),
    [adaylar.data],
  );
  const davetUygunlugu = React.useMemo(
    () =>
      davetUygunlugunuHesapla({
        arama,
        adayEmailleri,
        bekleyenDavetEmailleri: bekleyenEmailleri,
      }),
    [arama, adayEmailleri, bekleyenEmailleri],
  );

  const davetCTAGoster =
    Boolean(davet) &&
    mod === "ara" &&
    !yukleniyor &&
    filtreliAdaylar.length === 0 &&
    davetUygunlugu.tip === "uygun";

  const davetMevcutBilgisi =
    davetUygunlugu.tip === "bekleyen" ? davetUygunlugu.email : null;

  const davetAcabilir = Boolean(davet);
  const davetGonderebilir = davet !== null;

  if (mod === "davet" && davet) {
    return (
      <ResponsiveDialog open={acik} onOpenChange={handleAcikDegis}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <span
                className="bg-muted flex size-8 items-center justify-center rounded-md"
                aria-hidden
              >
                <MailIcon className="size-4" />
              </span>
              Davet ile ekle
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Bu kişi sistemde kayıtlı değil. Davet kabul edildiğinde projeye
              otomatik yetkili olarak eklenir. Bağlantı 7 gün geçerlidir.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="davet-email">E-posta</Label>
              <div className="relative">
                <MailIcon
                  className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  id="davet-email"
                  type="email"
                  inputMode="email"
                  className="h-9 pl-9"
                  placeholder="ad.soyad@birim.gov.tr"
                  value={davetEmail}
                  onChange={(e) => setDavetEmail(e.target.value)}
                  disabled={davetGonder.isPending}
                  autoFocus
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="davet-seviye">Proje yetkisi</Label>
              <Select
                value={davetSeviye}
                onValueChange={(v) =>
                  setDavetSeviye(v as ProjeYetkiSeviyesi)
                }
                disabled={davetGonder.isPending}
              >
                <SelectTrigger id="davet-seviye" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJE_YETKI_SEVIYELERI.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVIYE_ETIKET[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Davet kabul edilince kişi bu seviye ile projeye yetkili olur.
              </p>
            </div>
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMod("ara")}
              disabled={davetGonder.isPending}
            >
              <ArrowLeftIcon className="size-4" /> Geri
            </Button>
            <Button
              type="button"
              onClick={() =>
                davetGonder.mutate({
                  email: davetEmail.trim(),
                  seviye: davetSeviye,
                })
              }
              disabled={
                davetGonder.isPending ||
                davetUygunlugunuHesapla({
                  arama: davetEmail,
                  adayEmailleri,
                  bekleyenDavetEmailleri: bekleyenEmailleri,
                }).tip !== "uygun"
              }
            >
              <SendIcon className="size-4" />
              {davetGonder.isPending ? "Gönderiliyor..." : "Davet Gönder"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog open={acik} onOpenChange={handleAcikDegis}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <span
              className="bg-muted flex size-8 items-center justify-center rounded-md"
              aria-hidden
            >
              <UserRoundIcon className="size-4" />
            </span>
            Kişi yetkisi ekle
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Birim üyeliğinden bağımsız olarak kişiye doğrudan erişim verir.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-3">
          <div className="relative">
            <SearchIcon
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="İsim, e-posta veya birim yazın..."
              className="h-9 pl-9"
              autoFocus
            />
          </div>

          <div className="border-border bg-card max-h-72 min-h-32 overflow-y-auto rounded-md border">
            {yukleniyor ? (
              <BosDurum metin="Yükleniyor..." />
            ) : filtreliAdaylar.length === 0 ? (
              <div className="text-muted-foreground flex h-32 flex-col items-center justify-center gap-2 px-4 text-center text-sm">
                <p className="italic">
                  {aramaVar
                    ? "Eşleşen kişi bulunamadı."
                    : "Aramak için yazmaya başlayın."}
                </p>
                {davetMevcutBilgisi ? (
                  <p className="text-foreground/70 text-xs">
                    <strong>{davetMevcutBilgisi}</strong> için bekleyen davet
                    var.
                  </p>
                ) : null}
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {filtreliAdaylar.map((aday) => (
                  <li key={aday.id}>
                    <button
                      type="button"
                      disabled={ekle.isPending}
                      onClick={() =>
                        ekle.mutate({
                          kullanici_id: aday.id,
                          seviye: "NORMAL",
                          aday,
                        })
                      }
                      className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <KisiAvatar ad={aday.ad} soyad={aday.soyad} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {aday.ad} {aday.soyad}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {aday.birim_ad ?? aday.email}
                        </p>
                      </div>
                      <PlusIcon
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {davetCTAGoster && davetGonderebilir ? (
            <button
              type="button"
              className="border-primary/40 bg-primary/5 hover:bg-primary/10 focus-visible:ring-ring flex items-center gap-3 rounded-md border border-dashed px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
              onClick={() => {
                if (davetUygunlugu.tip !== "uygun") return;
                setDavetEmail(davetUygunlugu.email);
                setMod("davet");
              }}
            >
              <span
                className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md"
                aria-hidden
              >
                <UserPlusIcon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  Davet ile ekle:{" "}
                  {davetUygunlugu.tip === "uygun"
                    ? davetUygunlugu.email
                    : ""}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  Sistemde kayıtlı değil — davet ve proje yetkisi birlikte
                  gönderilir.
                </span>
              </span>
              <SendIcon
                className="text-primary size-4 shrink-0"
                aria-hidden
              />
            </button>
          ) : null}

          {davetAcabilir && bekleyenler.length > 0 ? (
            <BekleyenDavetlerListesi
              davetler={bekleyenler}
              onIptal={async (davet_id) => {
                if (!davet) return;
                try {
                  await davet.davetIptal(davet_id);
                  await istemci.invalidateQueries({
                    queryKey: davet.bekleyenleriQueryKey,
                  });
                  toast.basari("Davet iptal edildi.");
                } catch (err) {
                  toast.hata(
                    err instanceof Error
                      ? err.message
                      : "Davet iptal edilemedi.",
                  );
                }
              }}
            />
          ) : null}
        </div>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            render={
              <Button type="button" variant="outline">
                Kapat
              </Button>
            }
          />
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function BosDurum({ metin }: { metin: string }) {
  return (
    <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
      <p className="italic">{metin}</p>
    </div>
  );
}

function BekleyenDavetlerListesi({
  davetler,
  onIptal,
}: {
  davetler: ReadonlyArray<BekleyenDavetOzeti>;
  onIptal: (davet_id: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Bekleyen davetler ({davetler.length})
      </p>
      <ul className="border-border bg-card divide-border divide-y rounded-md border">
        {davetler.map((d) => (
          <li
            key={d.davet_id}
            className="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <span
              className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full"
              aria-hidden
            >
              <MailIcon className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{d.email}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {SEVIYE_ETIKET[d.seviye]} · davet bekliyor
              </span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => onIptal(d.davet_id)}
            >
              İptal
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
