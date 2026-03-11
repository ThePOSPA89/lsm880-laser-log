export const WAVELENGTHS = [405, 458, 488, 514, 561, 633] as const;
export type Wavelength = (typeof WAVELENGTHS)[number];

export interface Measurement {
  id: string;
  date: string;
  system: string;
  operator: string;
  objective: string;
  values: Record<number, number | null>;
  note: string;
}
