export const WAVELENGTHS = [405, 440, 445, 458, 488, 514, 561, 633, 640, 790] as const;
export const WAVELENGTHS_MAX = ["458_max", "488_max", "514_max"] as const;
export const ALL_POWER_KEYS = [...WAVELENGTHS.map(String), ...WAVELENGTHS_MAX] as const;
export type Wavelength = (typeof WAVELENGTHS)[number];

export interface Measurement {
  id: string;
  date: string;
  system: string;
  operator: string;
  objective: string;
  values: Record<string, number | null>;
  note: string;
}
