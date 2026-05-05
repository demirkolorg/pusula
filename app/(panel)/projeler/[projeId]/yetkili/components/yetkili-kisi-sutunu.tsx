"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, SearchIcon, UserRoundIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptimisticMutation } from "@/lib/optimistic";
import { cn } from "@/lib/utils";
import {
  PROJE_YETKI_SEVIYELERI,
  type ProjeYetkiSeviyesi,
} from "../schemas";
import { extraKisiKeys, kisiAdaptor } from "../yetkili-adaptor";
import {
  optimistikKisiEkle,
  optimistikKisiKaldir,
  optimistikSeviyeGuncelle,
} from "../yetkili-optimistic";
import {
  kisiAciklamasi,
  seviyeDestekliMi,
  type YetkiliKaynagi,
  type YetkiliKisiAdayi,
  type YetkiliKisiOzeti,
} from "../yetkili-tipler";
import { KisiAvatar } from "./kisi-avatar";

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
  const [q, setQ] = React.useState("");
  const yonetebilir = kaynak.izinler.kisiYonet;
  const seviyeli = seviyeDestekliMi(kaynak);

  const yetkililer = useQuery({
    queryKey: adaptor.queryKey,
    queryFn: adaptor.listele,
    staleTime: 30_000,
  });

  const adaylar = useQuery({
    queryKey: adaptor.adayQueryKey(q),
    queryFn: () => adaptor.adaylar(q),
    enabled: yonetebilir,
    staleTime: 30_000,
  });

  const ekKeys = React.useMemo(() => extraKisiKeys(kaynak), [kaynak]);

  const ekle = useOptimisticMutation<
    { kullanici_id: string; seviye: ProjeYetkiSeviyesi; aday: YetkiliKisiAdayi },
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
  });

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

  const mevcutlar = yetkililer.data ?? [];
  const yetkiliSet = new Set(mevcutlar.map((k) => k.kullanici_id));
  const filtreliAdaylar = (adaylar.data ?? []).filter(
    (aday) => !yetkiliSet.has(aday.id),
  );

  const yukleniyor = yetkililer.isLoading;
  const adetMetni = yukleniyor ? "..." : mevcutlar.length;

  return (
    <section className="grid gap-3">
      <header className="grid gap-1">
        <div className="flex items-center gap-1.5">
          <UserRoundIcon className="size-3.5" />
          <h3 className="text-sm font-medium">Kişiler</h3>
        </div>
        <p className="text-muted-foreground text-[11px]">
          {kisiAciklamasi(kaynak)}
        </p>
      </header>

      <div>
        <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
          <span>Yetkili kişiler</span>
          <span className="bg-muted text-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
            {adetMetni}
          </span>
        </div>
        {yukleniyor ? (
          <p className="text-muted-foreground text-xs">Yükleniyor...</p>
        ) : mevcutlar.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">
            Henüz kişi yetkisi verilmemiş.
          </p>
        ) : (
          <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto">
            {mevcutlar.map((kisi) => (
              <li
                key={kisi.kullanici_id}
                className="bg-muted/40 hover:bg-muted/70 group flex items-center gap-2 rounded px-2 py-1.5"
              >
                <KisiAvatar ad={kisi.ad} soyad={kisi.soyad} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {kisi.ad} {kisi.soyad}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">
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
                    className="size-6 opacity-60 group-hover:opacity-100"
                    onClick={() =>
                      kaldir.mutate({ kullanici_id: kisi.kullanici_id })
                    }
                    aria-label={`${kisi.ad} ${kisi.soyad} yetkisini kaldır`}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {yonetebilir ? (
        <div className="bg-muted/20 rounded-md border border-dashed p-2">
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide">
            <PlusIcon className="size-3" />
            <span>Kişi yetkisi ekle</span>
          </div>
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-3 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İsim veya birim yazın..."
              className="bg-background h-8 pl-7"
            />
          </div>
          {filtreliAdaylar.length > 0 ? (
            <ul className="mt-1.5 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
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
                    className={cn(
                      "hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <KisiAvatar ad={aday.ad} soyad={aday.soyad} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {aday.ad} {aday.soyad}
                      </p>
                      <p className="text-muted-foreground truncate text-[11px]">
                        {aday.birim_ad ?? aday.email}
                      </p>
                    </div>
                    <PlusIcon className="text-muted-foreground size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : q.length > 0 ? (
            <p className="text-muted-foreground mt-1.5 text-[11px]">
              Eşleşen kişi bulunamadı.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
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
      <span className="bg-background text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">
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
        className="bg-background h-6 w-auto px-1.5 py-0 text-[10px] font-medium uppercase"
        aria-label={`${kullaniciId} seviyesini değiştir`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJE_YETKI_SEVIYELERI.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {SEVIYE_ETIKET[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
