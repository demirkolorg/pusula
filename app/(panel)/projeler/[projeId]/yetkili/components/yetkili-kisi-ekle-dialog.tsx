"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  Loader2Icon,
  MailIcon,
  PlusIcon,
  RefreshCwIcon,
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
import { BIRIM_TIP_LABEL, birimGorunenAd } from "@/lib/constants/birim";
import { makamRoluMu } from "@/lib/roller";
import { birimSecenekleriniGetir } from "../../../../ayarlar/birimler/actions";
import { rolListele } from "../../../../ayarlar/kullanicilar/actions";
import {
  davetAdaptor,
  extraKisiKeys,
  kisiAdaptor,
} from "../yetkili-adaptor";
import { optimistikKisiEkle } from "../yetkili-optimistic";
import {
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

// ADR-0013: davet, açıldığı kaynağa yetkili olarak ekler. Kart panelinden
// gönderilen davet sadece karta yetkili yapar; liste panelinden liste'ye,
// proje panelinden projeye.
const KAYNAK_KAPSAM_NOTU: Record<YetkiliKaynagi["tip"], string> = {
  proje: "Davet kabul edilince kişi projeye yetkili olarak eklenir.",
  liste: "Davet kabul edilince kişi yalnız bu listeye yetkili olarak eklenir.",
  kart: "Davet kabul edilince kişi yalnız bu karta yetkili olarak eklenir.",
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
  const [arama, setArama] = React.useState("");
  const [mod, setMod] = React.useState<Mod>("ara");
  const [davetEmail, setDavetEmail] = React.useState("");
  const [davetBirimId, setDavetBirimId] = React.useState<string | null>(null);
  const [davetRolId, setDavetRolId] = React.useState<string | null>(null);

  const adaylar = useQuery({
    queryKey: adaptor.adayQueryKey(arama),
    queryFn: () => adaptor.adaylar(arama),
    enabled: acik && mod === "ara",
    staleTime: 30_000,
  });

  const bekleyenDavetler = useQuery({
    queryKey: davet.bekleyenleriQueryKey,
    queryFn: davet.bekleyenler,
    enabled: acik,
    staleTime: 30_000,
  });

  const birimler = useQuery({
    queryKey: ["birim-secenekleri"],
    queryFn: async () => {
      const r = await birimSecenekleriniGetir(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: acik && mod === "davet",
    staleTime: 60_000,
  });

  const roller = useQuery({
    queryKey: ["roller"],
    queryFn: async () => {
      const r = await rolListele(undefined);
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    enabled: acik && mod === "davet",
    staleTime: 60_000,
  });

  // İlk rol yüklendiğinde PERSONEL'i default seç (en sık davet edilen rol).
  React.useEffect(() => {
    if (mod !== "davet" || !roller.data || davetRolId) return;
    const personel = roller.data.find((r) => r.kod === "PERSONEL");
    setDavetRolId(personel?.id ?? roller.data[0]?.id ?? null);
  }, [mod, roller.data, davetRolId]);

  const seciliRol = (roller.data ?? []).find((r) => r.id === davetRolId);
  const makamRolSecili = seciliRol ? makamRoluMu(seciliRol.kod) : false;
  // Makam rolleri (KAYMAKAM/SUPER_ADMIN) birime bağlanmaz — politika gereği.
  React.useEffect(() => {
    if (makamRolSecili && davetBirimId !== null) setDavetBirimId(null);
  }, [makamRolSecili, davetBirimId]);

  const ekle = useOptimisticMutation<
    {
      kullanici_id: string;
      aday: YetkiliKisiAdayi;
    },
    { kullanici_id: string; ozet?: YetkiliKisiOzeti }
  >({
    queryKey: adaptor.queryKey,
    mutationFn: ({ kullanici_id }) => adaptor.ekle(kullanici_id),
    optimistic: (eski, vars) =>
      optimistikKisiEkle(eski as YetkiliKisiOzeti[] | undefined, vars.aday),
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
      birim_id,
      rol_id,
    }: {
      email: string;
      birim_id: string | null;
      rol_id: string;
    }) => davet.davetGonder({ email, birim_id, rol_id }),
    onSuccess: async () => {
      toast.basari("Davet gönderildi.");
      await istemci.invalidateQueries({
        queryKey: davet.bekleyenleriQueryKey,
      });
      setMod("ara");
      setDavetEmail("");
      setDavetBirimId(null);
      setDavetRolId(null);
      setArama("");
    },
    onError: (err) => {
      toast.hata(err instanceof Error ? err.message : "Davet gönderilemedi.");
    },
  });

  const sifirla = React.useCallback(() => {
    setArama("");
    setMod("ara");
    setDavetEmail("");
    setDavetBirimId(null);
    setDavetRolId(null);
  }, []);

  const handleAcikDegis = (yeni: boolean) => {
    if (!yeni) sifirla();
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
    mod === "ara" &&
    !yukleniyor &&
    filtreliAdaylar.length === 0 &&
    davetUygunlugu.tip === "uygun";

  const davetMevcutBilgisi =
    davetUygunlugu.tip === "bekleyen" ? davetUygunlugu.email : null;

  const birimGerekiyor = !makamRolSecili;
  const davetGonderebilirMi =
    !davetGonder.isPending &&
    davetEmail.trim().length > 0 &&
    Boolean(davetRolId) &&
    (!birimGerekiyor || Boolean(davetBirimId)) &&
    davetUygunlugunuHesapla({
      arama: davetEmail,
      adayEmailleri,
      bekleyenDavetEmailleri: bekleyenEmailleri,
    }).tip === "uygun";

  if (mod === "davet") {
    return (
      <ResponsiveDialog open={acik} onOpenChange={handleAcikDegis}>
        <ResponsiveDialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-0">
          <ResponsiveDialogHeader className="border-b p-4">
            <ResponsiveDialogTitle className="flex items-center gap-2 pr-6">
              <span
                className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md"
                aria-hidden
              >
                <MailIcon className="size-4" />
              </span>
              Davet ile ekle
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="pr-6">
              Bu kişi sistemde kayıtlı değil. {KAYNAK_KAPSAM_NOTU[kaynak.tip]}{" "}
              Bağlantı 7 gün geçerlidir.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="grid gap-4 p-4">
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
                  className="h-10 pl-9"
                  placeholder="ad.soyad@birim.gov.tr"
                  value={davetEmail}
                  onChange={(e) => setDavetEmail(e.target.value)}
                  disabled={davetGonder.isPending}
                  autoFocus
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="davet-rol">Sistem rolü</Label>
              <Select
                value={davetRolId ?? ""}
                onValueChange={(v) => setDavetRolId(v || null)}
                disabled={davetGonder.isPending || roller.isLoading}
              >
                <SelectTrigger id="davet-rol" className="h-10">
                  <SelectValue placeholder="Rol seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {(roller.data ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Kişinin sistemdeki rolü — projedeki yetkileri bu role göre
                belirlenir.
              </p>
            </div>

            {birimGerekiyor ? (
              <div className="grid gap-1.5">
                <Label htmlFor="davet-birim">Atanacak birim</Label>
                <Select
                  value={davetBirimId ?? ""}
                  onValueChange={(v) => setDavetBirimId(v || null)}
                  disabled={davetGonder.isPending || birimler.isLoading}
                >
                  <SelectTrigger id="davet-birim" className="h-10">
                    <SelectValue placeholder="Birim seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(birimler.data ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {birimGorunenAd({ ad: b.ad, tip: b.tip })}
                        <span className="text-muted-foreground ml-2 text-xs">
                          {BIRIM_TIP_LABEL[b.tip]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs italic">
                Makam rolleri (Kaymakam / Süper Yönetici) birime bağlanmaz.
              </p>
            )}
          </div>

          <ResponsiveDialogFooter className="flex-row items-center justify-between gap-2 border-t p-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMod("ara")}
              disabled={davetGonder.isPending}
            >
              <ArrowLeftIcon className="size-4" /> Geri
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!davetRolId) return;
                if (birimGerekiyor && !davetBirimId) return;
                davetGonder.mutate({
                  email: davetEmail.trim(),
                  birim_id: davetBirimId,
                  rol_id: davetRolId,
                });
              }}
              disabled={!davetGonderebilirMi}
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
      <ResponsiveDialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-0">
        <ResponsiveDialogHeader className="border-b p-4">
          <ResponsiveDialogTitle className="flex items-center gap-2 pr-6">
            <span
              className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md"
              aria-hidden
            >
              <UserRoundIcon className="size-4" />
            </span>
            Kişi yetkisi ekle
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="pr-6">
            Birim üyeliğinden bağımsız olarak kişiye doğrudan erişim verir.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-3 p-4">
          <div className="relative">
            <SearchIcon
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="İsim, e-posta veya birim..."
              className="h-10 pl-9"
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
                    <strong className="break-all">
                      {davetMevcutBilgisi}
                    </strong>{" "}
                    için bekleyen davet var.
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

          {davetCTAGoster ? (
            <button
              type="button"
              className="border-primary/40 bg-primary/5 hover:bg-primary/10 focus-visible:ring-ring flex w-full items-center gap-3 rounded-md border border-dashed px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
              onClick={() => {
                if (davetUygunlugu.tip !== "uygun") return;
                setDavetEmail(davetUygunlugu.email);
                setMod("davet");
              }}
            >
              <span
                className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md"
                aria-hidden
              >
                <UserPlusIcon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  Davet ile ekle
                </span>
                <span className="text-muted-foreground block break-all text-xs">
                  {davetUygunlugu.tip === "uygun"
                    ? davetUygunlugu.email
                    : ""}
                </span>
              </span>
              <SendIcon
                className="text-primary size-4 shrink-0"
                aria-hidden
              />
            </button>
          ) : null}

          {bekleyenler.length > 0 ? (
            <BekleyenDavetlerListesi
              davetler={bekleyenler}
              onIptal={async (davet_id) => {
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
              onYenidenGonder={async (davet_id) => {
                try {
                  await davet.davetYenidenGonder(davet_id);
                  await istemci.invalidateQueries({
                    queryKey: davet.bekleyenleriQueryKey,
                  });
                  toast.basari("Davet tekrar gönderildi.");
                } catch (err) {
                  toast.hata(
                    err instanceof Error
                      ? err.message
                      : "Davet tekrar gönderilemedi.",
                  );
                }
              }}
            />
          ) : null}
        </div>

        <ResponsiveDialogFooter className="border-t p-4">
          <ResponsiveDialogClose
            render={
              <Button type="button" variant="outline" size="sm">
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
  onYenidenGonder,
}: {
  davetler: ReadonlyArray<BekleyenDavetOzeti>;
  onIptal: (davet_id: string) => void;
  onYenidenGonder: (davet_id: string) => void;
}) {
  const [aktifId, setAktifId] = React.useState<string | null>(null);
  return (
    <div className="grid gap-1.5">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Bekleyen davetler ({davetler.length})
      </p>
      <ul className="border-border bg-card divide-border divide-y rounded-md border">
        {davetler.map((d) => (
          <li
            key={d.davet_id}
            className="flex items-center gap-2 px-3 py-2 text-sm"
          >
            <span
              className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full"
              aria-hidden
            >
              <MailIcon className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{d.email}</span>
              <span className="text-muted-foreground block truncate text-xs">
                Davet bekliyor
              </span>
            </span>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-8"
              aria-label="Daveti tekrar gönder"
              aria-busy={aktifId === d.davet_id}
              disabled={aktifId === d.davet_id}
              onClick={async () => {
                setAktifId(d.davet_id);
                try {
                  await onYenidenGonder(d.davet_id);
                } finally {
                  setAktifId(null);
                }
              }}
            >
              {aktifId === d.davet_id ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
            </Button>
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
