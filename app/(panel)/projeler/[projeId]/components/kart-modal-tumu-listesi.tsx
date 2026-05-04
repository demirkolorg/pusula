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
import { MentionliMetin, type UyeMap } from "@/lib/mention";
import { useKartYorumlari } from "../yorum/hooks";
import { useKartEklentileri } from "../eklenti/hooks";
import { useKartAktiviteleri } from "../aktivite/hooks";
import { useProjeUyeleri } from "../uye/hooks";
import { UyeAvatar } from "../uye/components/uye-avatar";
import type { YorumOzeti } from "../yorum/services";
import type { EklentiOzeti } from "../eklenti/services";
import type { AktiviteOzeti } from "../aktivite/services";

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

// projeId opsiyonel — verilirse yorum içeriği ve aktivite detaylarındaki
// `@<uuid>` mention'lar kullanıcı adlarıyla render edilir.
type Props = { kartId: string; projeId?: string };

// Sancak referansı: tek dikey timeline'da TÜM olaylar.
// Audit log = "ne oldu" iskelet; Yorum CREATE'te yorum içeriği inline kart
// olarak, Eklenti CREATE'te dosya rozeti olarak zenginleşir, diğerleri
// kuru aktivite satırı (Aktivite sekmesi tasarımıyla aynı).
export function KartModalTumuListesi({ kartId, projeId }: Props) {
  const aktiviteQ = useKartAktiviteleri(kartId);
  const yorumQ = useKartYorumlari(kartId);
  const eklerQ = useKartEklentileri(kartId);
  const uyelerQ = useProjeUyeleri(projeId ?? "");

  const yukleniyor =
    aktiviteQ.isLoading || yorumQ.isLoading || eklerQ.isLoading;

  const uyeMap: UyeMap = React.useMemo(() => {
    const m: UyeMap = new Map();
    if (!projeId) return m;
    for (const u of uyelerQ.data ?? []) {
      m.set(u.kullanici_id, { ad: u.ad, soyad: u.soyad });
    }
    return m;
  }, [projeId, uyelerQ.data]);

  const yorumMap = React.useMemo(
    () => new Map((yorumQ.data ?? []).map((y) => [y.id, y])),
    [yorumQ.data],
  );
  const ekMap = React.useMemo(
    () => new Map((eklerQ.data ?? []).map((e) => [e.id, e])),
    [eklerQ.data],
  );

  if (yukleniyor) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 px-2 py-3 text-xs">
        <Loader2Icon className="size-3 animate-spin" /> Yükleniyor…
      </p>
    );
  }

  const olaylar = aktiviteQ.data ?? [];
  if (olaylar.length === 0) {
    return (
      <p className="text-muted-foreground/80 px-2 py-3 text-center text-xs">
        Henüz aktivite yok.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        className="bg-border absolute bottom-3 left-[10px] top-3 w-px"
        aria-hidden
      />
      <ul className="relative flex flex-col gap-3">
        {olaylar.map((a) => (
          <li key={a.id}>
            <Olay
              aktivite={a}
              yorumMap={yorumMap}
              ekMap={ekMap}
              uyeMap={uyeMap}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// =====================================================================
// Tek olay — yorum/ek için inline zenginleştirme, diğerleri kuru satır
// =====================================================================

function Olay({
  aktivite,
  yorumMap,
  ekMap,
  uyeMap,
}: {
  aktivite: AktiviteOzeti;
  yorumMap: Map<string, YorumOzeti>;
  ekMap: Map<string, EklentiOzeti>;
  uyeMap: UyeMap;
}) {
  // Yorum CREATE → yorum içeriğini inline kart olarak göster (silinmemiş)
  if (
    aktivite.kategori === "yorum" &&
    aktivite.islem === "CREATE" &&
    aktivite.kaynak_id
  ) {
    const tamYorum = yorumMap.get(aktivite.kaynak_id);
    if (tamYorum) return <YorumOlay y={tamYorum} uyeMap={uyeMap} />;
  }

  // Eklenti CREATE → dosya rozeti (silinmemiş)
  if (
    aktivite.kategori === "eklenti" &&
    aktivite.islem === "CREATE" &&
    aktivite.kaynak_id
  ) {
    const ek = ekMap.get(aktivite.kaynak_id);
    if (ek) return <EkOlay e={ek} />;
  }

  // Diğer her şey → kuru aktivite satırı
  return <AktiviteSatiri aktivite={aktivite} uyeMap={uyeMap} />;
}

// =====================================================================
// Inline yorum kartı (zenginleştirilmiş gösterim)
// =====================================================================

function YorumOlay({ y, uyeMap }: { y: YorumOzeti; uyeMap: UyeMap }) {
  return (
    <div className="flex items-start gap-2">
      <span className="ring-background relative z-[1] ring-2">
        <UyeAvatar
          ad={y.yazan.ad}
          soyad={y.yazan.soyad}
          className="size-5 text-[8px]"
        />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="border-input bg-background rounded-md border px-2.5 py-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-[11.5px] font-semibold">
              {y.yazan.ad} {y.yazan.soyad}
            </span>
            <time
              className="text-muted-foreground/80 text-[10.5px] tabular-nums"
              title={TARIH_TAM.format(new Date(y.olusturma_zamani))}
            >
              · {TARIH_KISA.format(new Date(y.olusturma_zamani))}
            </time>
            {y.duzenlendi_mi && (
              <span className="text-muted-foreground/60 text-[10px]">
                (düzenlendi)
              </span>
            )}
          </div>
          <p className="text-foreground mt-0.5 whitespace-pre-wrap text-[12.5px] leading-[1.5]">
            <MentionliMetin metin={y.icerik} uyeMap={uyeMap} />
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Inline ek dosya rozeti
// =====================================================================

function EkOlay({ e }: { e: EklentiOzeti }) {
  return (
    <div className="flex items-start gap-2">
      <span className="bg-muted text-muted-foreground ring-background relative z-[1] inline-flex size-[22px] items-center justify-center rounded-full ring-2">
        <PaperclipIcon className="size-2.5" />
      </span>
      <div className="text-muted-foreground flex-1 pt-1 text-[12.5px] leading-[1.5]">
        <span className="text-foreground font-semibold">
          {e.yukleyen.ad} {e.yukleyen.soyad}
        </span>{" "}
        ek yükledi:{" "}
        <span className="bg-muted text-foreground ml-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium">
          <PaperclipIcon className="size-2.5" />
          {e.ad}
        </span>
        <time
          className="text-muted-foreground/70 ml-2 text-[10.5px] tabular-nums"
          title={TARIH_TAM.format(new Date(e.olusturma_zamani))}
        >
          {TARIH_KISA.format(new Date(e.olusturma_zamani))}
        </time>
      </div>
    </div>
  );
}

// =====================================================================
// Kuru aktivite satırı (Aktivite sekmesi ile birebir aynı tasarım)
// =====================================================================

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

function AktiviteSatiri({
  aktivite,
  uyeMap,
}: {
  aktivite: AktiviteOzeti;
  uyeMap: UyeMap;
}) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  const adSoyad = aktivite.kullanici
    ? `${aktivite.kullanici.ad} ${aktivite.kullanici.soyad}`.trim()
    : "Sistem";
  const detayMentionlu = aktivite.kategori === "yorum";

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
              {detayMentionlu ? (
                <MentionliMetin metin={aktivite.detay} uyeMap={uyeMap} />
              ) : (
                aktivite.detay
              )}
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
