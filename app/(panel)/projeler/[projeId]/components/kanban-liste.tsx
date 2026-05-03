"use client";

// useSortable ref'i ve listener'ı render'da üretir (dnd-kit resmi pattern'i).
/* eslint-disable react-hooks/refs */

import * as React from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreHorizontalIcon,
  Plus,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { tempId, tempIdMi } from "@/lib/temp-id";
import type { ListeOzeti } from "../services";
import { KartMini } from "./kart-mini";
import {
  projeDetayKey,
  useKartOlustur,
  useListeGuncelle,
  useListeSil,
} from "../hooks/detay-sorgulari";
import type { KanbanYetkileri } from "./kanban-pano";

type Props = {
  liste: ListeOzeti;
  projeId: string;
  yetkiler: KanbanYetkileri;
  kartPlaceholder: {
    liste_id: string;
    index: number;
    yukseklik: number | null;
  } | null;
  onKartAc: (kartId: string) => void;
};

function KartDropPlaceholder({ yukseklik }: { yukseklik: number | null }) {
  return (
    <div
      className="border-primary/60 bg-primary/5 box-border rounded-md border border-dashed p-2"
      style={yukseklik ? { height: yukseklik } : undefined}
      aria-hidden
    >
      <div className="invisible">
        <span className="line-clamp-3 font-medium leading-snug">&nbsp;</span>
      </div>
    </div>
  );
}

