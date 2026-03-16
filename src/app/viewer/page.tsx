"use client";

import { useState, useEffect } from "react";
import { Measurement } from "@/lib/types";
import { LASER_LINES, VISIBLE_POINTS } from "@/lib/constants";

export default function LaserPowerViewer() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedLaser, setSelectedLaser] = useState<string | null>(null);
  const [chartOffset, setChartOffset] = useState(-1);
  const [filterSystem, setFilterSystem] = useState<string>("all");
  const [filterObjective, setFilterObjective] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [loading, setLoading] = useState(true);
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

  // Unique values for filter dropdowns (derived from data)
  const uniqueSystems = [...new Set(measurements.map((m) => m.system).filter(Boolean))];
  const uniqueObjectives = [...new Set(measurements.map((m) => m.objective).filter(Boolean))];

  // Only show laser buttons that have data in the filtered measurements
  const availableLasers = LASER_LINES.filter((laser) =>
    filteredMeasurements.some(
      (m) => m.values[laser.key] !== null && m.values[laser.key] !== undefined
    )
  );

  // Deselect laser if it's no longer available after filter change
  const effectiveSelectedLaser =
    selectedLaser && availableLasers.some((l) => l.key === selectedLaser)
      ? selectedLaser
      : null;

  function getChartData(laserKey: string) {
    return filteredMeasurements
      .filter((m) => m.values[laserKey] !== null && m.values[laserKey] !== undefined)
      .map((m) => ({
        date: new Date(m.date).toLocaleDateString("cs-CZ"),
        value: m.values[laserKey] as number,
      }))
      .reverse();
  }

  const chartDataAll = effectiveSelectedLaser ? getChartData(effectiveSelectedLaser) : [];
  const maxSliderOffset = Math.max(0, chartDataAll.length - VISIBLE_POINTS);
  const safeOffset = chartOffset === -1 ? maxSliderOffset : Math.min(chartOffset, maxSliderOffset);
  const chartData = chartDataAll.slice(safeOffset, safeOffset + VISIBLE_POINTS);
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  const minValue = chartData.length > 0 ? Math.min(...chartData.map((d) => d.value)) : 0;
  const selectedLaserInfo = LASER_LINES.find((l) => l.key === effectiveSelectedLaser);

  // Trend statistics for the full filtered dataset
  const trendStats = effectiveSelectedLaser && chartDataAll.length >= 2
    ? (() => {
        const firstVal = chartDataAll[0].value;
        const lastVal = chartDataAll[chartDataAll.length - 1].value;
        const pctChange = firstVal !== 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
        const allValues = chartDataAll.map((d) => d.value);
        const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        return { firstVal, lastVal, pctChange, avg, min, max, count: chartDataAll.length };
      })()
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-sans)]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
              LSM
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Laser Power Viewer</h1>
              <p className="text-sm text-slate-500">Read-only Power Trend Dashboard</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">Read-only</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-6">
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

        {loading ? (
          <div className="h-96 flex items-center justify-center text-sm text-slate-400">
            Loading measurements...
          </div>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Laser line selection */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Power Trend</h2>
              <div className="flex flex-wrap gap-1.5">
                {availableLasers.length > 0 ? availableLasers.map((laser) => (
                  <button
                    key={laser.key}
                    onClick={() => {
                      setSelectedLaser(effectiveSelectedLaser === laser.key ? null : laser.key);
                      setChartOffset(-1);
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: effectiveSelectedLaser === laser.key ? laser.color : "transparent",
                      color: effectiveSelectedLaser === laser.key ? "white" : laser.color,
                      borderColor: laser.color,
                    }}
                  >
                    {laser.key}
                  </button>
                )) : (
                  <span className="text-xs text-slate-400">No laser data available</span>
                )}
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

            {/* Chart */}
            {effectiveSelectedLaser && chartData.length > 0 ? (
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
                  const labelEvery = Math.max(1, Math.ceil(chartData.length / 10));

                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[28rem]">
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

                      {/* Data points with hover tooltip */}
                      {points.map((p, i) => (
                        <g key={i} className="group/point">
                          {/* Larger invisible hit area */}
                          <circle cx={p.x} cy={p.y} r={12} fill="transparent" className="cursor-pointer" />
                          {/* Visible dot */}
                          <circle cx={p.x} cy={p.y} r={3} fill="white" stroke={color} strokeWidth={1.5} className="pointer-events-none group-hover/point:r-[5px]" />
                          {/* Hover-only tooltip */}
                          <g className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">
                            <rect
                              x={p.x - 32} y={p.y - 28}
                              width={64} height={18} rx={4}
                              fill="#1e293b" opacity={0.9}
                            />
                            <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize={9} fill="white" fontFamily="monospace" fontWeight="bold">
                              {p.value} mW
                            </text>
                          </g>
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

                {/* Trend statistics */}
                {trendStats && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Trend</div>
                      <div className={`text-sm font-bold font-mono ${trendStats.pctChange > 0 ? "text-emerald-600" : trendStats.pctChange < 0 ? "text-red-500" : "text-slate-600"}`}>
                        {trendStats.pctChange > 0 ? "+" : ""}{trendStats.pctChange.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400">{trendStats.firstVal.toFixed(1)} → {trendStats.lastVal.toFixed(1)} mW</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Average</div>
                      <div className="text-sm font-bold font-mono text-slate-700">{trendStats.avg.toFixed(2)} mW</div>
                      <div className="text-[10px] text-slate-400">{trendStats.count} measurements</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Min</div>
                      <div className="text-sm font-bold font-mono text-slate-700">{trendStats.min.toFixed(2)} mW</div>
                      <div className="text-[10px] text-slate-400">{chartDataAll[0]?.date} — {chartDataAll[chartDataAll.length - 1]?.date}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Max</div>
                      <div className="text-sm font-bold font-mono text-slate-700">{trendStats.max.toFixed(2)} mW</div>
                      <div className="text-[10px] text-slate-400">{chartDataAll[0]?.date} — {chartDataAll[chartDataAll.length - 1]?.date}</div>
                    </div>
                  </div>
                )}

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
              <div className="h-[28rem] flex items-center justify-center text-sm text-slate-400">
                {effectiveSelectedLaser
                  ? "No data for this laser line"
                  : "Select a laser line to see the trend"}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
