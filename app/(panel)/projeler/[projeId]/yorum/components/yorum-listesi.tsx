"use client";

import * as React from "react";
import { Loader2, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { tempIdMi } from "@/lib/temp-id";
import { useOturumKullanicisi } from "@/hooks/use-oturum";
import { UyeAvatar } from "../../uye/components/uye-avatar";
import {
  tempId,
  useKartYorumlari,
  useYorumGuncelle,
  useYorumOlustur,
  useYorumSil,
} from "../hooks";
import type { YorumOzeti } from "../services";

type Props = {
  kartId: string;
};

export function YorumListesi({ kartId }: Props) {
  const sorgu = useKartYorumlari(kartId);
  const oturumQ = useOturumKullanicisi();
  const oturum = oturumQ.data;

  const olustur = useYorumOlustur(kartId);
  const [taslak, setTaslak] = React.useState("");

  const gonder = (e: React.FormEvent) => {
    e.preventDefault();
    const t = taslak.trim();
    if (!t || !oturum) return;
    olustur.mutate({
      id_taslak: tempId(),
      kart_id: kartId,
      icerik: t,
      yazan_id: oturum.id,
      yazan: { ad: oturum.ad, soyad: oturum.soyad, email: oturum.email },
    });
    setTaslak("");
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Yorumlar</p>

      {/* Composer */}
      {oturum ? (
        <form onSubmit={gonder} className="flex gap-2">
          <UyeAvatar ad={oturum.ad} soyad={oturum.soyad} />
          <div className="flex flex-1 flex-col gap-2">
            <Textarea
              rows={2}
              value={taslak}
              onChange={(e) => setTaslak(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  gonder(e);
                }
              }}
              placeholder="Yorum yazın… (Cmd/Ctrl+Enter ile gönder)"
              className="min-h-16 resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!taslak.trim()}>
                Gönder
              </Button>
            </div>
          </div>
        </form>
      ) : null}

      {/* Liste */}
      {sorgu.isLoading ? (
        <p className="text-muted-foreground text-xs">
          <Loader2 className="inline size-3 animate-spin" /> Yükleniyor…
        </p>
      ) : (sorgu.data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground text-xs">Henüz yorum yok.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorgu.data?.map((y) => (
            <li key={y.id}>
              <YorumSatiri
                yorum={y}
                kartId={kartId}
                duzenleyebilirMi={!!oturum && y.yazan_id === oturum.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =====================================================================
// Tek yorum satırı — view + edit modu
// =====================================================================

function YorumSatiri({
  yorum,
  kartId,
  duzenleyebilirMi,
}: {
  yorum: YorumOzeti;
  kartId: string;
  duzenleyebilirMi: boolean;
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

  const sileBas = () => {
    if (taslak) return;
    sil.mutate({ id: yorum.id });
  };

  return (
    <div className="flex gap-2">
      <UyeAvatar ad={yorum.yazan.ad} soyad={yorum.yazan.soyad} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {yorum.yazan.ad} {yorum.yazan.soyad}
          </span>
          <time className="text-muted-foreground text-[11px]">
            {tarihEtiketi(yorum.olusturma_zamani)}
          </time>
          {yorum.duzenlendi_mi && (
            <span className="text-muted-foreground text-[10px]">(düzenlendi)</span>
          )}
          {taslak && (
            <span className="text-muted-foreground text-[10px]">gönderiliyor…</span>
          )}
        </div>

        {duzenliyor ? (
          <form onSubmit={kaydet} className="mt-1 flex flex-col gap-1.5">
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
          <>
            <p className="mt-0.5 whitespace-pre-wrap text-sm">{yorum.icerik}</p>
            {duzenleyebilirMi && !taslak && (
              <div className="text-muted-foreground mt-1 flex gap-3 text-[11px]">
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
                  onClick={sileBas}
                >
                  <Trash2Icon className="size-2.5" /> Sil
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const TARIH_BICIM = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function tarihEtiketi(d: Date | string): string {
  return TARIH_BICIM.format(d instanceof Date ? d : new Date(d));
}
