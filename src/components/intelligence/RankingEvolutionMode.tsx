import { ArrowDown, ArrowUp, Info, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DISTRICT_MAP, HISTORICAL_CUTOFFS } from '../../data/cutoffs';
import { DistrictId } from '../../types/admission';
import { computeRankingEvolution, formatZScore } from '../../utils/analytics';

export function RankingEvolutionMode() {
  const evolution = useMemo(
    () => computeRankingEvolution(HISTORICAL_CUTOFFS),
    []
  );

  const [highlighted, setHighlighted] = useState<DistrictId[]>([
    'badulla',
    'anuradhapura',
    'colombo',
    'kandy',
  ]);

  const toggleHighlight = (id: DistrictId) => {
    setHighlighted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Methodological Disclaimer */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#111827] border border-blue-500/25 text-xs sm:text-sm text-slate-300">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-100 font-medium">Interpretation Notice:</strong>{' '}
          District cutoff ranking orders districts by minimum published Course 008 Z-score (`#1` = highest cutoff). A higher or lower cutoff rank reflects local quota allocations and applicant demand, <strong>not</strong> overall student ability or regional educational quality.
        </p>
      </div>

      {/* Bump Chart Section */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
              District Ranking Evolution (Bump Chart)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tracks annual rank shifts among the {evolution.multiYearDistricts.length} districts with multi-year verified histories (#1 = highest cutoff in cohort).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {evolution.multiYearDistricts.map((d) => {
              const active = highlighted.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleHighlight(d.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#182235] text-white border-white/[0.2]'
                      : 'bg-[#0B101D] text-slate-500 border-white/[0.06] hover:text-slate-300'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: active ? d.color : '#475569' }}
                  />
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={evolution.bumpRows}
              margin={{ top: 16, right: 24, left: 6, bottom: 8 }}
            >
              <CartesianGrid
                stroke="rgba(148, 163, 184, 0.1)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="admissionYear"
                tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                reversed
                allowDecimals={false}
                domain={[1, evolution.multiYearDistricts.length]}
                ticks={Array.from(
                  { length: evolution.multiYearDistricts.length },
                  (_, i) => i + 1
                )}
                tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                width={46}
                tickFormatter={(v: number) => `#${v}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const row = payload[0].payload as Record<string, string | number | null>;
                  const sorted = [...payload]
                    .filter((p) => typeof p.value === 'number')
                    .sort((a, b) => Number(a.value) - Number(b.value));

                  return (
                    <div className="min-w-[220px] p-3.5 rounded-xl bg-[#0F172A]/95 border border-white/[0.14] text-xs space-y-2 shadow-2xl">
                      <div className="font-semibold text-slate-100 pb-1.5 border-b border-white/[0.08]">
                        Rankings · {label}
                      </div>
                      {sorted.map((entry) => {
                        const id = entry.dataKey as DistrictId;
                        const cutoff = row[`${id}_cutoff`];
                        return (
                          <div key={id} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-slate-200">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              #{entry.value} {DISTRICT_MAP[id].name}
                            </span>
                            <span className="font-mono text-slate-300">
                              {typeof cutoff === 'number' ? formatZScore(cutoff) : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {evolution.multiYearDistricts.map((d) => {
                const isFocused = highlighted.includes(d.id);
                return (
                  <Line
                    key={d.id}
                    type="monotone"
                    dataKey={d.id}
                    name={d.name}
                    stroke={d.color}
                    strokeWidth={isFocused ? 3 : 1.4}
                    strokeOpacity={isFocused || highlighted.length === 0 ? 1 : 0.22}
                    connectNulls={false}
                    dot={{
                      r: isFocused ? 5 : 3,
                      fill: d.color,
                      stroke: '#080B14',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 6, fill: d.color, stroke: '#F8FAFC', strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={650}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rank Movement Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">Biggest Ranking Rise</div>
          <div className="text-base font-semibold text-amber-300">
            {evolution.biggestRiser ? evolution.biggestRiser.district.name : '—'}
          </div>
          <div className="text-xs font-mono text-slate-300">
            {evolution.biggestRiser
              ? `+${evolution.biggestRiser.netRankGain} spots (#${evolution.biggestRiser.firstRank} in ${evolution.biggestRiser.firstYear} → #${evolution.biggestRiser.latestRank} in ${evolution.biggestRiser.latestYear})`
              : '—'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">Biggest Ranking Decline</div>
          <div className="text-base font-semibold text-emerald-300">
            {evolution.biggestDecliner ? evolution.biggestDecliner.district.name : '—'}
          </div>
          <div className="text-xs font-mono text-slate-300">
            {evolution.biggestDecliner
              ? `${evolution.biggestDecliner.netRankGain} spots (#${evolution.biggestDecliner.firstRank} in ${evolution.biggestDecliner.firstYear} → #${evolution.biggestDecliner.latestRank} in ${evolution.biggestDecliner.latestYear})`
              : '—'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">Consistently Highest Cutoff</div>
          <div className="text-sm font-medium text-slate-100 space-y-0.5">
            {evolution.mostConsistentlyHigh.map((item) => (
              <div key={item.district.id} className="flex justify-between font-mono text-xs">
                <span>{item.district.name}</span>
                <span className="text-violet-300">Avg #{item.avgRank}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">Consistently Lower Cutoff</div>
          <div className="text-sm font-medium text-slate-100 space-y-0.5">
            {evolution.mostConsistentlyLow.map((item) => (
              <div key={item.district.id} className="flex justify-between font-mono text-xs">
                <span>{item.district.name}</span>
                <span className="text-blue-300">Avg #{item.avgRank}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District Ranking Timeline Table */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] overflow-x-auto">
        <h3 className="text-base font-semibold text-slate-100 mb-4">
          District Ranking Timeline &amp; Net Movement
        </h3>
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-xs text-slate-400">
              <th className="py-2.5 pr-4 font-medium">District</th>
              {HISTORICAL_CUTOFFS.map((r) => (
                <th key={r.admissionYear} className="py-2.5 px-3 font-medium text-center font-mono">
                  {r.admissionYear}
                </th>
              ))}
              <th className="py-2.5 pl-4 font-medium text-right">Net Rank Shift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {evolution.summaries.map((s) => (
              <tr key={s.district.id} className="hover:bg-white/[0.02]">
                <td className="py-2.5 pr-4 font-medium text-slate-100">{s.district.name}</td>
                {HISTORICAL_CUTOFFS.map((r) => {
                  const pt = s.rankHistory.find((h) => h.year === r.admissionYear);
                  return (
                    <td
                      key={r.admissionYear}
                      className="py-2.5 px-3 font-mono tabular-nums text-center text-xs text-slate-300"
                    >
                      {pt ? `#${pt.rank}` : <span className="text-slate-600">—</span>}
                    </td>
                  );
                })}
                <td className="py-2.5 pl-4 text-right font-mono tabular-nums text-xs">
                  {s.netRankGain > 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <ArrowUp className="w-3.5 h-3.5" />+{s.netRankGain}
                    </span>
                  ) : s.netRankGain < 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <ArrowDown className="w-3.5 h-3.5" />
                      {s.netRankGain}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Minus className="w-3.5 h-3.5" />0
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
