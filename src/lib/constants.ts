export interface LaserLine {
  name: string;
  key: string;
  color: string;
}

export const LASER_LINES: LaserLine[] = [
  { name: "Diode 405", key: "405", color: "#7c3aed" },
  { name: "Argon 458", key: "458", color: "#2563eb" },
  { name: "Argon 488", key: "488", color: "#06b6d4" },
  { name: "Argon 514", key: "514", color: "#22c55e" },
  { name: "DPSS 561", key: "561", color: "#eab308" },
  { name: "HeNe 633", key: "633", color: "#ef4444" },
  { name: "Argon 458 max", key: "458_max", color: "#1e40af" },
  { name: "Argon 488 max", key: "488_max", color: "#0891b2" },
  { name: "Argon 514 max", key: "514_max", color: "#15803d" },
];

export const MICROSCOPE_SYSTEMS = [
  "Elyra7-A2",
  "Lightsheet7-A2",
  "LSM780_Airy-A26",
  "LSM800-A2",
  "LSM880_Airy-A2",
  "Falcon-A2",
  "YokogawaSORA-E26",
  "LSM910-E26",
] as const;

export const OBJECTIVES = [
  "10x/0.3 Dry",
  "Plan-Apochromat 63x/1.4 Oil",
  "Plan-Apochromat 40x/1.3 Oil",
  "Plan-Apochromat 20x/0.8",
  "Plan-Apochromat 10x/0.45",
  "C-Apochromat 40x/1.2 W",
] as const;

export const VISIBLE_POINTS = 40;
