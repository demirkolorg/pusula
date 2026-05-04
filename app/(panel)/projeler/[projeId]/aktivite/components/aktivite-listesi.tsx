"use client";

import * as React from "react";
import {
  ActivityIcon,
  Building2Icon,
  CheckSquareIcon,
  FilePlus2Icon,
  LinkIcon,
  ListChecksIcon,
  Loader2Icon,
  MessageSquareIcon,
  PaperclipIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UyeAvatar } from "../../uye/components/uye-avatar";
import { useKartAktiviteleri } from "../hooks";
import type { AktiviteOzeti } from "../services";

type Props = {
  kartId: string;
};

// Kural 8: Intl.DateTimeFormat tr-TR + Europe/Istanbul + dd.MM.yyyy HH:mm
const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const TARIH_TAM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const KATEGORI_IKON: Record<
  AktiviteOzeti["kategori"],
  React.ComponentType<{ className?: string }>
> = {
  kart: ActivityIcon,
  etiket: TagIcon,
  uye: UsersIcon,
  "kontrol-listesi": ListChecksIcon,
  "kontrol-maddesi": CheckSquareIcon,
  yorum: MessageSquareIcon,
  eklenti: PaperclipIcon,
  iliski: LinkIcon,
  "hedef-kurum": Building2Icon,
  diger: FilePlus2Icon,
};

// Sancak referansı: dikey timeline — sol kenarda 1px line, her olay için
// 22x22 daire (kategori rengi), sağda kullanıcı + mesaj + detay + zaman.
export function AktiviteListesi({ kartId }: Props) {
  const sorgu = useKartAktiviteleri(kartId);

  if (sorgu.isLoading) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 px-2 py-3 text-xs">
        <Loader2Icon className="size-3 animate-spin" /> Yükleniyor…
      </p>
    );
  }

  if ((sorgu.data?.length ?? 0) === 0) {
    return (
      <div className="border-muted relative rounded-md border border-dashed py-10 text-center">
        <div className="text-muted-foreground/80 mx-auto flex flex-col items-center gap-2">
          <ActivityIcon className="size-5" />
          <p className="text-xs">Henüz aktivite yok.</p>
          <p className="text-muted-foreground/60 max-w-[240px] text-[11px] leading-snug">
            Kartta yapılan her değişiklik (atama, tarih, etiket, yorum, durum,
            kontrol maddesi, eklenti, ilişki) burada zaman çizelgesinde görünür.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="bg-border absolute bottom-3 left-[10px] top-3 w-px"
        aria-hidden
      />
      <ul className="relative flex flex-col gap-3">
        {sorgu.data?.map((a) => (
          <li key={a.id}>
            <AktiviteSatiri aktivite={a} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AktiviteSatiri({ aktivite }: { aktivite: AktiviteOzeti }) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  const adSoyad = aktivite.kullanici
    ? `${aktivite.kullanici.ad} ${aktivite.kullanici.soyad}`.trim()
    : "Sistem";

  return (
    <div className="flex items-start gap-2">
      {aktivite.kullanici ? (
        <span className="ring-background relative z-[1] ring-2">
          <UyeAvatar
            ad={aktivite.kullanici.ad}
            soyad={aktivite.kullanici.soyad}
            className="size-[22px] text-[8px]"
          />
        </span>
      ) : (
        <span
          className={cn(
            "ring-background relative z-[1] inline-flex size-[22px] items-center justify-center rounded-full ring-2",
            kategoriArkaplan(aktivite.kategori),
          )}
          aria-label="Sistem"
        >
          <Ikon className="size-2.5" />
        </span>
      )}
      <div className="text-muted-foreground flex-1 pt-1 text-[12.5px] leading-[1.5]">
        <span className="text-foreground font-semibold">{adSoyad}</span>{" "}
        <Ikon
          className={cn(
            "mx-0.5 inline size-3 -translate-y-px",
            kategoriYazi(aktivite.kategori),
          )}
        />{" "}
        <span>{aktivite.mesaj}</span>
        {aktivite.detay && (
          <>
            {": "}
            <span className="bg-muted text-foreground ml-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium">
              {aktivite.detay}
            </span>
          </>
        )}
        <time
          className="text-muted-foreground/70 ml-2 text-[10.5px] tabular-nums"
          title={TARIH_TAM.format(new Date(aktivite.zaman))}
        >
          {TARIH_KISA.format(new Date(aktivite.zaman))}
        </time>
        {aktivite.degisiklikler && aktivite.degisiklikler.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {aktivite.degisiklikler.map((d, i) => (
              <li
                key={i}
                className="text-muted-foreground/90 text-[11.5px] leading-snug"
              >
                <span className="text-muted-foreground/70 mr-1">{d.alan}:</span>
                <DegerEtiketi v={d.eski} eski />
                <span className="text-muted-foreground/60 mx-1">→</span>
                <DegerEtiketi v={d.yeni} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DegerEtiketi({ v, eski }: { v: string | null; eski?: boolean }) {
  if (v === null) {
    return (
      <span className="text-muted-foreground/60 italic">—</span>
    );
  }
  return (
    <span
      className={cn(
        "bg-muted/70 inline-block max-w-[180px] truncate rounded px-1 py-0 align-middle text-[11px]",
        eski
          ? "text-muted-foreground/80 line-through decoration-from-font"
          : "text-foreground",
      )}
    >
      {v}
    </span>
  );
}

function kategoriArkaplan(kategori: AktiviteOzeti["kategori"]): string {
  switch (kategori) {
    case "yorum":
      return "bg-blue-100 text-blue-700";
    case "etiket":
      return "bg-amber-100 text-amber-700";
    case "uye":
      return "bg-purple-100 text-purple-700";
    case "kontrol-listesi":
    case "kontrol-maddesi":
      return "bg-emerald-100 text-emerald-700";
    case "eklenti":
      return "bg-slate-100 text-slate-700";
    case "iliski":
      return "bg-rose-100 text-rose-700";
    case "hedef-kurum":
      return "bg-cyan-100 text-cyan-700";
    case "kart":
    case "diger":
    default:
      return "bg-muted text-muted-foreground";
  }
}

function kategoriYazi(kategori: AktiviteOzeti["kategori"]): string {
  switch (kategori) {
    case "yorum":
      return "text-blue-600";
    case "etiket":
      return "text-amber-600";
    case "uye":
      return "text-purple-600";
    case "kontrol-listesi":
    case "kontrol-maddesi":
      return "text-emerald-600";
    case "iliski":
      return "text-rose-600";
    case "hedef-kurum":
      return "text-cyan-600";
    default:
      return "text-muted-foreground";
  }
}
