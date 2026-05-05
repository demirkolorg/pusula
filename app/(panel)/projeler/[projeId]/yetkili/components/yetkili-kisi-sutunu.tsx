"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { MailIcon, PlusIcon, UserRoundIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptimisticMutation } from "@/lib/optimistic";
import {
  PROJE_YETKI_SEVIYELERI,
  type ProjeYetkiSeviyesi,
} from "../schemas";
import { davetAdaptor, extraKisiKeys, kisiAdaptor } from "../yetkili-adaptor";
import {
  optimistikKisiKaldir,
  optimistikSeviyeGuncelle,
} from "../yetkili-optimistic";
import {
  kisiAciklamasi,
  seviyeDestekliMi,
  type YetkiliKaynagi,
  type YetkiliKisiOzeti,
} from "../yetkili-tipler";
import { KisiAvatar } from "./kisi-avatar";
import { YetkiliKisiEkleDialog } from "./yetkili-kisi-ekle-dialog";

type Props = {
  kaynak: YetkiliKaynagi;
};

const SEVIYE_ETIKET: Record<ProjeYetkiSeviyesi, string> = {
  ADMIN: "Yönetici",
  NORMAL: "Üye",
  IZLEYICI: "İzleyici",
};

export function YetkiliKisiSutunu({ kaynak }: Props) {
  const adaptor = React.useMemo(() => kisiAdaptor(kaynak), [kaynak]);
  const davet = React.useMemo(() => davetAdaptor(kaynak), [kaynak]);
  const yonetebilir = kaynak.izinler.kisiYonet;
  const seviyeli = seviyeDestekliMi(kaynak);
  const [ekleAcik, setEkleAcik] = React.useState(false);

  const yetkililer = useQuery({
    queryKey: adaptor.queryKey,
    queryFn: adaptor.listele,
    staleTime: 30_000,
  });

  const bekleyenDavetler = useQuery({
    queryKey: davet?.bekleyenleriQueryKey ?? ["proje-bekleyen-davetler", "yok"],
    queryFn: () => (davet ? davet.bekleyenler() : Promise.resolve([])),
    enabled: Boolean(davet) && yonetebilir,
    staleTime: 30_000,
  });
  const bekleyenSayisi = bekleyenDavetler.data?.length ?? 0;

  const ekKeys = React.useMemo(() => extraKisiKeys(kaynak), [kaynak]);

  const kaldir = useOptimisticMutation<
    { kullanici_id: string },
    { kullanici_id: string }
  >({
    queryKey: adaptor.queryKey,
    mutationFn: ({ kullanici_id }) => adaptor.kaldir(kullanici_id),
    optimistic: (eski, vars) =>
      optimistikKisiKaldir(
        eski as YetkiliKisiOzeti[] | undefined,
        vars.kullanici_id,
      ),
    ekInvalidate: ekKeys,
    hataMesaji: "Yetkili kaldırılamadı",
  });

  const seviyeGuncelle = useOptimisticMutation<
    { kullanici_id: string; seviye: ProjeYetkiSeviyesi },
    { kullanici_id: string; seviye: ProjeYetkiSeviyesi }
  >({
    queryKey: adaptor.queryKey,
    mutationFn: ({ kullanici_id, seviye }) =>
      adaptor.seviyeGuncelle(kullanici_id, seviye),
    optimistic: (eski, vars) =>
      optimistikSeviyeGuncelle(
        eski as YetkiliKisiOzeti[] | undefined,
        vars.kullanici_id,
        vars.seviye,
      ),
    hataMesaji: "Yetki seviyesi güncellenemedi",
  });

  const mevcutlar = React.useMemo(
    () => yetkililer.data ?? [],
    [yetkililer.data],
  );
  const mevcutIdleri = React.useMemo(
    () => mevcutlar.map((k) => k.kullanici_id),
    [mevcutlar],
  );
  const yukleniyor = yetkililer.isLoading;

  return (
    <section className="grid gap-3">
      <header className="grid gap-1">
        <div className="flex items-center gap-1.5">
          <UserRoundIcon className="size-3.5" />
          <h3 className="text-sm font-medium">Kişiler</h3>
        </div>
        <p className="text-muted-foreground text-xs">
          {kisiAciklamasi(kaynak)}
        </p>
      </header>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <SutunBasliği
            metin="Yetkili kişiler"
            sayi={yukleniyor ? null : mevcutlar.length}
          />
          {yonetebilir ? (
            <div className="flex items-center gap-2">
              {bekleyenSayisi > 0 ? (
                <span
                  className="text-muted-foreground inline-flex items-center gap-1 text-xs"
                  title={`${bekleyenSayisi} davet bekliyor`}
                >
                  <MailIcon className="size-3.5" />
                  {bekleyenSayisi}
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEkleAcik(true)}
              >
                <PlusIcon className="size-3.5" /> Ekle
              </Button>
            </div>
          ) : null}
        </div>

        {yukleniyor ? (
          <p className="text-muted-foreground text-xs">Yükleniyor...</p>
        ) : mevcutlar.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">
            Henüz kişi yetkisi verilmemiş.
          </p>
        ) : (
          <ul className="border-border bg-card divide-border max-h-64 divide-y overflow-y-auto rounded-md border">
            {mevcutlar.map((kisi) => (
              <li
                key={kisi.kullanici_id}
                className="hover:bg-accent group flex items-center gap-3 px-3 py-2.5 transition-colors"
              >
                <KisiAvatar ad={kisi.ad} soyad={kisi.soyad} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {kisi.ad} {kisi.soyad}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {kisi.birim_ad ?? kisi.email}
                  </p>
                </div>
                {seviyeli && kisi.seviye ? (
                  <KisiSeviyeKontrolu
                    kullaniciId={kisi.kullanici_id}
                    seviye={kisi.seviye}
                    yonetebilir={yonetebilir}
                    isLoading={
                      seviyeGuncelle.isPending &&
                      seviyeGuncelle.variables?.kullanici_id ===
                        kisi.kullanici_id
                    }
                    seviyeyiDegistir={(yeni) =>
                      seviyeGuncelle.mutate({
                        kullanici_id: kisi.kullanici_id,
                        seviye: yeni,
                      })
                    }
                  />
                ) : null}
                {yonetebilir ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() =>
                      kaldir.mutate({ kullanici_id: kisi.kullanici_id })
                    }
                    aria-label={`${kisi.ad} ${kisi.soyad} yetkisini kaldır`}
                  >
                    <XIcon className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {yonetebilir ? (
        <YetkiliKisiEkleDialog
          acik={ekleAcik}
          acikDegis={setEkleAcik}
          kaynak={kaynak}
          mevcutKullaniciIdleri={mevcutIdleri}
        />
      ) : null}
    </section>
  );
}

function SutunBasliği({ metin, sayi }: { metin: string; sayi: number | null }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
      <span>{metin}</span>
      <span className="bg-muted text-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums">
        {sayi ?? "..."}
      </span>
    </div>
  );
}

function KisiSeviyeKontrolu({
  kullaniciId,
  seviye,
  yonetebilir,
  isLoading,
  seviyeyiDegistir,
}: {
  kullaniciId: string;
  seviye: ProjeYetkiSeviyesi;
  yonetebilir: boolean;
  isLoading: boolean;
  seviyeyiDegistir: (yeni: ProjeYetkiSeviyesi) => void;
}) {
  if (!yonetebilir) {
    return (
      <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium">
        {SEVIYE_ETIKET[seviye]}
      </span>
    );
  }
  return (
    <Select
      value={seviye}
      disabled={isLoading}
      onValueChange={(v) => seviyeyiDegistir(v as ProjeYetkiSeviyesi)}
    >
      <SelectTrigger
        size="sm"
        className="h-7 w-auto px-2 text-xs font-medium"
        aria-label={`${kullaniciId} seviyesini değiştir`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJE_YETKI_SEVIYELERI.map((s) => (
          <SelectItem key={s} value={s} className="text-sm">
            {SEVIYE_ETIKET[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
