"use client";

import * as React from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronsLeftRightEllipsisIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { tempId } from "@/lib/temp-id";
import type { ProjeDetayOzeti } from "../services";
import { KanbanListe } from "./kanban-liste";
import { KartMini } from "./kart-mini";
import {
  projeDetayKey,
  useListeOlustur,
  useProjeDetay,
} from "../hooks/detay-sorgulari";
import { useProjeDetayRealtime } from "../hooks/use-detay-realtime";
import { useDaraltilmisListeler } from "../hooks/use-daraltilmis-listeler";
import { gecerliListelereKirp } from "./kanban-daralt";
import { KartModal } from "./kart-modal";
import { ListeTipi } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useKanbanDnd } from "./use-kanban-dnd";

export type KanbanYetkileri = {
  listeOlustur: boolean;
  listeDuzenle: boolean;
  listeSil: boolean;
  kartOlustur: boolean;
  kartTasi: boolean;
  // Kart bağlam menüsünde meta düzenleme (kapak/tarih/açıklama vb).
  kartDuzenle: boolean;
  // Kart silme — destructive aksiyon ayrı kontrol (Kural 138).
  kartSil: boolean;
  // ADR-0018 — kart bütünü tamamlama. Düzenleyebilen herkes kapatamaz; ayrı
  // KART_TAMAMLA izni gerektirir.
  kartTamamla: boolean;
  yetkiliYonet: boolean;
};

// Drag overlay'de KartMini'ye verilir — sürüklenen "hayalet" kartta sağ tık
// menüsü açılmaz; granüler yetkilerin hepsi false. Modül seviyesi sabit
// (Kural 134).
const DEVRE_DISI_BAGLAM = {
  duzenle: false,
  yetkiliYonet: false,
  arsivle: false,
  sil: false,
  tamamla: false,
} as const;

type Props = {
  projeId: string;
  ilkVeri: ProjeDetayOzeti;
  yetkiler: KanbanYetkileri;
};

// SSR/CSR mount sentinel — useSyncExternalStore ile setState-in-effect
// patternine düşmeden client/server farkı verir. Server snapshot=false,
// client snapshot=true. Subscribe noop (mount değişmez).
const NOOP_SUBSCRIBE = () => () => {};
const MOUNT_CLIENT = () => true;
const MOUNT_SERVER = () => false;
function useMounted(): boolean {
  return React.useSyncExternalStore(
    NOOP_SUBSCRIBE,
    MOUNT_CLIENT,
    MOUNT_SERVER,
  );
}

