"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { getEventCoordinates, useEvent } from "@dnd-kit/utilities";
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
import type { ListeKartOzeti, ListeOzeti, ProjeDetayOzeti } from "../services";
import { KanbanListe } from "./kanban-liste";
import { KartMini } from "./kart-mini";
import {
  projeDetayKey,
  useKartTasi,
  useListeOlustur,
  useListeSirala,
  useProjeDetay,
} from "../hooks/detay-sorgulari";
import { useProjeDetayRealtime } from "../hooks/use-detay-realtime";
import { useDaraltilmisListeler } from "../hooks/use-daraltilmis-listeler";
import { gecerliListelereKirp } from "./kanban-daralt";
import { KartModal } from "./kart-modal";
import { useQueryClient } from "@tanstack/react-query";
import { ListeTipi } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  arsivGecisiBelirle,
  hedefTipi,
  kartDropKonumuHesapla,
  kartTasimasiDegistirirMi,
  kartiKonumaTasi,
  listeBodyId,
  listedeKartBul,
} from "./kanban-dnd";

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

type DragVeri =
  | { tip: "kart"; kart: ListeKartOzeti; liste_id: string }
  | { tip: "liste"; liste: ListeOzeti }
  | null;

type KartPlaceholder = {
  liste_id: string;
  index: number;
  yukseklik: number | null;
};

// dnd-kit constraint'leri ve modifier listesi — modül seviyesinde sabit referans
// olmazsa her render'da yeni obje üretilip DnD context'i sürekli yeniden init eder.
const POINTER_OPS = { activationConstraint: { distance: 5 } } as const;
const TOUCH_OPS = {
  activationConstraint: { delay: 200, tolerance: 8 },
} as const;
const KEY_OPS = { coordinateGetter: sortableKeyboardCoordinates } as const;
const MODIFIERS = [restrictToWindowEdges];

function aktifPointerY(e: DragOverEvent | DragEndEvent): number | null {
  const baslangic = getEventCoordinates(e.activatorEvent);
  if (!baslangic) return null;
  return baslangic.y + e.delta.y;
}

