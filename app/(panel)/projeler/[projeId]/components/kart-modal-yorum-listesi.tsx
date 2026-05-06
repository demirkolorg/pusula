"use client";

import * as React from "react";
import { Loader2Icon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMentionInput } from "@/hooks/use-mention-input";
import { mentionlariDuzenlemeMetnineCevir } from "@/lib/mention-format";
import { tempIdMi } from "@/lib/temp-id";
import { useOturumKullanicisi } from "@/hooks/use-oturum";
import { MentionliMetin, type KisiMap } from "@/lib/mention";
import { MentionDropdown } from "./mention-dropdown";
import { KisiAvatar } from "../yetkili/components/kisi-avatar";
import { useProjeYetkilileri } from "../yetkili/hooks";
import {
  useKartYorumlari,
  useYorumGuncelle,
  useYorumSil,
} from "../yorum/hooks";
import type { YorumOzeti } from "../yorum/services";

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

// projeId opsiyonel — proje yetkilisi ve yorum içi mention kişi map'leri birleşir.
type Props = { kartId: string; projeId?: string };

// Sancak referansı: yeni → eski sırasıyla, avatar + bubble (white bg + line border).
// Bubble içinde meta satırı (yazan + zaman) + içerik (13px / lh 1.55).
export function KartModalYorumListesi({ kartId, projeId }: Props) {
  const sorgu = useKartYorumlari(kartId);
  const oturumQ = useOturumKullanicisi();
  const oturum = oturumQ.data;
  const yetkililerQ = useProjeYetkilileri(projeId ?? "");

  const kisiMap: KisiMap = React.useMemo(() => {
    const m: KisiMap = new Map();
    if (projeId) {
      for (const u of yetkililerQ.data ?? []) {
        m.set(u.kullanici_id.toLowerCase(), { ad: u.ad, soyad: u.soyad });
      }
    }
    for (const yorum of sorgu.data ?? []) {
      for (const kisi of yorum.mention_kisiler) {
        m.set(kisi.id.toLowerCase(), { ad: kisi.ad, soyad: kisi.soyad });
      }
    }
    return m;
  }, [projeId, sorgu.data, yetkililerQ.data]);

  if (sorgu.isLoading) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 px-2 py-3 text-xs">
        <Loader2Icon className="size-3 animate-spin" /> Yükleniyor…
      </p>
    );
  }

  if ((sorgu.data?.length ?? 0) === 0) {
    return (
      <p className="text-muted-foreground/80 px-2 py-3 text-center text-xs">
        Henüz yorum yok.
      </p>
    );
  }

  // Yeni yorum üstte (sancak: reverse).
  const sirali = [...(sorgu.data ?? [])].reverse();

  return (
    <ul className="flex flex-col gap-2.5">
      {sirali.map((y) => (
        <li key={y.id}>
          <YorumSatiri
            yorum={y}
            kartId={kartId}
            duzenleyebilirMi={!!oturum && y.yazan_id === oturum.id}
            kisiMap={kisiMap}
          />
        </li>
      ))}
    </ul>
  );
}

function YorumSatiri({
  yorum,
  kartId,
  duzenleyebilirMi,
  kisiMap,
}: {
  yorum: YorumOzeti;
  kartId: string;
  duzenleyebilirMi: boolean;
  kisiMap: KisiMap;
}) {
  const duzenlemeMetni = React.useMemo(
    () => mentionlariDuzenlemeMetnineCevir(yorum.icerik, kisiMap),
    [yorum.icerik, kisiMap],
  );
  const [duzenliyor, setDuzenliyor] = React.useState(false);
  const [icerik, setIcerik] = React.useState(duzenlemeMetni.metin);
  const guncelle = useYorumGuncelle(kartId);
  const sil = useYorumSil(kartId);
  const taslak = tempIdMi(yorum.id);
  const {
    durum: mentionDurum,
    textareaRef,
    onMetinDegisti,
    onKlavye,
    secimYap,
    iptal,
    cozumle,
  } = useMentionInput(icerik, setIcerik, duzenlemeMetni.cozumlemeMapi);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = icerik.trim();
    const kaydedilecek = cozumle(t);
    if (!t || kaydedilecek === yorum.icerik) {
      setDuzenliyor(false);
      return;
    }
    await guncelle.mutateAsync({ id: yorum.id, icerik: kaydedilecek });
    setDuzenliyor(false);
  };

  return (
    <div className="flex items-start gap-2">
      <KisiAvatar ad={yorum.yazan.ad} soyad={yorum.yazan.soyad} />
      <div className="min-w-0 flex-1">
        <div className="border-input bg-background rounded-md border px-2.5 py-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-[12px] font-semibold">
              {yorum.yazan.ad} {yorum.yazan.soyad}
            </span>
            <time className="text-muted-foreground/80 text-[11px] tabular-nums">
              {TARIH_BICIM.format(yorum.olusturma_zamani)}
            </time>
            {yorum.duzenlendi_mi && (
              <span className="text-muted-foreground/60 text-[10px]">
                (düzenlendi)
              </span>
            )}
            {taslak && (
              <span className="text-muted-foreground/60 text-[10px]">
                gönderiliyor…
              </span>
            )}
          </div>

          {duzenliyor ? (
            <form onSubmit={kaydet} className="mt-1.5 flex flex-col gap-1.5">
              <div className="relative">
                <MentionDropdown
                  kartId={kartId}
                  query={mentionDurum.query}
                  acik={mentionDurum.acik}
                  onSec={secimYap}
                  onIptal={iptal}
                />
                <Textarea
                  ref={textareaRef}
                  rows={2}
                  value={icerik}
                  onChange={onMetinDegisti}
                  onKeyDown={(e) => {
                    onKlavye(e);
                    if (mentionDurum.acik) return;
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") kaydet(e);
                  }}
                  autoFocus
                  className="min-h-14 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={guncelle.isPending}>
                  Kaydet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIcerik(duzenlemeMetni.metin);
                    setDuzenliyor(false);
                  }}
                >
                  <XIcon className="size-3" /> Vazgeç
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-foreground mt-0.5 whitespace-pre-wrap text-[13px] leading-[1.55]">
              <MentionliMetin metin={yorum.icerik} kisiMap={kisiMap} />
            </p>
          )}
        </div>

        {duzenleyebilirMi && !duzenliyor && !taslak && (
          <div className="text-muted-foreground/80 mt-1 flex gap-3 px-1 text-[11px]">
            <button
              type="button"
              className="hover:text-foreground inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
              onClick={() => {
                setIcerik(duzenlemeMetni.metin);
                setDuzenliyor(true);
              }}
            >
              <PencilIcon className="size-2.5" /> Düzenle
            </button>
            <button
              type="button"
              className="hover:text-destructive inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
              onClick={() => sil.mutate({ id: yorum.id })}
            >
              <Trash2Icon className="size-2.5" /> Sil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
