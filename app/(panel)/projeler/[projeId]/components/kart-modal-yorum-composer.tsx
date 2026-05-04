"use client";

import * as React from "react";
import { BoldIcon, ItalicIcon, PaperclipIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOturumKullanicisi } from "@/hooks/use-oturum";
import { useMentionInput } from "@/hooks/use-mention-input";
import { UyeAvatar } from "../uye/components/uye-avatar";
import { tempId, useYorumOlustur } from "../yorum/hooks";
import { MentionDropdown } from "./mention-dropdown";

// projeId opsiyonel — verilirse @mention autocomplete dropdown aktif olur.
type Props = { kartId: string; projeId?: string };

// Sancak referansı: avatar (sm) + bordered kart (input + format toolbar + Gönder).
// Bold/Italic/Paperclip ikonları yer tutucu — backend zenginleştirme S5+ ile
// gelecek (rich text + ek). Şimdilik UI parçaları görünür ama tıklayınca
// yalnızca focus alınır.
export function KartModalYorumComposer({ kartId, projeId }: Props) {
  const oturumQ = useOturumKullanicisi();
  const oturum = oturumQ.data;
  const olustur = useYorumOlustur(kartId);
  const [taslak, setTaslak] = React.useState("");
  const mention = useMentionInput(taslak, setTaslak);

  if (!oturum) return null;

  const gonder = (e: React.FormEvent) => {
    e.preventDefault();
    const t = taslak.trim();
    if (!t) return;
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
    <form
      onSubmit={gonder}
      className="flex items-start gap-2"
      aria-label="Yorum yaz"
    >
      <UyeAvatar ad={oturum.ad} soyad={oturum.soyad} />
      <div className="border-input bg-background relative flex-1 overflow-visible rounded-md border">
        {projeId && (
          <MentionDropdown
            projeId={projeId}
            query={mention.durum.query}
            acik={mention.durum.acik}
            onSec={mention.secimYap}
            onIptal={mention.iptal}
          />
        )}
        <textarea
          ref={mention.textareaRef}
          value={taslak}
          onChange={mention.onMetinDegisti}
          onKeyDown={(e) => {
            mention.onKlavye(e);
            // Mention popover Enter'ı yakaladığı için gönderim çakışmasın
            if (mention.durum.acik) return;
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") gonder(e);
          }}
          rows={2}
          placeholder="Yorum yaz, @ ile etiketle…"
          className="w-full resize-none bg-transparent px-2.5 py-2 text-[12.5px] outline-none placeholder:text-muted-foreground/70"
        />
        <div className="border-input/60 flex items-center justify-between border-t px-1.5 py-1">
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label="Kalın"
              title="Kalın (yakında)"
              onClick={() => mention.textareaRef.current?.focus()}
            >
              <BoldIcon className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label="İtalik"
              title="İtalik (yakında)"
              onClick={() => mention.textareaRef.current?.focus()}
            >
              <ItalicIcon className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label="Ek iliştir"
              title="Ek iliştir (yakında)"
              onClick={() => mention.textareaRef.current?.focus()}
            >
              <PaperclipIcon className="size-3" />
            </Button>
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-6 gap-1 px-2.5 text-[11.5px]"
            disabled={!taslak.trim()}
          >
            <SendIcon className="size-3" />
            Gönder
          </Button>
        </div>
      </div>
    </form>
  );
}
