"use client";

import * as React from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  Building2Icon,
  CheckSquareIcon,
  FilePlus2Icon,
  FolderKanbanIcon,
  InfoIcon,
  KanbanSquareIcon,
  ListChecksIcon,
  ListIcon,
  Loader2Icon,
  MessageSquareIcon,
  PaperclipIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { MentionliMetin, type KisiMap } from "@/lib/mention";
import { KisiAvatar } from "../../yetkili/components/kisi-avatar";
import type { AktiviteOzeti } from "../services";
import { aktiviteDiff, type DiffSegment } from "../aktivite-diff";

// Aktivite kullanıcısı yoksa "Sistem" — audit middleware bypass'lı yazımlar
// (seed, migration, cron) için fallback. Hem satır header'ı hem detay
// görünümü aynı isim formatını paylaşır.
export function aktiviteKullaniciAdi(aktivite: AktiviteOzeti): string {
  return aktivite.kullanici
    ? `${aktivite.kullanici.ad} ${aktivite.kullanici.soyad}`.trim()
    : "Sistem";
}

export const KATEGORI_ETIKET: Record<AktiviteOzeti["kategori"], string> = {
  proje: "Proje",
  liste: "Liste",
  kart: "Kart",
  etiket: "Etiket",
  yetkili: "Yetkili",
  "kontrol-listesi": "Kontrol Listesi",
  "kontrol-maddesi": "Kontrol Maddesi",
  yorum: "Yorum",
  eklenti: "Eklenti",
  "hedef-birim": "Birim",
  diger: "Diğer",
};

const ISLEM_ETIKET: Record<AktiviteOzeti["islem"], string> = {
  CREATE: "Oluşturma",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
};

