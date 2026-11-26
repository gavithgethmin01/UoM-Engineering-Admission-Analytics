import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DISTRICT_REGISTRY, HISTORICAL_CUTOFFS, PROVINCES } from '../../data/cutoffs';
import { DistrictId } from '../../types/admission';
import {
  computeDistrictTimeline,
  formatSignedZScore,
  formatZScore,
} from '../../utils/analytics';
import { AnimatedCounter } from '../AnimatedCounter';

interface DistrictHistoricalExplorerProps {
  initialDistrict?: DistrictId;
}

const PERIOD_PRESETS = [
  { id: 'all', label: 'All Cycles (2021/22–2025/26)', startIdx: 0 },
  { id: '4yr', label: 'Last 4 Cycles (2022/23–2025/26)', startIdx: 1 },
  { id: '3yr', label: 'Last 3 Cycles (2023/24–2025/26)', startIdx: 2 },
  { id: '2yr', label: 'Last 2 Cycles (2024/25–2025/26)', startIdx: 3 },
];

export function DistrictHistoricalExplorer({
  initialDistrict = 'anuradhapura',
}: DistrictHistoricalExplorerProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>(initialDistrict);
  const [periodId, setPeriodId] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    const preset = PERIOD_PRESETS.find((p) => p.id === periodId) ?? PERIOD_PRESETS[0];
    return HISTORICAL_CUTOFFS.slice(preset.startIdx);
  }, [periodId]);

  const timeline = useMemo(
    () => computeDistrictTimeline(selectedDistrict, filteredRecords),
    [selectedDistrict, filteredRecords]
  );

  const chartData = useMemo(
    () =>
      timeline.points.map((p) => ({
        admissionYear: p.admissionYear,
        cutoff: p.cutoff,
        isNQC: p.isNQC,
        absChange: p.absChange,
        pctChange: p.pctChange,
      })),
    [timeline.points]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Animated District Selector & Period Controls */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
              District Historical Explorer — {timeline.district.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {timeline.district.province} · {timeline.numericCount} verified numeric cycle
              {timeline.numericCount === 1 ? '' : 's'} in selected window
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value as DistrictId)}
              aria-label="Select district to explore historical cutoffs"
              className="px-3.5 py-2 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-100 cursor-pointer"
            >
              {PROVINCES.map((prov) => (
                <optgroup key={prov} label={prov} className="bg-[#0B101D] text-slate-400">
                  {DISTRICT_REGISTRY.filter((d) => d.province === prov).map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#111827] text-slate-100">
                      {d.name} ({d.latestStatus === 'NQC' ? 'NQC' : 'Course 008'})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              aria-label="Select historical period"
              className="px-3.5 py-2 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-100 cursor-pointer"
            >
              {PERIOD_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111827] text-slate-100">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Animated 25-District Pill-Free Selector Strip */}
        <div className="flex flex-wrap gap-1.5">
          {DISTRICT_REGISTRY.map((d) => {
            const active = selectedDistrict === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDistrict(d.id)}
                className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200 bg-[#0B101D]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="explorer-district-active"
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 rounded-md bg-[#182235] border border-blue-500/40"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{d.name}</span>
              </button>
            );
          })}
        </div>

        {/* Stat Summary Grid */}
        {timeline.numericCount === 0 ? (
          <div className="p-5 rounded-xl bg-[#0B101D] border border-amber-500/25 flex items-start gap-3 text-sm text-slate-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-300">
                {timeline.district.name} — NQC / No Numeric History Loaded
              </div>
              <p className="text-xs text-slate-400 mt-1">
                In 2025/26, {timeline.district.name} was recorded as NQC (No Qualified Candidates), and earlier admission cycles remain unverified (`null`) to maintain strict data integrity.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
                <div className="text-xs text-slate-400">Historical Average</div>
                <div className="mt-1.5 text-xl font-semibold text-blue-300">
                  <AnimatedCounter value={timeline.average ?? 0} decimals={4} />
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  Median: {formatZScore(timeline.median)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
                <div className="text-xs text-slate-400">Highest Cutoff</div>
                <div className="mt-1.5 text-xl font-semibold text-amber-300">
                  <AnimatedCounter value={timeline.highestCutoff ?? 0} decimals={4} />
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  Year: {timeline.highestYear}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
                <div className="text-xs text-slate-400">Lowest Cutoff</div>
                <div className="mt-1.5 text-xl font-semibold text-emerald-300">
                  <AnimatedCounter value={timeline.lowestCutoff ?? 0} decimals={4} />
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  Year: {timeline.lowestYear}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
                <div className="text-xs text-slate-400">Overall Trajectory</div>
                <div className="mt-1.5 text-xl font-mono font-semibold text-slate-100">
                  {timeline.overallChange !== null
                    ? formatSignedZScore(timeline.overallChange)
                    : 'Single Cycle'}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {timeline.overallTrendLabel}
                </div>
              </div>
            </div>

            {/* Largest Increase & Decrease Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">Largest Annual Increase</div>
                  <div className="text-sm font-mono font-semibold text-amber-400 mt-1">
                    {timeline.largestIncrease
                      ? `${formatSignedZScore(timeline.largestIncrease.delta)} (${timeline.largestIncrease.prevYear} → ${timeline.largestIncrease.year})`
                      : 'None observed in period'}
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
              </div>

              <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">Largest Annual Decrease</div>
                  <div className="text-sm font-mono font-semibold text-emerald-400 mt-1">
                    {timeline.largestDecrease
                      ? `${formatSignedZScore(timeline.largestDecrease.delta)} (${timeline.largestDecrease.prevYear} → ${timeline.largestDecrease.year})`
                      : 'None observed in period'}
                  </div>
                </div>
                <TrendingDown className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>
            </div>

            {/* District Timeline Chart + Yearly Table */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7 h-[310px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={`${selectedDistrict}-${periodId}`}
                    data={chartData}
                    margin={{ top: 16, right: 20, left: 6, bottom: 8 }}
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
                      domain={['auto', 'auto']}
                      tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
                      tickFormatter={(v: number) => v.toFixed(4)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: 'rgba(255,255,255,0.14)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontFamily: 'IBM Plex Mono',
                      }}
                      formatter={(val) => [
                        val !== null && val !== undefined ? formatZScore(Number(val)) : 'Unverified',
                        timeline.district.name,
                      ]}
                    />
                    {timeline.average !== null && (
                      <ReferenceLine
                        y={timeline.average}
                        stroke="#64748B"
                        strokeDasharray="4 4"
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="cutoff"
                      stroke={timeline.district.color}
                      strokeWidth={2.75}
                      connectNulls={false}
                      dot={{
                        r: 5,
                        fill: timeline.district.color,
                        stroke: '#F8FAFC',
                        strokeWidth: 2,
                      }}
                      isAnimationActive
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="xl:col-span-5 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400">
                      <th className="py-2.5 pr-3 font-medium">Year</th>
                      <th className="py-2.5 px-2 font-medium text-right">Cutoff</th>
                      <th className="py-2.5 px-2 font-medium text-right">Abs Δ</th>
                      <th className="py-2.5 pl-2 font-medium text-right">% Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {timeline.points.map((pt) => (
                      <tr key={pt.admissionYear} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-3 font-mono text-slate-200">
                          {pt.admissionYear}
                        </td>
                        <td className="py-2.5 px-2 font-mono tabular-nums text-right font-semibold text-blue-300">
                          {pt.isNQC ? (
                            <span className="text-amber-400">NQC</span>
                          ) : pt.cutoff !== null ? (
                            formatZScore(pt.cutoff)
                          ) : (
                            <span className="text-slate-500 font-normal">Unverified</span>
                          )}
                        </td>
                        <td
                          className={`py-2.5 px-2 font-mono tabular-nums text-right ${
                            pt.absChange === null
                              ? 'text-slate-500'
                              : pt.absChange < 0
                                ? 'text-emerald-400'
                                : pt.absChange > 0
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                          }`}
                        >
                          {formatSignedZScore(pt.absChange)}
                        </td>
                        <td
                          className={`py-2.5 pl-2 font-mono tabular-nums text-right ${
                            pt.pctChange === null
                              ? 'text-slate-500'
                              : pt.pctChange < 0
                                ? 'text-emerald-400'
                                : pt.pctChange > 0
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                          }`}
                        >
                          {pt.pctChange !== null
                            ? `${pt.pctChange > 0 ? '+' : ''}${pt.pctChange.toFixed(2)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
