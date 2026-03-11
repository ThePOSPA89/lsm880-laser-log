"use client";

import { useState, useEffect } from "react";

const MICROSCOPE_SYSTEMS = [
  "Elyra7-A2",
  "Lightsheet7-A2",
  "LSM780_Airy-A26",
  "LSM800-A2",
  "LSM880_Airy-A2",
  "Falcon-A2",
  "YokogawaSORA-E26",
  "LSM910-E26",
];

const LASER_LINES = [
  { name: "Diode 405", wavelength: 405, color: "#7c3aed" },
  { name: "Argon 458", wavelength: 458, color: "#2563eb" },
  { name: "Argon 488", wavelength: 488, color: "#06b6d4" },
  { name: "Argon 514", wavelength: 514, color: "#22c55e" },
  { name: "DPSS 561", wavelength: 561, color: "#eab308" },
  { name: "HeNe 633", wavelength: 633, color: "#ef4444" },
];

interface Measurement {
  id: string;
  date: string;
  system: string;
  operator: string;
  objective: string;
  values: Record<number, number | null>;
  note: string;
}

export default function Home() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [system, setSystem] = useState(MICROSCOPE_SYSTEMS[0]);
  const [operator, setOperator] = useState("");
  const [objective, setObjective] = useState("Plan-Apochromat 63x/1.4 Oil");
  const [values, setValues] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");
  const [selectedLaser, setSelectedLaser] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lsm880-measurements");
    if (saved) {
      setMeasurements(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (measurements.length > 0) {
      localStorage.setItem("lsm880-measurements", JSON.stringify(measurements));
    }
  }, [measurements]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedValues: Record<number, number | null> = {};
    for (const laser of LASER_LINES) {
      const v = values[laser.wavelength];
      parsedValues[laser.wavelength] = v ? parseFloat(v) : null;
    }

    const hasAnyValue = Object.values(parsedValues).some((v) => v !== null);
    if (!hasAnyValue) return;

    const measurement: Measurement = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      system,
      operator,
      objective,
      values: parsedValues,
      note,
    };

    setMeasurements((prev) => [measurement, ...prev]);
    setValues({});
    setNote("");
  }

  function deleteMeasurement(id: string) {
    setMeasurements((prev) => {
      const next = prev.filter((m) => m.id !== id);
      localStorage.setItem("lsm880-measurements", JSON.stringify(next));
      return next;
    });
  }

  function getChartData(wavelength: number) {
    return measurements
      .filter((m) => m.values[wavelength] !== null)
      .map((m) => ({
        date: new Date(m.date).toLocaleDateString("cs-CZ"),
        value: m.values[wavelength] as number,
      }))
      .reverse();
  }

  const chartData = selectedLaser ? getChartData(selectedLaser) : [];
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  const selectedLaserInfo = LASER_LINES.find((l) => l.wavelength === selectedLaser);

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-sans)]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
              LSM
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Laser Power Log</h1>
              <p className="text-sm text-slate-500">Microscopy Facility Power Tracking</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-8">
        {/* Input Form */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">New Measurement</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Microscope System
                </label>
                <select
                  value={system}
                  onChange={(e) => setSystem(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                >
                  {MICROSCOPE_SYSTEMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Operator
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Objective
                </label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option>Plan-Apochromat 63x/1.4 Oil</option>
                  <option>Plan-Apochromat 40x/1.3 Oil</option>
                  <option>Plan-Apochromat 20x/0.8</option>
                  <option>Plan-Apochromat 10x/0.45</option>
                  <option>C-Apochromat 40x/1.2 W</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Laser power inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
              {LASER_LINES.map((laser) => (
                <div key={laser.wavelength} className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                      style={{ backgroundColor: laser.color }}
                    />
                    {laser.name} nm
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={values[laser.wavelength] || ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [laser.wavelength]: e.target.value,
                      }))
                    }
                    placeholder="µW"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Save Measurement
            </button>
          </form>
        </section>

        {/* Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Power Trend</h2>
            <div className="flex gap-1.5">
              {LASER_LINES.map((laser) => (
                <button
                  key={laser.wavelength}
                  onClick={() =>
                    setSelectedLaser(
                      selectedLaser === laser.wavelength ? null : laser.wavelength
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer"
                  style={{
                    backgroundColor:
                      selectedLaser === laser.wavelength ? laser.color : "transparent",
                    color:
                      selectedLaser === laser.wavelength ? "white" : laser.color,
                    borderColor: laser.color,
                  }}
                >
                  {laser.wavelength}
                </button>
              ))}
            </div>
          </div>

          {selectedLaser && chartData.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {chartData.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                >
                  <span className="text-[10px] font-mono text-slate-600">
                    {d.value}
                  </span>
                  <div
                    className="w-full rounded-t-sm transition-all min-h-[4px]"
                    style={{
                      height: `${maxValue > 0 ? (d.value / maxValue) * 140 : 4}px`,
                      backgroundColor: selectedLaserInfo?.color || "#6366f1",
                    }}
                  />
                  <span className="text-[9px] text-slate-400 -rotate-45 origin-top-left whitespace-nowrap">
                    {d.date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              {selectedLaser
                ? "No data for this laser line"
                : "Select a laser line to see the trend"}
            </div>
          )}
        </section>

        {/* Measurement History */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              History
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({measurements.length} records)
              </span>
            </h2>
          </div>

          {measurements.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No measurements yet. Add your first one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">System</th>
                    <th className="px-4 py-3 text-left font-medium">Operator</th>
                    <th className="px-4 py-3 text-left font-medium">Objective</th>
                    {LASER_LINES.map((laser) => (
                      <th
                        key={laser.wavelength}
                        className="px-3 py-3 text-right font-medium whitespace-nowrap"
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: laser.color }}
                        />
                        {laser.wavelength}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium">Note</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {measurements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-600">
                        {new Date(m.date).toLocaleString("cs-CZ")}
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs font-medium">
                        {m.system || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{m.operator || "—"}</td>
                      <td className="px-4 py-3 text-slate-700 text-xs">
                        {m.objective}
                      </td>
                      {LASER_LINES.map((laser) => (
                        <td
                          key={laser.wavelength}
                          className="px-3 py-3 text-right font-mono text-xs"
                        >
                          {m.values[laser.wavelength] !== null ? (
                            <span className="text-slate-800">
                              {m.values[laser.wavelength]}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-xs text-slate-500">{m.note || "—"}</td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => deleteMeasurement(m.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