function islemRozetSinifi(islem: AktiviteOzeti["islem"]): string {
  switch (islem) {
    case "CREATE":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "DELETE":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
    case "UPDATE":
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
}

// Presentational — data ve kisiMap dışarıdan gelir. Loading/empty state
// içeride yönetilir; çağıran bileşen kendi hook'unu (kart veya proje
// aktivitesi) seçer.
//
// `kartId` prop'u kaldırıldı — eski kart-only kullanım için bkz.
// kart-modal-aktivite-listesi.tsx (wrapper).
type Props = {
  data: AktiviteOzeti[] | undefined;
  yukleniyor: boolean;
  kisiMap: KisiMap;
  // Boş hâl mesajı — kart bağlamında "kartta yapılan" / proje bağlamında
  // "projede yapılan" şeklinde değişir.
  bosBaslik?: string;
  bosAciklama?: string;
  // Bağlam göstergesi — proje aktivite modalında true; her satırda olayın
  // hangi liste / kartla ilgili olduğunu chip olarak gösterir. Kart modalında
  // false (kart zaten bağlamda).
  baglamGoster?: boolean;
  // Detay görüntüleme handler'ı. Verilirse satır kendi diyaloğunu açmaz;
  // parent (örn. ProjeAktiviteModal) master-detail görünümünü yönetir ve
  // nested-dialog problemini önler. Verilmezse satır içeride dialog açar
  // (kart modalındaki gibi geriye uyumlu davranış).
  onDetayAc?: (aktivite: AktiviteOzeti) => void;
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

export const KATEGORI_IKON: Record<
  AktiviteOzeti["kategori"],
  React.ComponentType<{ className?: string }>
> = {
  proje: FolderKanbanIcon,
  liste: ListIcon,
  kart: ActivityIcon,
  etiket: TagIcon,
  yetkili: UsersIcon,
  "kontrol-listesi": ListChecksIcon,
  "kontrol-maddesi": CheckSquareIcon,
  yorum: MessageSquareIcon,
  eklenti: PaperclipIcon,
  "hedef-birim": Building2Icon,
  diger: FilePlus2Icon,
};

// Sancak referansı: dikey timeline — sol kenarda 1px line, her olay için
// 22x22 daire (kategori rengi), sağda kullanıcı + mesaj + detay + zaman.
export function AktiviteListesi({
  data,
  yukleniyor,
  kisiMap,
  bosBaslik = "Henüz aktivite yok.",
  bosAciklama = "Yapılan her değişiklik (atama, tarih, etiket, yorum, durum, kontrol maddesi, eklenti, ilişki) burada zaman çizelgesinde görünür.",
  baglamGoster = false,
  onDetayAc,
}: Props) {
  if (yukleniyor) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 px-2 py-3 text-xs">
        <Loader2Icon className="size-3 animate-spin" /> Yükleniyor…
      </p>
    );
  }

  if ((data?.length ?? 0) === 0) {
    return (
      <div className="border-muted relative rounded-md border border-dashed py-10 text-center">
        <div className="text-muted-foreground/80 mx-auto flex flex-col items-center gap-2">
          <ActivityIcon className="size-5" />
          <p className="text-xs">{bosBaslik}</p>
          <p className="text-muted-foreground/60 max-w-[240px] text-[11px] leading-snug">
            {bosAciklama}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline rail — ikon merkezleriyle hizalı (left-[15px] = 30px gutter / 2) */}
      <div
        className="bg-border/70 absolute bottom-4 left-[15px] top-4 w-px"
        aria-hidden
      />
      <ul className="relative flex flex-col gap-5">
        {data?.map((a) => (
          <li key={a.id}>
            <AktiviteSatiri
              aktivite={a}
              kisiMap={kisiMap}
              baglamGoster={baglamGoster}
              onDetayAc={onDetayAc ? () => onDetayAc(a) : undefined}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AktiviteSatiri({
  aktivite,
  kisiMap,
  baglamGoster,
  onDetayAc,
}: {
  aktivite: AktiviteOzeti;
  kisiMap: KisiMap;
  baglamGoster: boolean;
  onDetayAc?: () => void;
}) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  const adSoyad = aktiviteKullaniciAdi(aktivite);
  // Lokal dialog state — sadece onDetayAc verilmediği zaman kullanılır
  // (kart modalı gibi geriye uyumlu kullanımlarda). Hook her zaman çağrılır
  // (rules-of-hooks); kullanım koşullu.
  const [detayAcik, setDetayAcik] = React.useState(false);
  // Sadece yorum kategorisinde detay = ham yorum içeriği — mention parse et.
  const detayMentionlu = aktivite.kategori === "yorum";

  return (
    <div className="flex items-start gap-3">
      {/* Sol kolon: avatar veya kategori ikonu — daire genişliği 30px sabit */}
      <div className="flex w-[30px] shrink-0 justify-center">
        {aktivite.kullanici ? (
          <span className="ring-background relative z-[1] ring-2">
            <KisiAvatar
              ad={aktivite.kullanici.ad}
              soyad={aktivite.kullanici.soyad}
              className="size-[30px] text-[10px]"
            />
          </span>
        ) : (
          <span
            className={cn(
              "ring-background relative z-[1] inline-flex size-[30px] items-center justify-center rounded-full ring-2",
              kategoriArkaplan(aktivite.kategori),
            )}
            aria-label="Sistem"
          >
            <Ikon className="size-[14px]" />
          </span>
        )}
      </div>

      {/* Sağ kolon: header + mesaj + (varsa) inline değişiklik özeti */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Header satırı: ad (sol) — zaman + Detay ikon butonu (sağ) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground truncate text-[13px] font-semibold leading-tight">
            {adSoyad}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <time
              className="text-muted-foreground/70 text-[10.5px] tabular-nums"
              title={TARIH_TAM.format(new Date(aktivite.zaman))}
            >
              {TARIH_KISA.format(new Date(aktivite.zaman))}
            </time>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground/70 hover:text-foreground hover:bg-muted size-6 rounded-full"
              onClick={() =>
                onDetayAc ? onDetayAc() : setDetayAcik(true)
              }
              aria-label="Aktivite detayını gör"
              title="Detay"
            >
              <InfoIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Mesaj satırı: kategori ikonu + mesaj + (varsa) chip — tek satır akış */}
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] leading-snug">
          <Ikon
            className={cn(
              "size-3.5 shrink-0",
              kategoriYazi(aktivite.kategori),
            )}
            aria-hidden
          />
          <span>{aktivite.mesaj}</span>
          {aktivite.detay && (
            <span className="bg-muted text-foreground inline-block max-w-[260px] truncate rounded-md px-2 py-0.5 text-[11.5px] font-medium">
              {detayMentionlu ? (
                <MentionliMetin metin={aktivite.detay} kisiMap={kisiMap} />
              ) : (
                aktivite.detay
              )}
            </span>
          )}
        </p>

        {/* Bağlam chip satırı — proje aktivite modalında gösterilir.
            "hangi liste, hangi kart" bilgisi olmadan proje timeline'ı
            soyut kalır. Kart modalında gösterilmez (kart zaten bağlamda). */}
        {baglamGoster && aktivite.baglam && (
          <BaglamSatiri baglam={aktivite.baglam} />
        )}
      </div>

      {/* Geriye uyumlu lokal dialog — sadece parent onDetayAc vermediğinde */}
      {!onDetayAc && (
        <AktiviteDetayDiyalog
          aktivite={aktivite}
          kisiMap={kisiMap}
          acik={detayAcik}
          onAcikDegisti={setDetayAcik}
        />
      )}
    </div>
  );
}

// Bağlam chip'leri — "Liste › Kart" şeklinde sıkıştırılmış göster.
// Hem liste hem kart varsa: [📋 Liste] › [🪪 Kart başlığı]
// Sadece liste varsa: [📋 Liste]
// Kart varsa ama liste yok (silinmiş): [🪪 Kart] (silinmiş liste'yi gizle)
// Sadece kart_id var ad yok: [🪪 (silinmiş kart)]
function BaglamSatiri({
  baglam,
}: {
  baglam: NonNullable<AktiviteOzeti["baglam"]>;
}) {
  const { liste, kart } = baglam;
  if (!liste && !kart) return null;
  return (
    <div className="text-muted-foreground/85 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px]">
      {liste && (
        <span
          className="border-border/60 bg-background inline-flex max-w-[180px] items-center gap-1 truncate rounded-md border px-1.5 py-0.5"
          title={liste.ad ?? "(silinmiş liste)"}
        >
          <ListIcon className="text-muted-foreground/70 size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {liste.ad ?? (
              <span className="italic opacity-70">(silinmiş liste)</span>
            )}
          </span>
        </span>
      )}
      {liste && kart && (
        <span className="text-muted-foreground/40" aria-hidden>
          ›
        </span>
      )}
      {kart && (
        <span
          className="border-border/60 bg-background inline-flex max-w-[260px] items-center gap-1 truncate rounded-md border px-1.5 py-0.5"
          title={kart.baslik ?? "(silinmiş kart)"}
        >
          <ActivityIcon className="text-muted-foreground/70 size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {kart.baslik ?? (
              <span className="italic opacity-70">(silinmiş kart)</span>
            )}
          </span>
        </span>
      )}
    </div>
  );
}

