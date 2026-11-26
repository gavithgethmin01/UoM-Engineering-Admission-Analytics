import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HISTORICAL_CUTOFFS } from '../../data/cutoffs';
import {
  computeNationalTrendSummary,
  formatSignedZScore,
  formatZScore,
  getAll25DistrictsLatestSnapshot,
} from '../../utils/analytics';
import { AnimatedCounter } from '../AnimatedCounter';

export function NationalOverviewMode() {
  const snapshot = useMemo(() => getAll25DistrictsLatestSnapshot(), []);
  const nationalTrend = useMemo(
    () => computeNationalTrendSummary(HISTORICAL_CUTOFFS),
    []
  );

  const latestSummary = nationalTrend[nationalTrend.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Descriptive National Statistic Callout */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#111827] border border-blue-500/25 text-xs sm:text-sm text-slate-300">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-100 font-medium">Descriptive District-Level Statistics:</strong>{' '}
          The national median, mean, and range below are computed across districts with verified numeric Course 008 cutoffs for each cycle. They summarize regional distribution and are <strong>not</strong> an official national admission cutoff (Sri Lanka admissions use merit + district quotas).
        </p>
      </div>

      {/* National KPIs for 2025/26 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#111827] border border-blue-500/30 space-y-1.5">
          <div className="text-xs text-slate-400">
            {snapshot.latestYear} National District Median
          </div>
          <div className="text-2xl font-semibold text-slate-50">
            <AnimatedCounter value={snapshot.nationalMedian} decimals={4} />
          </div>
          <div className="text-xs text-blue-400 font-mono">
            Mean {formatZScore(snapshot.nationalMean)} · {latestSummary.verifiedCount} numeric districts
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">
            {snapshot.latestYear} National Cutoff Range
          </div>
          <div className="text-2xl font-semibold text-slate-50">
            <AnimatedCounter value={latestSummary.range} decimals={4} />
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {formatZScore(latestSummary.min)} ({snapshot.lowest.district.name}) –{' '}
            {formatZScore(latestSummary.max)} ({snapshot.highest.district.name})
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">
            Districts Decreased ({nationalTrend[nationalTrend.length - 2]?.admissionYear} → {latestSummary.admissionYear})
          </div>
          <div className="flex items-center gap-2 text-2xl font-mono font-semibold text-emerald-400">
            <span>{latestSummary.decreasedCount}</span>
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-400">
            Increased: {latestSummary.increasedCount} · Unchanged: {latestSummary.unchangedCount}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">2025/26 NQC Districts</div>
          <div className="flex items-center gap-2 text-2xl font-mono font-semibold text-amber-400">
            <span>{snapshot.nqcCount}</span>
            <span className="text-xs font-sans font-normal text-slate-400">
              (Mannar, Mullaitivu)
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Preserved as NQC (never zeroed)
          </div>
        </div>
      </div>

      {/* Charts Grid: Descriptive Median Trend + YoY Increase/Decrease Counts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-slate-50">
              Descriptive District Median &amp; Mean Trajectory
            </h3>
            <p className="text-xs text-slate-400">
              Descriptive district-level median and average cutoff across verified districts per admission year.
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={nationalTrend}
                margin={{ top: 14, right: 20, left: 4, bottom: 8 }}
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
                  width={62}
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
                  formatter={(value, name) => [
                    formatZScore(Number(value ?? 0)),
                    String(name),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  name="District Median"
                  stroke="#3B82F6"
                  strokeWidth={2.75}
                  dot={{ r: 4.5, fill: '#3B82F6', stroke: '#F8FAFC', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="mean"
                  name="District Mean"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#8B5CF6' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Year-over-Year District Movement & Median Delta Chart */}
        <div className="xl:col-span-5 p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-slate-50">
              Year-over-Year District Direction Counts
            </h3>
            <p className="text-xs text-slate-400">
              Number of paired districts whose cutoff increased vs. decreased from the prior year.
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={nationalTrend.slice(1)}
                margin={{ top: 14, right: 16, left: 0, bottom: 8 }}
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
                  allowDecimals={false}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.14)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'IBM Plex Mono',
                  }}
                />
                <Bar
                  dataKey="decreasedCount"
                  name="Districts Decreased"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="increasedCount"
                  name="Districts Increased"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Yearly National Summary Table */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">
            Year-by-Year Descriptive National Summary
          </h3>
          <span className="text-xs text-slate-400">
            Computed from verified districts per cycle
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Admission Year</th>
                <th className="py-2.5 px-3 font-medium text-right">Verified</th>
                <th className="py-2.5 px-3 font-medium text-right">Median</th>
                <th className="py-2.5 px-3 font-medium text-right">Median YoY</th>
                <th className="py-2.5 px-3 font-medium text-right">Mean</th>
                <th className="py-2.5 px-3 font-medium text-right">Range (Min – Max)</th>
                <th className="py-2.5 pl-3 font-medium text-right">Up / Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {nationalTrend.map((row) => (
                <tr key={row.admissionYear} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-4 font-mono font-medium text-slate-100">
                    {row.admissionYear}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300">
                    {row.verifiedCount}
                    {row.nqcCount > 0 ? ` (+${row.nqcCount} NQC)` : ''}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-blue-300">
                    {formatZScore(row.median)}
                  </td>
                  <td
                    className={`py-2.5 px-3 font-mono tabular-nums text-right ${
                      row.medianYoYChange === null
                        ? 'text-slate-500'
                        : row.medianYoYChange < 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                    }`}
                  >
                    {formatSignedZScore(row.medianYoYChange)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-violet-300">
                    {formatZScore(row.mean)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300">
                    {formatZScore(row.range)} ({formatZScore(row.min)}–{formatZScore(row.max)})
                  </td>
                  <td className="py-2.5 pl-3 font-mono tabular-nums text-right text-xs">
                    {row.increasedCount === 0 && row.decreasedCount === 0 ? (
                      <span className="text-slate-500">Baseline</span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 text-amber-400">
                          <TrendingUp className="w-3 h-3" />
                          {row.increasedCount}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-400">
                          <TrendingDown className="w-3 h-3" />
                          {row.decreasedCount}
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
