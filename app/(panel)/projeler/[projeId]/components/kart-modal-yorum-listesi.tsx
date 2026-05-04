"use client";

import * as React from "react";
import { Loader2Icon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { tempIdMi } from "@/lib/temp-id";
import { useOturumKullanicisi } from "@/hooks/use-oturum";
import { MentionliMetin, type UyeMap } from "@/lib/mention";
import { UyeAvatar } from "../uye/components/uye-avatar";
import { useProjeUyeleri } from "../uye/hooks";
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
});

// projeId opsiyonel — verilirse mention rozetleri proje üyesi adlarıyla
// zenginleşir. Yoksa UUID ham görünür (geriye uyumlu).
type Props = { kartId: string; projeId?: string };

// Sancak referansı: yeni → eski sırasıyla, avatar + bubble (white bg + line border).
// Bubble içinde meta satırı (yazan + zaman) + içerik (13px / lh 1.55).
export function KartModalYorumListesi({ kartId, projeId }: Props) {
  const sorgu = useKartYorumlari(kartId);
  const oturumQ = useOturumKullanicisi();
  const oturum = oturumQ.data;
  const uyelerQ = useProjeUyeleri(projeId ?? "");

  const uyeMap: UyeMap = React.useMemo(() => {
    const m: UyeMap = new Map();
    if (!projeId) return m;
    for (const u of uyelerQ.data ?? []) {
      m.set(u.kullanici_id, { ad: u.ad, soyad: u.soyad });
    }
    return m;
  }, [projeId, uyelerQ.data]);

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
            uyeMap={uyeMap}
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
  uyeMap,
}: {
  yorum: YorumOzeti;
  kartId: string;
  duzenleyebilirMi: boolean;
  uyeMap: UyeMap;
}) {
  const [duzenliyor, setDuzenliyor] = React.useState(false);
  const [icerik, setIcerik] = React.useState(yorum.icerik);
  const guncelle = useYorumGuncelle(kartId);
  const sil = useYorumSil(kartId);
  const taslak = tempIdMi(yorum.id);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = icerik.trim();
    if (!t || t === yorum.icerik) {
      setDuzenliyor(false);
      return;
    }
    await guncelle.mutateAsync({ id: yorum.id, icerik: t });
    setDuzenliyor(false);
  };

  return (
    <div className="flex items-start gap-2">
      <UyeAvatar ad={yorum.yazan.ad} soyad={yorum.yazan.soyad} />
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
              <Textarea
                rows={2}
                value={icerik}
                onChange={(e) => setIcerik(e.target.value)}
                autoFocus
                className="min-h-14 resize-none"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={guncelle.isPending}>
                  Kaydet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIcerik(yorum.icerik);
                    setDuzenliyor(false);
                  }}
                >
                  <XIcon className="size-3" /> Vazgeç
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-foreground mt-0.5 whitespace-pre-wrap text-[13px] leading-[1.55]">
              <MentionliMetin metin={yorum.icerik} uyeMap={uyeMap} />
            </p>
          )}
        </div>

        {duzenleyebilirMi && !duzenliyor && !taslak && (
          <div className="text-muted-foreground/80 mt-1 flex gap-3 px-1 text-[11px]">
            <button
              type="button"
              className="hover:text-foreground inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
              onClick={() => setDuzenliyor(true)}
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