// Tam aktivite detayı — meta grid (kullanıcı, ID'ler, işlem, kategori, tarih)
// + olay özeti + değişiklikler (KIRPMA YOK: değerler tam halde gösterilir).
//
// İki kullanım modu:
// 1. Bağımsız diyalog → AktiviteDetayDiyalog (kart modal yan paneli, geriye
//    uyumluluk). Üst dialog'un içinde değil; nested-dialog problemi yok.
// 2. Master-detail tek dialog → ProjeAktiviteModal kendi container'ında
//    yalnızca AktiviteDetayIcerik'i render eder; geri butonuyla listeye döner.
//    Bu sayede iki ResponsiveDialog'un üst üste portal'a yığılmasından
//    doğan z-index/scroll-lock/escape sıra çakışması ortadan kalkar.
function AktiviteDetayDiyalog({
  aktivite,
  kisiMap,
  acik,
  onAcikDegisti,
}: {
  aktivite: AktiviteOzeti;
  kisiMap: KisiMap;
  acik: boolean;
  onAcikDegisti: (a: boolean) => void;
}) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  return (
    <ResponsiveDialog open={acik} onOpenChange={onAcikDegisti}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 text-base">
            <span
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full",
                kategoriArkaplan(aktivite.kategori),
              )}
              aria-hidden
            >
              <Ikon className="size-3.5" />
            </span>
            Aktivite detayı
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-muted-foreground text-[12px]">
            Bu kayıt audit logundan alınmış ham olay verisinin tamamını içerir.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="-mr-2 max-h-[70vh] overflow-y-auto pr-2">
          <AktiviteDetayIcerik aktivite={aktivite} kisiMap={kisiMap} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// Saf içerik (header'sız) — diyaloğun gövdesi. ProjeAktiviteModal master-detail
