export type {
  AktiviteOzeti,
  AlanDegisikligi,
  HamAktivite,
} from "@/app/(panel)/projeler/[projeId]/aktivite/services";

export type AnlatiCumlesi = {
  metin: string;
  kim: string;
  baglam: string | null;
};

export type AktiviteKapsamFiltresi = {
  kullaniciId: string;
  makam: boolean;
  projeIdleri: string[] | null;
  listeIdleri: string[] | null;
  kartIdleri: string[] | null;
  kontrolListesiIdleri: string[] | null;
};
