"use client";

import * as React from "react";
import {
  CheckSquareIcon,
  FilePlus2Icon,
  LinkIcon,
  ListChecksIcon,
  MessageSquareIcon,
  PaperclipIcon,
  TagIcon,
  Building2Icon,
  UsersIcon,
  ActivityIcon,
} from "lucide-react";
import { UyeAvatar } from "../../uye/components/uye-avatar";
import { useKartAktiviteleri } from "../hooks";
import type { AktiviteOzeti } from "../services";

type Props = {
  kartId: string;
};

// Kural 8: tarih formatı dd.MM.yyyy HH:mm, Europe/Istanbul
const TARIH_TAM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const RELATIVE = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

function relatifZaman(d: Date): string {
  const fark = (Date.now() - new Date(d).getTime()) / 1000;
  if (fark < 60) return "şimdi";
  if (fark < 3600) return RELATIVE.format(-Math.round(fark / 60), "minute");
  if (fark < 86_400) return RELATIVE.format(-Math.round(fark / 3600), "hour");
  if (fark < 86_400 * 7) return RELATIVE.format(-Math.round(fark / 86_400), "day");
  return TARIH_TAM.format(new Date(d));
}

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

export function AktiviteListesi({ kartId }: Props) {
  const sorgu = useKartAktiviteleri(kartId);

  if (sorgu.isLoading) {
    return (
      <p className="text-muted-foreground p-4 text-xs">Yükleniyor…</p>
    );
  }
  if ((sorgu.data?.length ?? 0) === 0) {
    return (
      <p className="text-muted-foreground p-4 text-xs">Henüz aktivite yok.</p>
    );
  }
  return (
    <ol className="flex flex-col">
      {sorgu.data?.map((a) => (
        <li key={a.id}>
          <AktiviteSatiri aktivite={a} />
        </li>
      ))}
    </ol>
  );
}

function AktiviteSatiri({ aktivite }: { aktivite: AktiviteOzeti }) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  const adSoyad = aktivite.kullanici
    ? `${aktivite.kullanici.ad} ${aktivite.kullanici.soyad}`.trim()
    : "Sistem";

  return (
    <div className="hover:bg-accent/30 flex items-start gap-2 rounded px-2 py-2 text-xs">
      {aktivite.kullanici ? (
        <UyeAvatar
          ad={aktivite.kullanici.ad}
          soyad={aktivite.kullanici.soyad}
        />
      ) : (
        <span
          className="bg-muted text-muted-foreground inline-flex size-6 items-center justify-center rounded-full"
          aria-label="Sistem"
        >
          <Ikon className="size-3" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="leading-tight">
          <span className="font-medium">{adSoyad}</span>{" "}
          <Ikon className="text-muted-foreground mx-0.5 inline size-3 -translate-y-px" />{" "}
          <span className="text-foreground/90">{aktivite.mesaj}</span>
          {aktivite.detay && (
            <span className="text-muted-foreground italic">
              {" — "}
              {aktivite.detay}
            </span>
          )}
        </p>
        <time
          className="text-muted-foreground text-[10px]"
          title={TARIH_TAM.format(new Date(aktivite.zaman))}
        >
          {relatifZaman(new Date(aktivite.zaman))}
        </time>
      </div>
    </div>
  );
}
