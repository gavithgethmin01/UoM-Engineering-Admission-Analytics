import { ArrowLeftRight, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DISTRICT_REGISTRY, PROVINCES } from '../data/cutoffs';
import { AdmissionRecord, DistrictId } from '../types/admission';
import { compareTwoDistricts, formatSignedZScore, formatZScore } from '../utils/analytics';

interface DistrictComparisonProps {
  records: AdmissionRecord[];
}

export function DistrictComparison({ records }: DistrictComparisonProps) {
  const [districtA, setDistrictA] = useState<DistrictId>('badulla');
  const [districtB, setDistrictB] = useState<DistrictId>('anuradhapura');

  const comparison = compareTwoDistricts(records, districtA, districtB);

  const handleSwap = () => {
    setDistrictA(districtB);
    setDistrictB(districtA);
  };

  const renderGroupedOptions = () =>
    PROVINCES.map((prov) => (
      <optgroup key={prov} label={prov} className="bg-[#0B101D] text-slate-400">
        {DISTRICT_REGISTRY.filter((d) => d.province === prov).map((d) => (
          <option key={d.id} value={d.id} className="bg-[#111827] text-slate-100">
            {d.name}
            {d.latestStatus === 'NQC' ? ' (NQC)' : ''}
          </option>
        ))}
      </optgroup>
    ));

  const chartData = comparison.rows.filter(
    (r) => r.valA !== null || r.valB !== null
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Selector & Side-by-Side Overview */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
              Side-by-Side District Comparison (All 25 Districts)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Compare any two Sri Lankan districts across available historical cycles and 2025/26 national thresholds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs">
              <label htmlFor="compare-district-a" className="text-slate-400">
                District A
              </label>
              <select
                id="compare-district-a"
                value={districtA}
                onChange={(e) => setDistrictA(e.target.value as DistrictId)}
                className="bg-transparent text-blue-300 font-medium focus:outline-none cursor-pointer"
              >
                {renderGroupedOptions()}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap compared districts"
              className="p-2 rounded-lg bg-[#182235] hover:bg-blue-500/20 border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs">
              <label htmlFor="compare-district-b" className="text-slate-400">
                District B
              </label>
              <select
                id="compare-district-b"
                value={districtB}
                onChange={(e) => setDistrictB(e.target.value as DistrictId)}
                className="bg-transparent text-violet-300 font-medium focus:outline-none cursor-pointer"
              >
                {renderGroupedOptions()}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Comparison Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{comparison.metaA.name} Average Cutoff</span>
              <span>{comparison.metaA.province}</span>
            </div>
            <div className="text-2xl font-mono font-semibold tabular-nums text-blue-400">
              {comparison.avgA !== null ? formatZScore(comparison.avgA) : 'NQC'}
            </div>
            <div className="text-xs text-slate-400">
              Higher in{' '}
              <span className="font-mono text-slate-200">
                {comparison.winsA}/{comparison.pairedCount}
              </span>{' '}
              paired cycles
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07] space-y-2">
            <div className="text-xs text-slate-400">Mean Differential (A − B)</div>
            <div className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
              {comparison.avgDiff !== null ? formatSignedZScore(comparison.avgDiff) : '—'}
            </div>
            <div className="text-xs text-slate-400">
              {comparison.avgDiff === null
                ? 'One or both districts recorded NQC'
                : comparison.avgDiff === 0
                  ? 'Identical mean cutoff across available years'
                  : comparison.avgDiff > 0
                    ? `${comparison.metaA.name} higher by ${formatZScore(Math.abs(comparison.avgDiff))}`
                    : `${comparison.metaB.name} higher by ${formatZScore(Math.abs(comparison.avgDiff))}`}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{comparison.metaB.name} Average Cutoff</span>
              <span>{comparison.metaB.province}</span>
            </div>
            <div className="text-2xl font-mono font-semibold tabular-nums text-violet-400">
              {comparison.avgB !== null ? formatZScore(comparison.avgB) : 'NQC'}
            </div>
            <div className="text-xs text-slate-400">
              Higher in{' '}
              <span className="font-mono text-slate-200">
                {comparison.winsB}/{comparison.pairedCount}
              </span>{' '}
              paired cycles
            </div>
          </div>
        </div>

        {/* Grouped Bar Chart + Year-by-Year Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <div className="xl:col-span-3 h-[300px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-white/[0.1] text-sm text-slate-400">
                Both selected districts are NQC across the selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: 0, bottom: 5 }}
                  barGap={6}
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
                    tickFormatter={(v: number) => v.toFixed(3)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono',
                    }}
                    formatter={(value) => formatZScore(Number(value ?? 0))}
                  />
                  <Bar
                    dataKey="valA"
                    name={`${comparison.metaA.name} (A)`}
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="valB"
                    name={`${comparison.metaB.name} (B)`}
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Year-by-year spread table */}
          <div className="xl:col-span-2 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Year</th>
                  <th className="py-2.5 px-2 font-medium text-right">{comparison.metaA.name}</th>
                  <th className="py-2.5 px-2 font-medium text-right">{comparison.metaB.name}</th>
                  <th className="py-2.5 pl-2 font-medium text-right">Gap (A − B)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {comparison.rows.map((r) => (
                  <tr key={r.admissionYear} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 font-mono text-slate-200">{r.admissionYear}</td>
                    <td className="py-2.5 px-2 font-mono tabular-nums text-right text-blue-300">
                      {r.valA !== null ? formatZScore(r.valA) : comparison.metaA.latestStatus === 'NQC' && r.admissionYear === '2025/26' ? 'NQC' : '—'}
                    </td>
                    <td className="py-2.5 px-2 font-mono tabular-nums text-right text-violet-300">
                      {r.valB !== null ? formatZScore(r.valB) : comparison.metaB.latestStatus === 'NQC' && r.admissionYear === '2025/26' ? 'NQC' : '—'}
                    </td>
                    <td
                      className={`py-2.5 pl-2 font-mono tabular-nums text-right font-medium ${
                        r.diff === null
                          ? 'text-slate-500'
                          : r.diff > 0
                            ? 'text-blue-400'
                            : r.diff < 0
                              ? 'text-violet-400'
                              : 'text-slate-400'
                      }`}
                    >
                      {formatSignedZScore(r.diff)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complete 25-District Ranking */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-slate-100">
              All 25 Districts Cutoff Ranking (Ordered by Latest Cycle)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Course Code 008 · 25 Administrative Districts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 divide-y md:divide-y-0 divide-white/[0.06]">
          {comparison.ranking.map((entry, idx) => (
            <div
              key={entry.district.id}
              className="py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-6 rounded-md bg-[#182235] border border-white/[0.08] flex items-center justify-center font-mono text-[11px] text-slate-300 shrink-0">
                  {entry.latest !== null ? `#${idx + 1}` : 'NQC'}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">
                    {entry.district.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {entry.district.province}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono tabular-nums text-xs shrink-0">
                <div className="text-right">
                  <div className="text-blue-300 font-semibold">
                    {entry.latest !== null ? formatZScore(entry.latest) : 'NQC'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {entry.yearsCount > 1 && entry.mean !== null
                      ? `Mean ${formatZScore(entry.mean)} (${entry.yearsCount}y)`
                      : '2025/26'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
