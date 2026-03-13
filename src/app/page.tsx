"use client";

import { useState, useEffect } from "react";
import { Measurement } from "@/lib/types";
import { LASER_LINES, MICROSCOPE_SYSTEMS, OBJECTIVES, VISIBLE_POINTS } from "@/lib/constants";

export default function Home() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [system, setSystem] = useState<string>(MICROSCOPE_SYSTEMS[0]);
  const [operator, setOperator] = useState("");
  const [objective, setObjective] = useState<string>("10x/0.3 Dry");
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [selectedLaser, setSelectedLaser] = useState<string | null>(null);
  const [chartOffset, setChartOffset] = useState(-1);
  const [filterSystem, setFilterSystem] = useState<string>("all");
  const [filterObjective, setFilterObjective] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeasurements() {
      try {
        const res = await fetch("/api/measurements");
        if (!res.ok) throw new Error("Failed to fetch measurements");
        const data = await res.json();
        setMeasurements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchMeasurements();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedValues: Record<string, number | null> = {};
    for (const laser of LASER_LINES) {
      const v = values[laser.key];
      parsedValues[laser.key] = v ? parseFloat(v) : null;
    }

    const hasAnyValue = Object.values(parsedValues).some((v) => v !== null);
    if (!hasAnyValue) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          operator,
          objective,
          values: parsedValues,
          note,
        }),
      });
      if (!res.ok) throw new Error("Failed to save measurement");
      const newMeasurement = await res.json();
      setMeasurements((prev) => [newMeasurement, ...prev]);
      setValues({});
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMeasurement(id: string) {
    try {
      const res = await fetch(`/api/measurements/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  // Filtered measurements based on system, objective & date range
  const filteredMeasurements = measurements.filter((m) => {
    if (filterSystem !== "all" && m.system !== filterSystem) return false;
    if (filterObjective !== "all" && m.objective !== filterObjective) return false;
    if (filterDateFrom) {
      const mDate = new Date(m.date).toISOString().slice(0, 10);
      if (mDate < filterDateFrom) return false;
    }
    if (filterDateTo) {
      const mDate = new Date(m.date).toISOString().slice(0, 10);
      if (mDate > filterDateTo) return false;
    }
    return true;
  });

  // Unique values for filter dropdowns
  const uniqueSystems = [...new Set(measurements.map((m) => m.system).filter(Boolean))];
  const uniqueObjectives = [...new Set(measurements.map((m) => m.objective).filter(Boolean))];

  function getChartData(laserKey: string) {
    return filteredMeasurements
      .filter((m) => m.values[laserKey] !== null && m.values[laserKey] !== undefined)
      .map((m) => ({
        date: new Date(m.date).toLocaleDateString("cs-CZ"),
        value: m.values[laserKey] as number,
      }))
      .reverse();
  }

  const chartDataAll = selectedLaser ? getChartData(selectedLaser) : [];
  const maxSliderOffset = Math.max(0, chartDataAll.length - VISIBLE_POINTS);
  // Default to latest data (end of timeline) when chartOffset is -1 (initial)
  const safeOffset = chartOffset === -1 ? maxSliderOffset : Math.min(chartOffset, maxSliderOffset);
  const chartData = chartDataAll.slice(safeOffset, safeOffset + VISIBLE_POINTS);
  // Y-axis zooms to the visible window
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  const minValue = chartData.length > 0 ? Math.min(...chartData.map((d) => d.value)) : 0;
  const selectedLaserInfo = LASER_LINES.find((l) => l.key === selectedLaser);

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-sans)]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
              LSM
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Laser Power Log</h1>
              <p className="text-sm text-slate-500">Microscopy Facility Power Tracking</p>
            </div>
          </div>
          <a href="/viewer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Open Viewer &rarr;
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-8">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

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
                  {OBJECTIVES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
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
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-9 gap-3 mb-4">
              {LASER_LINES.map((laser) => (
                <div key={laser.key} className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                      style={{ backgroundColor: laser.color }}
                    />
                    {laser.name}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={values[laser.key] || ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [laser.key]: e.target.value,
                      }))
                    }
                    placeholder="mW"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Measurement"}
            </button>
          </form>
        </section>

        {/* Chart – full width */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm -mx-6 px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Power Trend</h2>
            <div className="flex flex-wrap gap-1.5">
              {LASER_LINES.map((laser) => (
                <button
                  key={laser.key}
                  onClick={() => {
                    setSelectedLaser(
                      selectedLaser === laser.key ? null : laser.key
                    );
                    setChartOffset(-1);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer"
                  style={{
                    backgroundColor:
                      selectedLaser === laser.key ? laser.color : "transparent",
                    color:
                      selectedLaser === laser.key ? "white" : laser.color,
                    borderColor: laser.color,
                  }}
                >
                  {laser.key}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Filter:</span>
            <select
              value={filterSystem}
              onChange={(e) => { setFilterSystem(e.target.value); setChartOffset(-1); }}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Systems</option>
              {uniqueSystems.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterObjective}
              onChange={(e) => { setFilterObjective(e.target.value); setChartOffset(-1); }}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Objectives</option>
              {uniqueObjectives.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400 mx-1">|</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              From:
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setChartOffset(-1); }}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              To:
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setChartOffset(-1); }}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </label>
            {(filterSystem !== "all" || filterObjective !== "all" || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => { setFilterSystem("all"); setFilterObjective("all"); setFilterDateFrom(""); setFilterDateTo(""); setChartOffset(-1); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                Clear filters
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400">
              {filteredMeasurements.length} / {measurements.length} records
            </span>
          </div>

          {selectedLaser && chartData.length > 0 ? (
            <>
              {(() => {
                const W = 1200;
                const H = 300;
                const padTop = 25;
                const padBottom = 55;
                const padLeft = 50;
                const padRight = 20;
                const plotW = W - padLeft - padRight;
                const plotH = H - padTop - padBottom;
                const yRange = maxValue - minValue;
                const yPad = yRange * 0.1 || 0.5;
                const yMin = minValue - yPad;
                const yMax = maxValue + yPad;

                const points = chartData.map((d, i) => {
                  const x = padLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * plotW : plotW / 2);
                  const y = padTop + plotH - ((d.value - yMin) / (yMax - yMin)) * plotH;
                  return { x, y, ...d };
                });

                const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                const color = selectedLaserInfo?.color || "#6366f1";

                // Y-axis ticks
                const yTicks = 5;
                const yTickValues = Array.from({ length: yTicks }, (_, i) => yMin + ((yMax - yMin) * i) / (yTicks - 1));

                // X-axis labels - show every Nth label
                const labelEvery = Math.max(1, Math.ceil(chartData.length / 8));

                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-80">
                    {/* Grid lines */}
                    {yTickValues.map((v, i) => {
                      const y = padTop + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
                      return (
                        <g key={i}>
                          <line x1={padLeft} x2={W - padRight} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                          <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#94a3b8" fontFamily="monospace">
                            {v.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area fill */}
                    <path
                      d={`${linePath} L${points[points.length - 1].x},${padTop + plotH} L${points[0].x},${padTop + plotH} Z`}
                      fill={color}
                      opacity={0.08}
                    />

                    {/* Line */}
                    <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

                    {/* Data points */}
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={3} fill="white" stroke={color} strokeWidth={1.5} />
                        {/* Value label on hover area */}
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={8} fill="#475569" fontFamily="monospace">
                          {p.value}
                        </text>
                      </g>
                    ))}

                    {/* X-axis labels */}
                    {points.map((p, i) =>
                      i % labelEvery === 0 ? (
                        <text
                          key={i}
                          x={p.x}
                          y={H - padBottom + 14}
                          textAnchor="middle"
                          fontSize={8}
                          fill="#94a3b8"
                          transform={`rotate(-35, ${p.x}, ${H - padBottom + 14})`}
                        >
                          {p.date}
                        </text>
                      ) : null
                    )}

                    {/* Y-axis label */}
                    <text x={12} y={padTop + plotH / 2} textAnchor="middle" fontSize={9} fill="#94a3b8" transform={`rotate(-90, 12, ${padTop + plotH / 2})`}>
                      mW
                    </text>
                  </svg>
                );
              })()}

              {/* Range slider */}
              {chartDataAll.length > VISIBLE_POINTS && (
                <div className="mt-2 px-2">
                  <input
                    type="range"
                    min={0}
                    max={maxSliderOffset}
                    value={safeOffset}
                    onChange={(e) => setChartOffset(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{chartDataAll[0]?.date}</span>
                    <span className="text-slate-500 font-medium">
                      {chartData[0]?.date} — {chartData[chartData.length - 1]?.date}
                    </span>
                    <span>{chartDataAll[chartDataAll.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
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
                {filterSystem !== "all" || filterObjective !== "all" || filterDateFrom || filterDateTo
                  ? `(${filteredMeasurements.length} of ${measurements.length} records)`
                  : `(${measurements.length} records)`}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              Loading measurements...
            </div>
          ) : filteredMeasurements.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              {measurements.length === 0
                ? "No measurements yet. Add your first one above."
                : "No measurements match the current filters."}
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
                        key={laser.key}
                        className="px-3 py-3 text-right font-medium whitespace-nowrap"
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: laser.color }}
                        />
                        {laser.key}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium">Note</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeasurements.map((m) => (
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
                          key={laser.key}
                          className="px-3 py-3 text-right font-mono text-xs"
                        >
                          {m.values[laser.key] !== null && m.values[laser.key] !== undefined ? (
                            <span className="text-slate-800">
                              {m.values[laser.key]}
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
