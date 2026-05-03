"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Mail, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KURUM_TIP_LABEL } from "@/lib/constants/kurum";
import type { KurumTipi } from "@prisma/client";
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
import { kullaniciListele, kullaniciSilEylem } from "../actions";
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
  kurum_id: string;
  kurum_ad: string | null;
  kurum_tip: string;
  aktif: boolean;
  son_giris_zamani: Date | null;
  roller: Rol[];
};

function kurumGorunenAdRow(s: Satir): string {
  if (s.kurum_ad) return s.kurum_ad;
  return KURUM_TIP_LABEL[s.kurum_tip as KurumTipi] ?? s.kurum_tip;
}

type Yetkiler = {
  duzenleyebilir: boolean;
  davetEdebilir: boolean;
  silebilir: boolean;
};

const TARIH_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function KullanicilarIstemci({
  yetkiler,
  aktifKullaniciId,
}: {
  yetkiler: Yetkiler;
  aktifKullaniciId: string;
}) {
  const istemci = useQueryClient();
  const [sayfalama, setSayfalama] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [aramaInput, setAramaInput] = React.useState("");
  const [arama, setArama] = React.useState("");
  const [duzenlenen, setDuzenlenen] = React.useState<Satir | null>(null);
  const [davetAcik, setDavetAcik] = React.useState(false);
  const [silinecek, setSilinecek] = React.useState<Satir | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setArama(aramaInput);
      setSayfalama((s) => ({ ...s, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [aramaInput]);

  const sorgu = useQuery({
    queryKey: [
      "kullanicilar",
      {
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama,
      },
    ],
    queryFn: async () => {
      const r = await kullaniciListele({
        sayfa: sayfalama.pageIndex + 1,
        sayfaBoyutu: sayfalama.pageSize,
        arama: arama || undefined,
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
        id: "kurum",
        header: "Kurum",
        cell: ({ row }) => (
          <span className="text-sm">{kurumGorunenAdRow(row.original)}</span>
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
        accessorKey: "aktif",
        header: "Durum",
        cell: ({ row }) =>
          row.original.aktif ? (
            <Badge variant="secondary">Aktif</Badge>
          ) : (
            <Badge variant="outline">Pasif</Badge>
          ),
      },
      {
        id: "eylem",
        header: "",
        cell: ({ row }) => {
          const kayit = row.original;
          const kendisi = kayit.id === aktifKullaniciId;
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
    [aktifKullaniciId, yetkiler],
  );

  const veri = sorgu.data?.kayitlar ?? [];
  const toplam = sorgu.data?.toplam ?? 0;
  const filtreAktif = aramaInput.trim().length > 0;

  function filtreleriTemizle() {
    setAramaInput("");
    setArama("");
    setSayfalama((s) => ({ ...s, pageIndex: 0 }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={aramaInput}
              onChange={(e) => setAramaInput(e.target.value)}
              placeholder="Ad, soyad, e-posta ara..."
              className="pl-9"
            />
          </div>
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
        kartGorunumu={(s) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {s.ad} {s.soyad}
              </span>
              {s.aktif ? (
                <Badge variant="secondary">Aktif</Badge>
              ) : (
                <Badge variant="outline">Pasif</Badge>
              )}
            </div>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Mail className="size-3" /> {s.email}
            </span>
            <div className="text-muted-foreground text-xs">
              {kurumGorunenAdRow(s)}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {s.roller.map((r) => (
                <Badge key={r.id} variant="secondary">
                  {r.ad}
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex justify-end gap-1">
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
                disabled={!yetkiler.silebilir || s.id === aktifKullaniciId}
              >
                <Trash2 className="size-4 text-destructive" /> Sil
              </Button>
            </div>
          </div>
        )}
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
    </div>
  );
}