// görünümünde ve AktiviteDetayDiyalog içinde aynı içeriği render eder.
export function AktiviteDetayIcerik({
  aktivite,
  kisiMap,
}: {
  aktivite: AktiviteOzeti;
  kisiMap: KisiMap;
}) {
  const Ikon = KATEGORI_IKON[aktivite.kategori];
  const islemEtiket = ISLEM_ETIKET[aktivite.islem];
  const kategoriEtiket = KATEGORI_ETIKET[aktivite.kategori];
  // Audit log'da kullanici_id null olduğunda kayıt bir kullanıcıya bağlı
  // değildir (seed, migration, cron, audit-bypass'lı sistem yazımı).
  // Bu bir hata değil; tasarımsal olarak "Sistem aksiyonu" diye gösterilir
  // ve "Kullanıcı ID" alanı kaldırılır (—  yanıltıcı).
  const sistemAksiyonu = !aktivite.kullanici;
  const detayMentionlu = aktivite.kategori === "yorum";
  const kullanici = aktiviteKullaniciAdi(aktivite);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.35fr)]">
      <div className="space-y-3 lg:sticky lg:top-0 lg:self-start">
          <div className="border-border/70 bg-muted/40 rounded-lg border p-3">
            <div className="text-muted-foreground/80 mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
              <Ikon
                className={cn("size-3.5", kategoriYazi(aktivite.kategori))}
                aria-hidden
              />
              Olay
            </div>
            <p className="text-foreground text-[13.5px] leading-snug">
              <span className="font-semibold">{kullanici}</span>{" "}
              <span>{aktivite.mesaj}</span>
              {aktivite.detay && (
                <>
                  {": "}
                  <span className="bg-background border-border/60 ml-0.5 inline-block break-words rounded-md border px-2 py-0.5 text-[12.5px] font-medium">
                    {detayMentionlu ? (
                      <MentionliMetin
                        metin={aktivite.detay}
                        kisiMap={kisiMap}
                      />
                    ) : (
                      aktivite.detay
                    )}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Meta bilgi grid — sadece kullanıcıya anlamlı alanlar.
              ID alanları (Kullanıcı/Aktivite/Kaynak ID) UI'da gerekli
              değil; sistem aksiyonu için tek-satır net açıklama. */}
          <dl className="border-border/70 grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {sistemAksiyonu ? (
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <dt className="text-muted-foreground/70 text-[10.5px] font-medium uppercase tracking-wide">
                  Kullanıcı
                </dt>
                <dd className="text-foreground flex flex-wrap items-center gap-2 text-[12.5px]">
                  <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                    Sistem aksiyonu
                  </span>
                  <span className="text-muted-foreground/80 text-[11.5px]">
                    Bu kayıt bir kullanıcı oturumuna bağlı değil — otomatik bir
                    sistem işleminden veya audit-bağımsız yazımdan kaynaklanıyor.
                  </span>
                </dd>
              </div>
            ) : (
              <MetaSatiri etiket="Kullanıcı" deger={kullanici} />
            )}
            <MetaSatiri
              etiket="Tarih"
              deger={TARIH_TAM.format(new Date(aktivite.zaman))}
            />
            <MetaSatiri
              etiket="İşlem"
              deger={
                <span
                  className={cn(
                    "inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold",
                    islemRozetSinifi(aktivite.islem),
                  )}
                >
                  {islemEtiket}
                </span>
              }
            />
            <MetaSatiri etiket="Kategori" deger={kategoriEtiket} />
            {aktivite.baglam?.proje && (
              <MetaSatiri
                etiket="Proje"
                deger={
                  <span className="inline-flex items-center gap-1.5">
                    <KanbanSquareIcon
                      className="text-muted-foreground/70 size-3.5 shrink-0"
                      aria-hidden
                    />
                    {aktivite.baglam.proje.ad ?? (
                      <span className="text-muted-foreground italic">
                        (silinmiş proje)
                      </span>
                    )}
                  </span>
                }
              />
            )}
            {aktivite.baglam?.liste && (
              <MetaSatiri
                etiket="Liste"
                deger={
                  <span className="inline-flex items-center gap-1.5">
                    <ListIcon
                      className="text-muted-foreground/70 size-3.5 shrink-0"
                      aria-hidden
                    />
                    {aktivite.baglam.liste.ad ?? (
                      <span className="text-muted-foreground italic">
                        (silinmiş liste)
                      </span>
                    )}
                  </span>
                }
              />
            )}
            {aktivite.baglam?.kart && (
              <MetaSatiri
                etiket="Kart"
                deger={
                  <span className="inline-flex items-center gap-1.5">
                    <ActivityIcon
                      className="text-muted-foreground/70 size-3.5 shrink-0"
                      aria-hidden
                    />
                    {aktivite.baglam.kart.baslik ?? (
                      <span className="text-muted-foreground italic">
                        (silinmiş kart)
                      </span>
                    )}
                  </span>
                }
              />
            )}
          </dl>
      </div>

      <div className="min-w-0 space-y-2">
          {/* Değişiklikler — KIRPMA YOK */}
          {aktivite.degisiklikler && aktivite.degisiklikler.length > 0 ? (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium uppercase tracking-wide">
                <span>Değişiklikler ({aktivite.degisiklikler.length})</span>
                <div className="hidden gap-3 sm:flex">
                  <span>Eski</span>
                  <span className="w-4" aria-hidden />
                  <span>Yeni</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {aktivite.degisiklikler.map((d, i) => {
                  const diff = aktiviteDiff(d.eski ?? "", d.yeni ?? "");
                  return (
                    <li
                      key={i}
                      className="border-border/70 rounded-lg border p-3"
                    >
                      <p className="text-foreground mb-2 text-[12.5px] font-semibold">
                        {d.alan}
                      </p>
                      <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
                        <DiyalogDeger
                          v={d.eski}
                          segmentler={diff.eski}
                          tip="eski"
                        />
                        <div className="text-muted-foreground/50 flex items-center justify-center">
                          <ArrowRightIcon
                            className="size-4 rotate-90 sm:rotate-0"
                            aria-hidden
                          />
                        </div>
                        <DiyalogDeger
                          v={d.yeni}
                          segmentler={diff.yeni}
                          tip="yeni"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="border-border/70 bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-[12px]">
              Bu olay için alan bazlı bir değişiklik kaydı yok
              {aktivite.islem === "CREATE"
                ? " (kayıt oluşturma olayı)"
                : aktivite.islem === "DELETE"
                  ? " (kayıt silme olayı)"
                  : ""}
              .
            </div>
          )}
      </div>
    </div>
  );
}

function MetaSatiri({
  etiket,
  deger,
  mono,
}: {
  etiket: string;
  deger: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground/70 text-[10.5px] font-medium uppercase tracking-wide">
        {etiket}
      </dt>
      <dd
        className={cn(
          "text-foreground break-all text-[12.5px]",
          mono && "font-mono text-[11.5px]",
        )}
      >
        {deger}
      </dd>
    </div>
  );
}

function DiyalogDeger({
  v,
  segmentler,
  tip,
}: {
  v: string | null;
  segmentler: DiffSegment[];
  tip: "eski" | "yeni";
}) {
  const bos = v === null || v === "";
  return (
    <div
      className={cn(
        "min-h-[48px] rounded-md border p-2.5 text-[12.5px] leading-snug",
        tip === "eski"
          ? "border-rose-200/60 bg-rose-50/50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
          : "border-emerald-200/60 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          tip === "eski"
            ? "text-rose-700/70 dark:text-rose-300/70"
            : "text-emerald-700/70 dark:text-emerald-300/70",
        )}
      >
        {tip === "eski" ? "Eski" : "Yeni"}
      </p>
      {/* Kırpma YOK — değer tam halde, ortak parçalar sönük, fark parçalar
          vurgulu (eski → strike + kırmızı bg / yeni → underline + yeşil bg) */}
      <div className="mt-1 whitespace-pre-wrap break-words">
        {bos ? (
          <span className="text-muted-foreground/60 italic">— (boş)</span>
        ) : (
          segmentler.map((s, i) => (
            <DiffParcasi key={i} segment={s} tip={tip} />
          ))
        )}
      </div>
    </div>
  );
}

function DiffParcasi({
  segment,
  tip,
}: {
  segment: DiffSegment;
  tip: "eski" | "yeni";
}) {
  if (segment.tip === "ortak") {
    // Ortak parça: temel renkten daha sönük → "değişmeyen" gözüksün
    return (
      <span
        className={cn(
          tip === "eski"
            ? "text-rose-900/55 dark:text-rose-200/55"
            : "text-emerald-900/55 dark:text-emerald-200/55",
        )}
      >
        {segment.metin}
      </span>
    );
  }
  // Fark parça: vurgulu — eski tarafta "silinen", yeni tarafta "eklenen"
  return (
    <span
      className={cn(
        "rounded-sm px-0.5 font-medium",
        tip === "eski"
          ? "bg-rose-200/60 text-rose-950 line-through decoration-rose-700/60 dark:bg-rose-900/50 dark:text-rose-100"
          : "bg-emerald-200/60 text-emerald-950 underline decoration-emerald-700/60 underline-offset-2 dark:bg-emerald-900/50 dark:text-emerald-100",
      )}
    >
      {segment.metin}
    </span>
  );
}

export function kategoriArkaplan(kategori: AktiviteOzeti["kategori"]): string {
  switch (kategori) {
    case "yorum":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case "etiket":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    case "yetkili":
      return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
    case "kontrol-listesi":
    case "kontrol-maddesi":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "eklenti":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "hedef-birim":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300";
    case "kart":
    case "diger":
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function kategoriYazi(kategori: AktiviteOzeti["kategori"]): string {
  switch (kategori) {
    case "yorum":
      return "text-blue-600 dark:text-blue-400";
    case "etiket":
      return "text-amber-600 dark:text-amber-400";
    case "yetkili":
      return "text-purple-600 dark:text-purple-400";
    case "kontrol-listesi":
    case "kontrol-maddesi":
      return "text-emerald-600 dark:text-emerald-400";
    case "hedef-birim":
      return "text-cyan-600 dark:text-cyan-400";
    default:
      return "text-muted-foreground";
  }
}
