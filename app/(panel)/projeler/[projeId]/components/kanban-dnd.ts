import type { ClientRect, UniqueIdentifier } from "@dnd-kit/core";
import type { ListeKartOzeti, ListeOzeti, ProjeDetayOzeti } from "../services";

export type HedefTipi = "kart" | "liste" | "liste-body" | null;

export type KartDropKonumu = {
  liste_id: string;
  index: number;
  over_id: string;
  over_tip: "kart" | "liste-body";
};

export function listeBodyDroppableId(listeId: string): string {
  return `liste-body-${listeId}`;
}

export function listeBodyId(idText: string): string {
  return idText.startsWith("liste-body-")
    ? idText.slice("liste-body-".length)
    : idText;
}

export function listedeKartBul(
  listeler: ListeOzeti[],
  kartId: string,
): { liste: ListeOzeti; kart: ListeKartOzeti } | null {
  for (const l of listeler) {
    const k = l.kartlar.find((x) => x.id === kartId);
    if (k) return { liste: l, kart: k };
  }
  return null;
}

export function hedefTipi(
  detay: ProjeDetayOzeti,
  id: UniqueIdentifier | undefined,
): HedefTipi {
  if (id == null) return null;
  const sid = String(id);
  if (sid.startsWith("liste-body-")) return "liste-body";
  if (detay.listeler.some((l) => l.id === sid)) return "liste";
  if (detay.listeler.some((l) => l.kartlar.some((k) => k.id === sid))) {
    return "kart";
  }
  return null;
}

function pointerKartinAltYarisindaMi(
  pointerY: number | null | undefined,
  overRect: Pick<ClientRect, "top" | "height"> | null | undefined,
): boolean {
  if (typeof pointerY !== "number" || !overRect) return false;
  return pointerY > overRect.top + overRect.height / 2;
}

export function kartDropKonumuHesapla({
  detay,
  aktifKartId,
  overId,
  overRect,
  pointerY,
}: {
  detay: ProjeDetayOzeti;
  aktifKartId: string;
  overId: UniqueIdentifier | undefined;
  overRect?: Pick<ClientRect, "top" | "height"> | null;
  pointerY?: number | null;
}): KartDropKonumu | null {
  const tip = hedefTipi(detay, overId);
  if (!tip || tip === "liste") return null;

  const overText = String(overId);

  if (tip === "liste-body") {
    const listeId = listeBodyId(overText);
    const liste = detay.listeler.find((l) => l.id === listeId);
    if (!liste) return null;
    return {
      liste_id: liste.id,
      index: liste.kartlar.filter((k) => k.id !== aktifKartId).length,
      over_id: overText,
      over_tip: "liste-body",
    };
  }

  const bulunan = listedeKartBul(detay.listeler, overText);
  if (!bulunan) return null;

  if (overText === aktifKartId) {
    return {
      liste_id: bulunan.liste.id,
      index: bulunan.liste.kartlar.findIndex((k) => k.id === aktifKartId),
      over_id: overText,
      over_tip: "kart",
    };
  }

  const aktifsiz = bulunan.liste.kartlar.filter((k) => k.id !== aktifKartId);
  const overIndex = aktifsiz.findIndex((k) => k.id === overText);
  if (overIndex === -1) {
    return {
      liste_id: bulunan.liste.id,
      index: aktifsiz.length,
      over_id: overText,
      over_tip: "kart",
    };
  }

  const altYari = pointerKartinAltYarisindaMi(pointerY, overRect);
  return {
    liste_id: bulunan.liste.id,
    index: overIndex + (altYari ? 1 : 0),
    over_id: overText,
    over_tip: "kart",
  };
}

export function kartiKonumaTasi(
  listeler: ListeOzeti[],
  kartId: string,
  hedefListeId: string,
  hedefIndex: number,
): ListeOzeti[] | null {
  let kart: ListeKartOzeti | undefined;
  const aktifsiz = listeler.map((l) => {
    const idx = l.kartlar.findIndex((k) => k.id === kartId);
    if (idx >= 0) {
      kart = l.kartlar[idx];
      return { ...l, kartlar: l.kartlar.filter((_, i) => i !== idx) };
    }
    return l;
  });

  if (!kart) return null;

  let hedefBulundu = false;
  const son = aktifsiz.map((l) => {
    if (l.id !== hedefListeId) return l;
    hedefBulundu = true;
    const yeni = [...l.kartlar];
    const guvenliIndex = Math.max(0, Math.min(hedefIndex, yeni.length));
    yeni.splice(guvenliIndex, 0, kart!);
    return { ...l, kartlar: yeni };
  });

  return hedefBulundu ? son : null;
}

export function kartTasimasiDegistirirMi(
  listeler: ListeOzeti[],
  kartId: string,
  kaynakListeId: string,
  hedefListeId: string,
  hedefIndex: number,
): boolean {
  if (kaynakListeId !== hedefListeId) return true;
  const liste = listeler.find((l) => l.id === kaynakListeId);
  if (!liste) return false;
  return liste.kartlar.findIndex((k) => k.id === kartId) !== hedefIndex;
}
