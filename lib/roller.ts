export const ROL_KODLARI = {
  SUPER_ADMIN: "SUPER_ADMIN",
  KAYMAKAM: "KAYMAKAM",
  BIRIM_AMIRI: "BIRIM_AMIRI",
  PERSONEL: "PERSONEL",
} as const;

export const SISTEM_ROL_KODLARI = [
  ROL_KODLARI.SUPER_ADMIN,
  ROL_KODLARI.KAYMAKAM,
  ROL_KODLARI.BIRIM_AMIRI,
  ROL_KODLARI.PERSONEL,
] as const;

export const MAKAM_ROL_KODLARI = [
  ROL_KODLARI.SUPER_ADMIN,
  ROL_KODLARI.KAYMAKAM,
];

export function makamRoluMu(kod: string): boolean {
  return kod === ROL_KODLARI.SUPER_ADMIN || kod === ROL_KODLARI.KAYMAKAM;
}

export function kaymakamRoluMu(kod: string): boolean {
  return kod === ROL_KODLARI.KAYMAKAM;
}
