"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Check,
  Mail,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BIRIM_TIP_LABEL } from "@/lib/constants/birim";
import type { BirimTipi, KullaniciOnayDurumu } from "@prisma/client";
import { DataTable } from "@/components/tablo/data-table";
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
import { eylemMutasyonu, useOptimisticMutation } from "@/lib/optimistic";
import {
  kullaniciListele,
  kullaniciOnaylaEylem,
  kullaniciReddetEylem,
  kullaniciSilEylem,
} from "../actions";
import {
  DURUM_LABEL,
  kullaniciDurumu,
  type KullaniciDurumu,
} from "../durum-helper";
import { KullaniciDuzenleSheet } from "./kullanici-duzenle";
import { DavetGonderSheet } from "./davet-gonder";

type Rol = { id: string; kod: string; ad: string };
type Satir = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  unvan: string | null;
  telefon: string | null;
  birim_id: string | null;
  birim_ad: string | null;
  birim_tip: string | null;
  aktif: boolean;
  onay_durumu: KullaniciOnayDurumu;
  red_sebebi: string | null;
  son_giris_zamani: Date | null;
  roller: Rol[];
};

type ListeYaniti = {
  kayitlar: Satir[];
  toplam: number;
  bekleyenSayisi: number;
};

function birimGorunenAdRow(s: Satir): string {
  if (s.birim_ad) return s.birim_ad;
  if (!s.birim_tip) return "Makam";
  return BIRIM_TIP_LABEL[s.birim_tip as BirimTipi] ?? s.birim_tip;
}

const DURUM_BADGE_VARIANT: Record<
  KullaniciDurumu,
  "default" | "secondary" | "destructive" | "outline"
> = {
  AKTIF: "secondary",
  BEKLIYOR: "default",
  REDDEDILDI: "destructive",
  PASIF: "outline",
};

function DurumRozeti({ satir }: { satir: Satir }) {
  const durum = kullaniciDurumu(satir);
  return (
    <Badge variant={DURUM_BADGE_VARIANT[durum]}>{DURUM_LABEL[durum]}</Badge>
  );
}