export function KanbanPano({ projeId, ilkVeri, yetkiler }: Props) {
  // KRİTİK: anahtar her render'da yeni array referansı oluyordu (projeDetayKey
  // her çağrıda yeni `[PROJE_DETAY_KEY, projeId]` döndürür) → useCallback deps
  // değişiyor → handler'lar yeni referans → DndContext re-init zinciri.
  const anahtar = React.useMemo(() => projeDetayKey(projeId), [projeId]);
  const sorgu = useProjeDetay(projeId, ilkVeri);
  const istemci = useQueryClient();

  // Faz 1.1: Pano canlı senkron — proje room'una katıl + diğer kullanıcıların
  // liste/kart değişikliklerini dinle, kendi mutation echo'su request_id ile
  // filtrelendiği için optimistic update bozulmaz (Kural 114).
  useProjeDetayRealtime(projeId);

  // Sunucudan henüz veri gelmediyse server-side initial veriyi kullan.
  const detay: ProjeDetayOzeti = sorgu.data ?? ilkVeri;

  // Trello tarzı: 5px hareket sonrası mouse drag aktive (yanlışlıkla sürüklemeyi engeller).
  // Touch: 200ms basılı tutma + 8px tolerans.
  // NOT: activationConstraint objelerinin her render'da yeni referans olması
  // dnd-kit'i sürekli reinit'e zorluyor → infinite loop. Modül seviyesinde sabit.
  const sensorlar = useSensors(
    useSensor(PointerSensor, POINTER_OPS),
    useSensor(TouchSensor, TOUCH_OPS),
    useSensor(KeyboardSensor, KEY_OPS),
  );

  const listeOlustur = useListeOlustur(anahtar);
  const listeSirala = useListeSirala(anahtar);
  const kartTasi = useKartTasi(anahtar);

  const [aktifDrag, setAktifDrag] = React.useState<DragVeri>(null);
  const [kartPlaceholder, setKartPlaceholder] =
    React.useState<KartPlaceholder | null>(null);
  const [yeniListeAcik, setYeniListeAcik] = React.useState(false);
  const [yeniListeAd, setYeniListeAd] = React.useState("");
  const [acikKartId, setAcikKartId] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Faz 5.2 — Deep link: bildirim → /projeler/{id}?kart={kart_id} formatında
  // gelir. Pano açılırken URL'deki ?kart= parametresini okuyup modal'ı
  // otomatik aç. Modal kapatıldığında URL parametresini temizle ki F5'te
  // tekrar açılmasın. router.replace history'ye yeni kayıt yazmaz.
  const aramaParametreleri = useSearchParams();
  const router = useRouter();
  const yolu = usePathname();
  React.useEffect(() => {
    const kartParam = aramaParametreleri.get("kart");
    if (kartParam && kartParam !== acikKartId) {
      setAcikKartId(kartParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız param değişince
  }, [aramaParametreleri]);
  const kartModalKapat = React.useCallback(() => {
    setAcikKartId(null);
    if (aramaParametreleri.has("kart")) {
      const yeni = new URLSearchParams(aramaParametreleri);
      yeni.delete("kart");
      const qs = yeni.toString();
      router.replace(qs ? `${yolu}?${qs}` : yolu);
    }
  }, [aramaParametreleri, router, yolu]);

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

  // Sürüklenen kartın "şu an" hangi listede / hangi pozisyonda olduğunu izlemek için.
  // onDragOver sırasında bu güncellenir, görsel feedback verir.
  // dragOver idempotency — aynı hedef üstündeyken setQueryData'yı tekrar tekrar
  // çağırmayalım. Pointer iki kart arasında oynadıkça collision detection
  // dönüşümlü hedef döndürebilir → her splice yeniden render'a yol açar →
  // sortable transform'ları yeniden hesaplanır → görsel kıpırdama.
  // KRİTİK — Veri kaybı koruması:
  // dragOver cache'i transient olarak değiştiriyor. Mutation onError'da
  // wrapper'ın snapshot rollback'i bu BOZUK cache'e dönerdi. Bunun yerine
  // dragBaslat'ta orijinal snapshot alıyoruz; hata durumunda manuel restore.
  const baslangicSnapshotRef = React.useRef<ProjeDetayOzeti | null>(null);

  // Render'da değişen değerler için ref. Event handler'lar bunları okur.
  // Stable callback referansları için (DndContext'i sürekli reinit etmemek için).
  // detayRef = ORİJİNAL cache (transient YOK), drop hesabı için.
  const detayRef = React.useRef(detay);
  // eslint-disable-next-line react-hooks/refs -- bilinçli: stable callback için ref senkronu
  detayRef.current = detay;
  const aktifDragRef = React.useRef(aktifDrag);
  // eslint-disable-next-line react-hooks/refs -- bilinçli: stable callback için ref senkronu
  aktifDragRef.current = aktifDrag;

  const kartPlaceholderGuncelle = React.useCallback(
    (sonraki: KartPlaceholder | null) => {
      setKartPlaceholder((onceki) => {
        if (
          onceki?.liste_id === sonraki?.liste_id &&
          onceki?.index === sonraki?.index &&
          onceki?.yukseklik === sonraki?.yukseklik
        ) {
          return onceki;
        }
        return sonraki;
      });
    },
    [],
  );

  // Custom collision detection — Trello/Linear pattern:
  // Kart sürüklemede: önce pointerWithin (hassas, kart üzerinde imleç var mı), sonra rectIntersection.
  // Liste sürüklemede: closestCenter benzeri davranış (yatay).
  const collisionDetection: CollisionDetection = React.useCallback(
    (args) => {
      const aktifTip = args.active.data.current?.tip as
        | "kart"
        | "liste"
        | undefined;

      if (aktifTip === "liste") {
        // Liste sürüklenirken sadece diğer listeleri hedefle (liste body veya kart hedef değil).
        const sadeceListeler = args.droppableContainers.filter(
          (d) => d.data.current?.tip === "liste",
        );
        const ilk = pointerWithin({ ...args, droppableContainers: sadeceListeler });
        if (ilk.length > 0) return ilk;
        return rectIntersection({ ...args, droppableContainers: sadeceListeler });
      }

      if (aktifTip === "kart") {
        // Kart sürüklenirken: önce hangi LİSTE üzerindeyiz onu bul (pointer ile),
        // sonra o liste içindeki kartlardan en yakın merkeze sahip olanı seç.
        // Bu pattern dnd-kit multi-container örneğinin sadeleştirilmiş hali —
        // pointer 1px titremesi `closestCenter` ile absorb edilir.
        // Daraltılmış liste body droppable'ları kart drag hedefinden çıkarılır
        // (kart bırakılamaz — kullanıcı önce genişletmeli). useDroppable
        // disabled flag'i ilk savunma; bu filtre defansif ek katman.
        const sadeceListeBody = args.droppableContainers.filter(
          (d) =>
            d.data.current?.tip === "liste-body" &&
            !daraltilmisListeler.has(
              (d.data.current?.liste_id as string | undefined) ?? "",
            ),
        );

        // Pointer hangi listenin body'sinde?
        const pointerListe =
          pointerWithin({ ...args, droppableContainers: sadeceListeBody })[0] ??
          rectIntersection({
            ...args,
            droppableContainers: sadeceListeBody,
          })[0];

        if (!pointerListe) return [];

        const hedefListeId = listeBodyId(String(pointerListe.id));

        // Bu listenin kartları
        const oListedeIs = args.droppableContainers.filter(
          (d) =>
            d.data.current?.tip === "kart" &&
            d.data.current?.liste_id === hedefListeId,
        );

        if (oListedeIs.length === 0) {
          // Boş liste — body'ye drop
          return [pointerListe];
        }

        // Liste içinde en yakın kart merkezine
        const kartHit = closestCenter({
          ...args,
          droppableContainers: oListedeIs,
        })[0];
        return kartHit ? [kartHit] : [pointerListe];
      }

      return [];
    },
    [daraltilmisListeler],
  );

  const dragBaslat = React.useCallback((e: DragStartEvent) => {
    kartPlaceholderGuncelle(null);
    baslangicSnapshotRef.current =
      istemci.getQueryData<ProjeDetayOzeti>(anahtar) ?? null;

    const detay = detayRef.current;
    const tip = e.active.data.current?.tip as "kart" | "liste" | undefined;
    if (tip === "liste") {
      const liste = detay.listeler.find((l) => l.id === e.active.id);
      if (liste) {
        setAktifDrag({ tip: "liste", liste });
      }
    } else if (tip === "kart") {
      const bulunan = listedeKartBul(detay.listeler, String(e.active.id));
      if (bulunan) {
        setAktifDrag({
          tip: "kart",
          kart: bulunan.kart,
          liste_id: bulunan.liste.id,
        });
      }
    }
  }, [istemci, anahtar, kartPlaceholderGuncelle]);

  // Hata durumunda dragBaslat'ta alınan orijinal cache'e dön.
  const baslangicaDon = React.useCallback(() => {
    const snap = baslangicSnapshotRef.current;
    baslangicSnapshotRef.current = null;
    if (snap) {
      istemci.setQueryData(anahtar, snap);
    }
  }, [istemci, anahtar]);

  const dragUzerinde = React.useCallback((e: DragOverEvent) => {
    const aktif = aktifDragRef.current;
    if (aktif?.tip !== "kart" || !e.over) {
      kartPlaceholderGuncelle(null);
      return;
    }

    const detay = detayRef.current;
    const konum = kartDropKonumuHesapla({
      detay,
      aktifKartId: aktif.kart.id,
      overId: e.over.id,
      overRect: e.over.rect,
      pointerY: aktifPointerY(e),
    });

    if (!konum || konum.liste_id === aktif.liste_id) {
      kartPlaceholderGuncelle(null);
      return;
    }

    kartPlaceholderGuncelle({
      liste_id: konum.liste_id,
      index: konum.index,
      yukseklik:
        Math.round(e.active.rect.current.initial?.height ?? e.over.rect.height) ||
        null,
    });
  }, [kartPlaceholderGuncelle]);

  const dragBitti = React.useCallback((e: DragEndEvent) => {
    const aktif = aktifDragRef.current;
    const detay = detayRef.current;
    setAktifDrag(null);
    kartPlaceholderGuncelle(null);

    if (!aktif || !e.over) {
      baslangicaDon();
      return;
    }

    // dragOver kullanılmıyor — cache hala başlangıç durumunda.
    // Drop pozisyonunu e.over'dan hesapla, cache'i tek seferde reorder, mutate.

    // ============================================================
    // LİSTE DROP
    // ============================================================
    if (aktif.tip === "liste") {
      // ADR-0009 — Sistem ARSIV listesi sürüklenemez (UI'da zaten disabled
      // ama defansif).
      if (aktif.liste.tip === ListeTipi.ARSIV) {
        baslangicaDon();
        return;
      }

      const overTip = hedefTipi(detay, e.over.id);
      let hedefListeId: string;
      if (overTip === "liste") hedefListeId = String(e.over.id);
      else if (overTip === "liste-body")
        hedefListeId = listeBodyId(String(e.over.id));
      else {
        baslangicaDon();
        return;
      }

      const eskiIdx = detay.listeler.findIndex((l) => l.id === aktif.liste.id);
      const yeniIdx = detay.listeler.findIndex((l) => l.id === hedefListeId);
      if (eskiIdx === -1 || yeniIdx === -1 || eskiIdx === yeniIdx) {
        baslangicaDon();
        return;
      }

      const yenidenSiralanmis = arrayMove(detay.listeler, eskiIdx, yeniIdx);

      // ADR-0009 — Arşiv listesi her zaman en sağda kalmalı; reorder sonucu
      // başka liste Arşiv'in sağına düşerse drop reddedilir.
      const arsivIdx = yenidenSiralanmis.findIndex(
        (l) => l.tip === ListeTipi.ARSIV,
      );
      if (
        arsivIdx !== -1 &&
        arsivIdx !== yenidenSiralanmis.length - 1
      ) {
        toast.bilgi("Arşiv listesi her zaman en sağdadır.");
        baslangicaDon();
        return;
      }

      // Cache'i optimistic reorder
      istemci.setQueryData<ProjeDetayOzeti>(anahtar, (eski) => {
        if (!eski) return eski;
        return { ...eski, listeler: yenidenSiralanmis };
      });

      const onceki = yenidenSiralanmis[yeniIdx - 1] ?? null;
      const sonraki = yenidenSiralanmis[yeniIdx + 1] ?? null;

      listeSirala.mutate(
        {
          id: aktif.liste.id,
          proje_id: projeId,
          onceki_id: onceki?.id ?? null,
          sonraki_id: sonraki?.id ?? null,
          onceki_sira: onceki?.sira ?? null,
          sonraki_sira: sonraki?.sira ?? null,
        },
        {
          onError: baslangicaDon,
          onSuccess: () => {
            baslangicSnapshotRef.current = null;
          },
        },
      );
      return;
    }

    // ============================================================
    // KART DROP
    // ============================================================
    if (aktif.tip === "kart") {
      const konum = kartDropKonumuHesapla({
        detay,
        aktifKartId: aktif.kart.id,
        overId: e.over.id,
        overRect: e.over.rect,
        pointerY: aktifPointerY(e),
      });

      if (!konum) {
        baslangicaDon();
        return;
      }

      // Aynı yer? → mutate etme
      if (
        !kartTasimasiDegistirirMi(
          detay.listeler,
          aktif.kart.id,
          aktif.liste_id,
          konum.liste_id,
          konum.index,
        )
      ) {
        baslangicaDon();
        return;
      }

      const yenidenSiralanmis = kartiKonumaTasi(
        detay.listeler,
        aktif.kart.id,
        konum.liste_id,
        konum.index,
      );

      if (!yenidenSiralanmis) {
        baslangicaDon();
        return;
      }

      // Cache'i optimistic reorder
      istemci.setQueryData<ProjeDetayOzeti>(anahtar, (eski) => {
        if (!eski) return eski;
        return { ...eski, listeler: yenidenSiralanmis };
      });

      // Reorder sonrası komşu kartları al
      const guncel =
        istemci.getQueryData<ProjeDetayOzeti>(anahtar) ?? detay;
      const hedefListe = guncel.listeler.find((l) => l.id === konum.liste_id);
      const hedefIndex =
        hedefListe?.kartlar.findIndex((k) => k.id === aktif.kart.id) ?? -1;
      const onceki = hedefListe && hedefIndex > 0
        ? hedefListe.kartlar[hedefIndex - 1]
        : null;
      const sonraki =
        hedefListe && hedefIndex < hedefListe.kartlar.length - 1
          ? hedefListe.kartlar[hedefIndex + 1]
          : null;

      // ADR-0009 — NORMAL ↔ ARSIV drag geçişinde toast bilgi.
      const arsivGecisi = arsivGecisiBelirle(
        detay.listeler,
        aktif.liste_id,
        konum.liste_id,
      );

      kartTasi.mutate(
        {
          id: aktif.kart.id,
          hedef_liste_id: konum.liste_id,
          onceki_id: onceki?.id ?? null,
          sonraki_id: sonraki?.id ?? null,
          kaynak_liste_id: aktif.liste_id,
          onceki_sira: onceki?.sira ?? null,
          sonraki_sira: sonraki?.sira ?? null,
        },
        {
          onError: baslangicaDon,
          onSuccess: () => {
            baslangicSnapshotRef.current = null;
            if (arsivGecisi === "arsivle") {
              toast.bilgi("Kart arşivlendi");
            } else if (arsivGecisi === "arsivden-cikar") {
              toast.bilgi("Kart arşivden çıkarıldı");
            }
          },
        },
      );

    }
  }, [
    istemci,
    anahtar,
    projeId,
    listeSirala,
    kartTasi,
    baslangicaDon,
    kartPlaceholderGuncelle,
  ]);

  const dragIptal = React.useCallback((_e: DragCancelEvent) => {
    setAktifDrag(null);
    kartPlaceholderGuncelle(null);
    baslangicaDon();
  }, [baslangicaDon, kartPlaceholderGuncelle]);

  const dragBaslatStable = useEvent(dragBaslat);
  const dragUzerindeStable = useEvent(dragUzerinde);
  const dragBittiStable = useEvent(dragBitti);
  const dragIptalStable = useEvent(dragIptal);

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
        onDragStart={dragBaslatStable}
        onDragOver={dragUzerindeStable}
        onDragEnd={dragBittiStable}
        onDragCancel={dragIptalStable}
        modifiers={MODIFIERS}
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
                onKartAc={(id) => setAcikKartId(id)}
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
