import { Measurement, WAVELENGTHS, WAVELENGTHS_MAX } from "./types";

export interface MeasurementRow {
  id: string;
  date: string;
  system: string;
  operator: string;
  objective: string;
  power_405: number | null;
  power_458: number | null;
  power_488: number | null;
  power_514: number | null;
  power_561: number | null;
  power_633: number | null;
  power_458_max: number | null;
  power_488_max: number | null;
  power_514_max: number | null;
  note: string;
}

export function rowToMeasurement(row: MeasurementRow): Measurement {
  const values: Record<string, number | null> = {};
  for (const wl of WAVELENGTHS) {
    const key = `power_${wl}` as keyof MeasurementRow;
    values[String(wl)] = row[key] as number | null;
  }
  for (const wlMax of WAVELENGTHS_MAX) {
    const key = `power_${wlMax}` as keyof MeasurementRow;
    values[wlMax] = row[key] as number | null;
  }
  return {
    id: row.id,
    date: row.date,
    system: row.system,
    operator: row.operator,
    objective: row.objective,
    values,
    note: row.note,
  };
}