export function KanbanListe({
  liste,
  projeId,
  yetkiler,
  kartPlaceholder,
  onKartAc,
}: Props) {
  // anahtar her render'da yeni array referansı olmasın diye memoize.
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const kartOlustur = useKartOlustur(anahtar);
  const listeGuncelle = useListeGuncelle(anahtar);
  const listeSil = useListeSil(anahtar);

  const [yeniKartAcik, setYeniKartAcik] = React.useState(false);
  const [yeniKartBaslik, setYeniKartBaslik] = React.useState("");
  const [duzenlemeAcik, setDuzenlemeAcik] = React.useState(false);
  const [yeniAd, setYeniAd] = React.useState(liste.ad);

  const taslak = tempIdMi(liste.id);

  // KRİTİK: dnd-kit useSortable/useDroppable'a verilen `data` her render'da
  // yeni referans olursa hook diff tetikleyip state güncelleyebiliyor →
  // re-render → yeni referans → infinite loop. useMemo ile sabitle.
  const listeSortableData = React.useMemo(
    () => ({ tip: "liste" as const, liste_id: liste.id }),
    [liste.id],
  );
  const bodyDroppableData = React.useMemo(
    () => ({ tip: "liste-body" as const, liste_id: liste.id }),
    [liste.id],
  );

  // Liste kendisi sortable (yatay sıralama için).
  const sortable = useSortable({
    id: liste.id,
    data: listeSortableData,
    disabled: taslak || !yetkiler.listeDuzenle,
    transition: null,
  });

  // Liste body'si droppable — kartların düşürüleceği bölge.
  // Boş listeye de düşürmek için zorunlu (sortable kart kümesi alone yetmiyor).
  const bodyDroppable = useDroppable({
    id: `liste-body-${liste.id}`,
    data: bodyDroppableData,
    disabled: taslak || !yetkiler.kartTasi,
  });

  // Liste drop sonrası soldan akmasın: listelerde dnd-kit layout transition'ını
  // kapatıyoruz; cache zaten tek seferde doğru sıraya yazılıyor.
  const stil: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: "none",
  };

  const kartIdleri = React.useMemo(
    () => liste.kartlar.map((k) => k.id),
    [liste.kartlar],
  );

  const yeniKartGonder = () => {
    const baslik = yeniKartBaslik.trim();
    if (!baslik) return;
    kartOlustur.mutate({
      id_taslak: tempId(),
      liste_id: liste.id,
      baslik,
      aciklama: null,
    });
    setYeniKartBaslik("");
    setYeniKartAcik(false);
  };

  const adKaydet = () => {
    const ad = yeniAd.trim();
    if (!ad || ad === liste.ad) {
      setDuzenlemeAcik(false);
      return;
    }
    listeGuncelle.mutate({ id: liste.id, ad });
    setDuzenlemeAcik(false);
  };

  // Header tıklaması: drag yoktuysa rename moduna gir.
  // Distance kısıtı (5px) sayesinde küçük tıklama drag'i tetiklemez,
  // PointerSensor onClick'i pass-through eder.
  const headerClick = () => {
    if (taslak || !yetkiler.listeDuzenle) return;
    if (sortable.isDragging) return;
    setYeniAd(liste.ad);
    setDuzenlemeAcik(true);
  };

  // TEK root + conditional içerik. Aksi halde dnd-kit setNodeRef'i farklı
  // DOM düğümlerine bağlayınca sonsuz state değişikliği döngüsü oluşur.
  const ruyaModu = sortable.isDragging;

  if (ruyaModu) {
    return (
      <div
        ref={sortable.setNodeRef}
        style={stil}
        className="border-primary/60 bg-primary/5 h-32 w-72 shrink-0 self-start rounded-lg border border-dashed"
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={sortable.setNodeRef}
      style={stil}
      // Trello: liste içeriğe göre yükseliyor; max-height pano viewport'una göre.
      // Liste container'ında ring/highlight YOK — drag feedback sadece kartlar
      // arasındaki dashed placeholder ile verilir (kart-mini.tsx). Tutarlılık.
      className={cn(
        "bg-muted/40 flex w-72 shrink-0 flex-col self-start rounded-lg border",
        "max-h-[calc(100vh-12rem)]",
      )}
    >
      {/* HEADER — sortable handle (sadece bu bölge sürükle başlatır) */}
      <div
        className="flex items-center justify-between gap-1 p-2"
        {...sortable.attributes}
        {...sortable.listeners}
        onClick={duzenlemeAcik ? undefined : headerClick}
        style={{
          cursor:
            yetkiler.listeDuzenle && !taslak && !duzenlemeAcik
              ? "grab"
              : "default",
          touchAction: "none",
        }}
      >
        {duzenlemeAcik ? (
          <Input
            value={yeniAd}
            onChange={(e) => setYeniAd(e.target.value)}
            onBlur={adKaydet}
            onKeyDown={(e) => {
              if (e.key === "Enter") adKaydet();
              if (e.key === "Escape") {
                setYeniAd(liste.ad);
                setDuzenlemeAcik(false);
              }
            }}
            autoFocus
            className="h-7"
            // Input içinde drag listener'ı çalışmasın (input'ta yazı yazılır).
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex flex-1 items-center gap-2 truncate text-sm font-medium">
            <span className="truncate">{liste.ad}</span>
            <span className="text-muted-foreground text-xs font-normal">
              {liste.kartlar.length}
            </span>
          </div>
        )}
        {!taslak &&
          (yetkiler.listeDuzenle || yetkiler.listeSil) &&
          !duzenlemeAcik && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Liste menüsü"
                  // Menu butonu drag'i ve header click'i başlatmasın.
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {yetkiler.listeDuzenle && (
                <DropdownMenuItem
                  onClick={() => {
                    setYeniAd(liste.ad);
                    setDuzenlemeAcik(true);
                  }}
                >
                  <PencilIcon className="size-4" /> Yeniden adlandır
                </DropdownMenuItem>
              )}
              {yetkiler.listeSil && (
                <DropdownMenuItem
                  onClick={() => listeSil.mutate({ id: liste.id })}
                  className="text-destructive"
                >
                  <Trash2Icon className="size-4" /> Listeyi sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* BODY + FOOTER — droppable wrapper.
          Trello davranışı: boş listede ekstra yükseklik YOK; "Kart ekle"
          butonu hemen header altında. Drop alanı footer'ı da kapsadığı için
          boş listede "Kart ekle" üstüne sürükleme de drop tespit eder. */}
      <div ref={bodyDroppable.setNodeRef} className="flex flex-col">
        <div
          className={cn(
            // overflow-y: auto yerine `[overflow-y:overlay]` benzeri davranış için
            // hem stable scrollbar gutter hem auto. Modern tarayıcılarda
            // `scrollbar-gutter: stable` scrollbar bir görünüp bir kaybolmaz.
            "flex flex-col gap-2 overflow-y-auto px-2 [scrollbar-gutter:stable]",
            liste.kartlar.length > 0 ? "pb-1" : "",
          )}
        >
          <SortableContext items={kartIdleri} strategy={verticalListSortingStrategy}>
            {kartPlaceholder?.index === 0 && (
              <KartDropPlaceholder yukseklik={kartPlaceholder.yukseklik} />
            )}
            {liste.kartlar.map((k, index) => (
              <React.Fragment key={k.id}>
                <KartMini
                  kart={k}
                  listeId={liste.id}
                  yetkili={yetkiler.kartTasi}
                  onAc={() => onKartAc(k.id)}
                />
                {kartPlaceholder?.index === index + 1 && (
                  <KartDropPlaceholder yukseklik={kartPlaceholder.yukseklik} />
                )}
              </React.Fragment>
            ))}
          </SortableContext>

        </div>

        {/* FOOTER — yeni kart ekle (içeriğin hemen altında, drop alanı içinde) */}
        {yetkiler.kartOlustur && !taslak && (
          <div className="p-2">
            {yeniKartAcik ? (
              <div className="bg-card flex flex-col gap-1 rounded-md p-2 shadow-sm">
                <Input
                  value={yeniKartBaslik}
                  onChange={(e) => setYeniKartBaslik(e.target.value)}
                  placeholder="Kart başlığı..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") yeniKartGonder();
                    if (e.key === "Escape") {
                      setYeniKartAcik(false);
                      setYeniKartBaslik("");
                    }
                  }}
                  autoFocus
                  className="h-8"
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={yeniKartGonder}>
                    Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setYeniKartAcik(false);
                      setYeniKartBaslik("");
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setYeniKartAcik(true)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-full justify-start"
              >
                <Plus className="size-4" /> Kart ekle
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