export function KanbanPano({ projeId, ilkVeri, yetkiler }: Props) {
  // KRİTİK: anahtar her render'da yeni array referansı oluyordu (projeDetayKey
  // her çağrıda yeni `[PROJE_DETAY_KEY, projeId]` döndürür) → useCallback deps
  // değişiyor → handler'lar yeni referans → DndContext re-init zinciri.
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const sorgu = useProjeDetay(projeId, ilkVeri);

  // Faz 1.1: Pano canlı senkron — proje room'una katıl + diğer kullanıcıların
  // liste/kart değişikliklerini dinle, kendi mutation echo'su request_id ile
  // filtrelendiği için optimistic update bozulmaz (Kural 114).
  useProjeDetayRealtime(projeId);

  // Sunucudan henüz veri gelmediyse server-side initial veriyi kullan.
  const detay: ProjeDetayOzeti = sorgu.data ?? ilkVeri;

  const listeOlustur = useListeOlustur(anahtar);

  const [yeniListeAcik, setYeniListeAcik] = React.useState(false);
  const [yeniListeAd, setYeniListeAd] = React.useState("");

  // SSR + client farkı — dnd-kit hydration sonrası mount olur. useState +
  // useEffect yerine useSyncExternalStore: server snapshot=false, client
  // snapshot=true → setState-in-effect yok.
  const mounted = useMounted();

  // Faz 5.2 — Deep link: bildirim → /projeler/{id}?kart={kart_id} formatında
  // gelir. acikKartId tamamen URL'den DERIVE edilir; modal kapatma URL'yi
  // güncellediğinde otomatik null olur. router.replace history'ye yeni kayıt
  // yazmaz.
  const aramaParametreleri = useSearchParams();
  const router = useRouter();
  const yolu = usePathname();
  const acikKartId = aramaParametreleri.get("kart");
  const kartModalKapat = React.useCallback(() => {
    if (aramaParametreleri.has("kart")) {
      const yeni = new URLSearchParams(aramaParametreleri);
      yeni.delete("kart");
      const qs = yeni.toString();
      router.replace(qs ? `${yolu}?${qs}` : yolu);
    }
  }, [aramaParametreleri, router, yolu]);
  const kartModalAc = React.useCallback(
    (id: string) => {
      const yeni = new URLSearchParams(aramaParametreleri);
      yeni.set("kart", id);
      router.replace(`${yolu}?${yeni.toString()}`);
    },
    [aramaParametreleri, router, yolu],
  );

  // ADR-0009 — Arşiv sistem listesi boşken kanban'da gizlenir; ilk kart
  // arşivlenince görünür hale gelir. Drag-drop ile arşivleme sadece liste
  // görünürken (1+ kart) mümkün; sağ tık menüsünden her zaman çalışır.
  // detay.listeler canonical kalır (drag-drop sırası ve cache mutation için);
  // sadece render edilen liste kümesi filtrelenir.
  const gorunurListeler = React.useMemo(
    () =>
      detay.listeler.filter(
        (l) => l.tip !== ListeTipi.ARSIV || l.kartlar.length > 0,
      ),
    [detay.listeler],
  );

  const listeIdleri = React.useMemo(
    () => gorunurListeler.map((l) => l.id),
    [gorunurListeler],
  );

  // Daralt durumu (localStorage, cross-tab sync). Set referansı
  // useSyncExternalStore snapshot cache'i sayesinde içerik değişmediği sürece
  // stable → callback dep'leri ve dnd-kit context gereksiz invalide olmaz.
  const {
    daraltilmisListeler,
    daralt,
    genislet,
    tumunuDaralt,
    tumunuGenislet,
    yaz: yazDaralt,
  } = useDaraltilmisListeler(projeId);

  // Toplu daralt/genişlet — sistem ARŞİV hariç (drop hedefi olarak görünür
  // kalmalı). gorunurListeler zaten ARŞİV'i boşken filtreler; biz burada
  // ek olarak ARŞİV'i hiçbir zaman daraltmıyoruz.
  const daraltilabilirIdler = React.useMemo(
    () =>
      detay.listeler
        .filter((l) => l.tip !== ListeTipi.ARSIV)
        .map((l) => l.id),
    [detay.listeler],
  );
  const tumuDaraltilmisMi =
    daraltilabilirIdler.length > 0 &&
    daraltilabilirIdler.every((id) => daraltilmisListeler.has(id));
  const hicDaraltilmamis = daraltilmisListeler.size === 0;

  // Silinen liste id'si Set'te kalmasın — aynı id'li yeni liste için
  // "geçmiş ruh" daraltılmış görünmesin. yazDaralt hook'un kendi dispatch'i
  // (snapshot cache + dinleyici notify) ile çağrıldığı için sonraki render
  // doğru Set'i alır.
  React.useEffect(() => {
    const gecerliIdler = new Set(detay.listeler.map((l) => l.id));
    let kirliVar = false;
    for (const id of daraltilmisListeler) {
      if (!gecerliIdler.has(id)) {
        kirliVar = true;
        break;
      }
    }
    if (!kirliVar) return;
    yazDaralt(gecerliListelereKirp(daraltilmisListeler, gecerliIdler));
  }, [detay.listeler, daraltilmisListeler, yazDaralt]);

  // DnD orkestrasyonu — sensor + collision + state + handler + mutation'lar
  // ayrı hook'a çıkarıldı (S3-6 / ADR-0032). UI burada kalır; pure logic
  // kanban-dnd.ts'te (test edilebilir saf fonksiyonlar).
  const {
    sensorlar,
    collisionDetection,
    aktifDrag,
    kartPlaceholder,
    dragBaslat,
    dragUzerinde,
    dragBitti,
    dragIptal,
    modifiers,
  } = useKanbanDnd({ projeId, anahtar, detay, daraltilmisListeler });

  const yeniListeGonder = () => {
    const ad = yeniListeAd.trim();
    if (!ad) return;
    listeOlustur.mutate({
      id_taslak: tempId(),
      proje_id: projeId,
      ad,
    });
    setYeniListeAd("");
  };

  // SSR + client farkı — dnd-kit hydration sonrası mount olur.
  if (!mounted) {
    return <div className="flex h-full gap-3 overflow-x-auto pb-4" aria-hidden />;
  }

  // Toolbar görünür mü? En az bir daraltılabilir liste varsa anlamlı.
  const toolbarGorunur = daraltilabilirIdler.length > 0;
  const kartSurukleniyor = aktifDrag?.tip === "kart";

  return (
    <>
      {/* Pano toolbar — sağ üst, "Tümünü daralt / genişlet" tek dropdown.
          Solo aksiyon olduğu için DropdownMenu yerine iki ayrı buton da
          olabilir; tek menü ekran alanı tasarrufu sağlar. */}
      {toolbarGorunur && (
        <div className="mb-2 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Liste görünüm seçenekleri"
                />
              }
            >
              <ChevronsLeftRightEllipsisIcon className="size-4" />
              <span className="ml-1 text-xs">Görünüm</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={tumuDaraltilmisMi}
                onClick={() => tumunuDaralt(daraltilabilirIdler)}
              >
                <PanelLeftCloseIcon className="size-4" />
                Tümünü daralt
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={hicDaraltilmamis}
                onClick={() => tumunuGenislet(daraltilabilirIdler)}
              >
                <PanelLeftOpenIcon className="size-4" />
                Tümünü genişlet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <DndContext
        sensors={sensorlar}
        collisionDetection={collisionDetection}
        onDragStart={dragBaslat}
        onDragOver={dragUzerinde}
        onDragEnd={dragBitti}
        onDragCancel={dragIptal}
        modifiers={modifiers}
      >
        <div className="flex h-full items-start gap-3 overflow-x-auto pb-4">
          <SortableContext
            items={listeIdleri}
            strategy={horizontalListSortingStrategy}
          >
            {gorunurListeler.map((l) => (
              <KanbanListe
                key={l.id}
                liste={l}
                projeId={projeId}
                yetkiler={yetkiler}
                kartPlaceholder={
                  kartPlaceholder?.liste_id === l.id ? kartPlaceholder : null
                }
                onKartAc={kartModalAc}
                daraltilmisMi={daraltilmisListeler.has(l.id)}
                daralt={() => daralt(l.id)}
                genislet={() => genislet(l.id)}
                kartSurukleniyor={kartSurukleniyor}
              />
            ))}
          </SortableContext>

          {yetkiler.listeOlustur && (
            <div className="bg-muted/30 flex w-72 shrink-0 flex-col gap-2 self-start rounded-lg border border-dashed p-2">
              {yeniListeAcik ? (
                <>
                  <Input
                    value={yeniListeAd}
                    onChange={(e) => setYeniListeAd(e.target.value)}
                    placeholder="Liste adı..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") yeniListeGonder();
                      if (e.key === "Escape") {
                        setYeniListeAcik(false);
                        setYeniListeAd("");
                      }
                    }}
                    className="h-8"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={yeniListeGonder}>
                      Ekle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setYeniListeAcik(false);
                        setYeniListeAd("");
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setYeniListeAcik(true)}
                  className="text-muted-foreground hover:text-foreground h-9 w-full justify-start"
                >
                  <Plus className="size-4" /> Liste ekle
                </Button>
              )}
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {aktifDrag?.tip === "kart" && (
            <div className="rotate-2 cursor-grabbing">
              <KartMini
                kart={aktifDrag.kart}
                listeId={aktifDrag.liste_id}
                surukleyebilir={false}
                baglamYetkileri={DEVRE_DISI_BAGLAM}
                projeId={projeId}
                onAc={() => undefined}
              />
            </div>
          )}
          {aktifDrag?.tip === "liste" && (
            <div className="bg-muted w-72 rotate-2 rounded-lg border p-2 opacity-90 shadow-2xl">
              <div className="border-b pb-2 font-medium">
                {aktifDrag.liste.ad}
                <span className="text-muted-foreground ml-2 text-xs">
                  {aktifDrag.liste.kartlar.length}
                </span>
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                {aktifDrag.liste.kartlar.length} kart
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <KartModal
        kartId={acikKartId}
        kapat={kartModalKapat}
        projeId={projeId}
        yetkiliYonet={yetkiler.yetkiliYonet}
        kartTamamla={yetkiler.kartTamamla}
      />
    </>
  );
}