type Yetkiler = {
  duzenleyebilir: boolean;
  davetEdebilir: boolean;
  silebilir: boolean;
  onaylayabilir: boolean;
};

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function KullanicilarIstemci({
  yetkiler,
  aktifKullaniciId,
  baslangicSadeceBekleyenler = false,
}: {
  yetkiler: Yetkiler;
  aktifKullaniciId: string;
  baslangicSadeceBekleyenler?: boolean;
}) {
  const istemci = useQueryClient();
  const [sayfalama, setSayfalama] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [aramaInput, setAramaInput] = React.useState("");
  const [arama, setArama] = React.useState("");
  const [sadeceBekleyenler, setSadeceBekleyenler] = React.useState(
    baslangicSadeceBekleyenler,
  );
  const [duzenlenen, setDuzenlenen] = React.useState<Satir | null>(null);
  const [davetAcik, setDavetAcik] = React.useState(false);
  const [silinecek, setSilinecek] = React.useState<Satir | null>(null);
  const [reddedilecek, setReddedilecek] = React.useState<Satir | null>(null);
  const [redSebebi, setRedSebebi] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => {
      setArama(aramaInput);
      setSayfalama((s) => ({ ...s, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [aramaInput]);

  // Aktif sayfanın exact query key'i — optimistic update için.
  // Tüm "kullanicilar" prefix'i `ekInvalidate` ile tazelenir, böylece
  // farklı sayfa/arama'da kalan stale cache de mutation sonrası yenilenir.
  const aktifKey = React.useMemo(
    () => [
      "kullanicilar",
      {
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama,
        sadeceBekleyenler,
      },
    ] as const,
    [sayfalama.pageIndex, sayfalama.pageSize, arama, sadeceBekleyenler],
  );

  const sorgu = useQuery({
    queryKey: aktifKey,
    queryFn: async () => {
      const r = await kullaniciListele({
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama: arama || undefined,
        onay_durumu: sadeceBekleyenler ? "BEKLIYOR" : undefined,
      });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
  });

  const silMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await kullaniciSilEylem({ id });
      if (!r.basarili) throw new Error(r.hata);
      return r.veri;
    },
    onSuccess: () => {
      toast.basari("Kullanıcı silindi.");
      void istemci.invalidateQueries({ queryKey: ["kullanicilar"] });
      setSilinecek(null);
    },
    onError: (e) => toast.hata((e as Error).message),
  });

  // Onayla — satır cache'inde aktif=true, onay_durumu=ONAYLANDI olarak güncelle.
  const onaylaMut = useOptimisticMutation<{ id: string }, { id: string }>({
    queryKey: aktifKey,
    mutationFn: eylemMutasyonu(kullaniciOnaylaEylem),
    optimistic: (old, vars) => {
      const v = old as ListeYaniti | undefined;
      if (!v) return old;
      return {
        ...v,
        kayitlar: v.kayitlar.map((k) =>
          k.id === vars.id
            ? {
                ...k,
                onay_durumu: "ONAYLANDI" as KullaniciOnayDurumu,
                aktif: true,
                red_sebebi: null,
              }
            : k,
        ),
      };
    },
    ekInvalidate: [["kullanicilar"]],
    hataMesaji: "Kullanıcı onaylanamadı",
    basariMesaji: "Kullanıcı onaylandı.",
  });

  // Reddet — satır cache'inde aktif=false, onay_durumu=REDDEDILDI, red_sebebi=...
  const reddetMut = useOptimisticMutation<
    { id: string; sebep: string },
    { id: string }
  >({
    queryKey: aktifKey,
    mutationFn: eylemMutasyonu(kullaniciReddetEylem),
    optimistic: (old, vars) => {
      const v = old as ListeYaniti | undefined;
      if (!v) return old;
      return {
        ...v,
        kayitlar: v.kayitlar.map((k) =>
          k.id === vars.id
            ? {
                ...k,
                onay_durumu: "REDDEDILDI" as KullaniciOnayDurumu,
                aktif: false,
                red_sebebi: vars.sebep,
              }
            : k,
        ),
      };
    },
    ekInvalidate: [["kullanicilar"]],
    hataMesaji: "Kullanıcı reddedilemedi",
    basariMesaji: "Kullanıcı reddedildi.",
    onSettledExtra: () => {
      setReddedilecek(null);
      setRedSebebi("");
    },
  });

  const kolonlar: ColumnDef<Satir>[] = React.useMemo(
    () => [
      {
        id: "kisi",
        header: "Kişi",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.ad} {row.original.soyad}
            </span>
            <span className="text-muted-foreground text-xs">
              {row.original.email}
            </span>
            {row.original.unvan && (
              <span className="text-muted-foreground text-xs">
                {row.original.unvan}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "birim",
        header: "Birim",
        cell: ({ row }) => (
          <span className="text-sm">{birimGorunenAdRow(row.original)}</span>
        ),
      },
      {
        id: "roller",
        header: "Roller",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roller.length === 0 ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : (
              row.original.roller.map((r) => (
                <Badge key={r.id} variant="secondary">
                  {r.ad}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        accessorKey: "son_giris_zamani",
        header: "Son Giriş",
        cell: ({ row }) =>
          row.original.son_giris_zamani
            ? TARIH_FORMAT.format(new Date(row.original.son_giris_zamani))
            : "—",
      },
      {
        id: "durum",
        header: "Durum",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <DurumRozeti satir={row.original} />
            {row.original.onay_durumu === "REDDEDILDI" &&
              row.original.red_sebebi && (
                <span
                  className="text-muted-foreground max-w-[18rem] truncate text-xs"
                  title={row.original.red_sebebi}
                >
                  {row.original.red_sebebi}
                </span>
              )}
          </div>
        ),
      },
      {
        id: "eylem",
        header: "",
        cell: ({ row }) => {
          const kayit = row.original;
          const kendisi = kayit.id === aktifKullaniciId;
          const bekliyor = kayit.onay_durumu === "BEKLIYOR";
          if (bekliyor) {
            return (
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!yetkiler.onaylayabilir || reddetMut.isPending}
                  onClick={() => setReddedilecek(kayit)}
                >
                  <X className="size-4" /> Reddet
                </Button>
                <Button
                  size="sm"
                  disabled={!yetkiler.onaylayabilir || onaylaMut.isPending}
                  onClick={() => onaylaMut.mutate({ id: kayit.id })}
                >
                  <Check className="size-4" /> Onayla
                </Button>
              </div>
            );
          }
          return (
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={!yetkiler.duzenleyebilir}
                onClick={() => setDuzenlenen(kayit)}
                aria-label="Düzenle"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!yetkiler.silebilir || kendisi}
                onClick={() => setSilinecek(kayit)}
                aria-label="Sil"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          );
        },
      },
    ],
    [
      aktifKullaniciId,
      yetkiler,
      onaylaMut,
      reddetMut.isPending,
    ],
  );

  const veri = sorgu.data?.kayitlar ?? [];
  const toplam = sorgu.data?.toplam ?? 0;
  const bekleyenSayisi = sorgu.data?.bekleyenSayisi ?? 0;
  const filtreAktif = aramaInput.trim().length > 0 || sadeceBekleyenler;

  function filtreleriTemizle() {
    setAramaInput("");
    setArama("");
    setSadeceBekleyenler(false);
    setSayfalama((s) => ({ ...s, pageIndex: 0 }));
  }

  function sadeceBekleyenleriToggle() {
    setSadeceBekleyenler((s) => !s);
    setSayfalama((p) => ({ ...p, pageIndex: 0 }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={aramaInput}
              onChange={(e) => setAramaInput(e.target.value)}
              placeholder="Ad, soyad, e-posta ara..."
              className="pl-9"
            />
          </div>
          {/* Onay bekleyen filtre chip'i — toplam bekleyen sayısını gösterir;
              tıklayınca sadece BEKLIYOR olanları listeler. ADR-0025. */}
          {yetkiler.onaylayabilir && bekleyenSayisi > 0 && (
            <Button
              type="button"
              variant={sadeceBekleyenler ? "default" : "outline"}
              size="sm"
              onClick={sadeceBekleyenleriToggle}
              aria-pressed={sadeceBekleyenler}
            >
              Onay Bekleyen
              <Badge
                variant={sadeceBekleyenler ? "secondary" : "default"}
                className="ml-1"
              >
                {bekleyenSayisi}
              </Badge>
            </Button>
          )}
          {filtreAktif && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={filtreleriTemizle}
            >
              <X className="size-4" /> Filtreleri temizle
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setDavetAcik(true)}
            disabled={!yetkiler.davetEdebilir}
          >
            <UserPlus className="size-4" /> Davet Gönder
          </Button>
        </div>
      </div>

      <DataTable<Satir>
        veri={veri}
        kolonlar={kolonlar}
        toplam={toplam}
        sayfalama={sayfalama}
        sayfalamaDegisti={setSayfalama}
        yukleniyor={sorgu.isLoading}
        bosMesaj="Kullanıcı bulunamadı."
        satirAnahtari={(s) => s.id}
        kartGorunumu={(s) => {
          const bekliyor = s.onay_durumu === "BEKLIYOR";
          const kendisi = s.id === aktifKullaniciId;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {s.ad} {s.soyad}
                </span>
                <DurumRozeti satir={s} />
              </div>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Mail className="size-3" /> {s.email}
              </span>
              <div className="text-muted-foreground text-xs">
                {birimGorunenAdRow(s)}
              </div>
              {s.onay_durumu === "REDDEDILDI" && s.red_sebebi && (
                <div className="text-muted-foreground text-xs italic">
                  Red sebebi: {s.red_sebebi}
                </div>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                {s.roller.map((r) => (
                  <Badge key={r.id} variant="secondary">
                    {r.ad}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex justify-end gap-1">
                {bekliyor ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!yetkiler.onaylayabilir || reddetMut.isPending}
                      onClick={() => setReddedilecek(s)}
                    >
                      <X className="size-4" /> Reddet
                    </Button>
                    <Button
                      size="sm"
                      disabled={!yetkiler.onaylayabilir || onaylaMut.isPending}
                      onClick={() => onaylaMut.mutate({ id: s.id })}
                    >
                      <Check className="size-4" /> Onayla
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDuzenlenen(s)}
                      disabled={!yetkiler.duzenleyebilir}
                    >
                      <Pencil className="size-4" /> Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSilinecek(s)}
                      disabled={!yetkiler.silebilir || kendisi}
                    >
                      <Trash2 className="size-4 text-destructive" /> Sil
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        }}
      />

      <KullaniciDuzenleSheet
        kayit={duzenlenen}
        kapat={() => setDuzenlenen(null)}
        basaridaTetikle={() =>
          istemci.invalidateQueries({ queryKey: ["kullanicilar"] })
        }
      />
      <DavetGonderSheet
        acik={davetAcik}
        kapat={() => setDavetAcik(false)}
        basaridaTetikle={() =>
          istemci.invalidateQueries({ queryKey: ["kullanicilar"] })
        }
      />

      <AlertDialog
        open={!!silinecek}
        onOpenChange={(o) => (o ? null : setSilinecek(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">
                {silinecek?.ad} {silinecek?.soyad}
              </span>{" "}
              hesabını sileceksiniz. İşlem geri alınabilir (yumuşak silme).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={silMut.isPending}>
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={silMut.isPending}
              onClick={() => silinecek && silMut.mutate(silinecek.id)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!reddedilecek}
        onOpenChange={(o) => {
          if (!o) {
            setReddedilecek(null);
            setRedSebebi("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kayıt reddedilsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">
                {reddedilecek?.ad} {reddedilecek?.soyad}
              </span>{" "}
              kullanıcısının kaydını reddediyorsunuz. Sebep belirtin (kullanıcıya
              bildirim için).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={redSebebi}
            onChange={(e) => setRedSebebi(e.target.value)}
            placeholder="Red sebebi (en az 2 karakter)"
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reddetMut.isPending}>
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={reddetMut.isPending || redSebebi.trim().length < 2}
              onClick={() =>
                reddedilecek &&
                reddetMut.mutate({
                  id: reddedilecek.id,
                  sebep: redSebebi.trim(),
                })
              }
            >
              Reddet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
