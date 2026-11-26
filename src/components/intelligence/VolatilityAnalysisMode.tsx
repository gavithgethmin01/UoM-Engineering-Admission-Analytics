import { Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { HISTORICAL_CUTOFFS } from '../../data/cutoffs';
import {
  computeVolatilityAnalysis,
  formatSignedZScore,
  formatZScore,
} from '../../utils/analytics';

export function VolatilityAnalysisMode() {
  const analysis = useMemo(
    () => computeVolatilityAnalysis(HISTORICAL_CUTOFFS),
    []
  );
  const [yMetric, setYMetric] = useState<'standardDeviation' | 'range'>('standardDeviation');

  const mostVolatile = analysis.metrics[0];
  const mostStable = analysis.metrics[analysis.metrics.length - 1];

  const scatterData = useMemo(
    () =>
      analysis.metrics.map((m) => ({
        name: m.district.name,
        x: m.averageCutoff,
        y: yMetric === 'standardDeviation' ? m.standardDeviation : m.range,
        quadrant: m.quadrant,
        color: m.district.color,
        yearsCount: m.yearsCount,
      })),
    [analysis.metrics, yMetric]
  );

  const yMeanRef = useMemo(() => {
    if (scatterData.length === 0) return 0.03;
    return Number(
      (scatterData.reduce((s, d) => s + d.y, 0) / scatterData.length).toFixed(4)
    );
  }, [scatterData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Dynamic Statistical Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">Highest Cutoff Volatility</div>
          <div className="text-lg font-semibold text-amber-300">
            {mostVolatile ? mostVolatile.district.name : '—'}
          </div>
          <div className="text-xs font-mono text-slate-300">
            {mostVolatile
              ? `σ = ${formatZScore(mostVolatile.standardDeviation)} · Range ${formatZScore(mostVolatile.range)}`
              : '—'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">Most Stable Multi-Year Cutoff</div>
          <div className="text-lg font-semibold text-emerald-300">
            {mostStable ? mostStable.district.name : '—'}
          </div>
          <div className="text-xs font-mono text-slate-300">
            {mostStable
              ? `σ = ${formatZScore(mostStable.standardDeviation)} · Range ${formatZScore(mostStable.range)}`
              : '—'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#111827] border border-white/[0.08] space-y-1.5">
          <div className="text-xs text-slate-400">Cohort Dispersion Baseline</div>
          <div className="text-lg font-mono font-semibold text-blue-300">
            μ = {formatZScore(analysis.meanCutoffAll)} · σ̄ = {formatZScore(analysis.meanStdDevAll)}
          </div>
          <div className="text-xs text-slate-400">
            Evaluated across {analysis.metrics.length} multi-year districts
          </div>
        </div>
      </div>

      {/* Charts Row: Volatility Ranking + Scatter Plot */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Horizontal Volatility Ranking */}
        <div className="xl:col-span-5 p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-slate-50">
              Volatility Ranking (σ Standard Deviation)
            </h3>
            <p className="text-xs text-slate-400">
              Ordered from highest historical fluctuation to most stable.
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysis.metrics}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 16, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(3)}
                />
                <YAxis
                  type="category"
                  dataKey="district.name"
                  width={100}
                  tick={{ fill: '#E2E8F0', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.14)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'IBM Plex Mono',
                  }}
                  formatter={(v) => [formatZScore(Number(v ?? 0)), 'Std Dev (σ)']}
                />
                <Bar dataKey="standardDeviation" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {analysis.metrics.map((m) => (
                    <Cell key={m.district.id} fill={m.district.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Plot: Historical Avg Cutoff vs Volatility */}
        <div className="xl:col-span-7 p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-50">
                  Average Cutoff vs. Historical Volatility
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                X-axis = Historical average cutoff · Y-axis = {yMetric === 'standardDeviation' ? 'Std Dev (σ)' : 'Range (Max − Min)'}
              </p>
            </div>

            <div className="inline-flex p-1 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs shrink-0">
              <button
                type="button"
                onClick={() => setYMetric('standardDeviation')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  yMetric === 'standardDeviation'
                    ? 'bg-[#182235] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Std Dev (σ)
              </button>
              <button
                type="button"
                onClick={() => setYMetric('range')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  yMetric === 'range'
                    ? 'bg-[#182235] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Range
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 24, left: 6, bottom: 16 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Average Cutoff"
                  domain={['auto', 'auto']}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v: number) => v.toFixed(3)}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Volatility"
                  domain={[0, 'auto']}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  width={56}
                  tickFormatter={(v: number) => v.toFixed(3)}
                />
                <ZAxis range={[90, 90]} />
                <ReferenceLine
                  x={analysis.meanCutoffAll}
                  stroke="#64748B"
                  strokeDasharray="4 4"
                />
                <ReferenceLine y={yMeanRef} stroke="#64748B" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const pt = payload[0].payload;
                    return (
                      <div className="p-3 rounded-lg bg-[#0F172A]/95 border border-white/[0.14] text-xs space-y-1 shadow-xl">
                        <div className="font-semibold text-slate-100">{pt.name}</div>
                        <div className="text-slate-400">{pt.quadrant}</div>
                        <div className="font-mono text-blue-300">
                          Mean Cutoff: {formatZScore(pt.x)}
                        </div>
                        <div className="font-mono text-violet-300">
                          {yMetric === 'standardDeviation' ? 'Std Dev (σ)' : 'Range'}:{' '}
                          {formatZScore(pt.y)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full Volatility Audit Table */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-100">
            District Volatility Metrics &amp; Quadrant Classification
          </h3>
          <span className="text-xs text-slate-400">
            {analysis.singleYearDistricts.length} single-year/NQC districts excluded from multi-year σ calculation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Vol Rank</th>
                <th className="py-2.5 px-3 font-medium">District</th>
                <th className="py-2.5 px-3 font-medium text-right">Mean</th>
                <th className="py-2.5 px-3 font-medium text-right">Range</th>
                <th className="py-2.5 px-3 font-medium text-right">Std Dev (σ)</th>
                <th className="py-2.5 px-3 font-medium text-right">Mean |YoY Δ|</th>
                <th className="py-2.5 px-3 font-medium text-right">Max +Δ / Max −Δ</th>
                <th className="py-2.5 pl-3 font-medium text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {analysis.metrics.map((m) => (
                <tr key={m.district.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-3 font-mono text-slate-400">#{m.volatilityRank}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-100">
                    {m.district.name}{' '}
                    <span className="text-[11px] font-mono text-slate-500">({m.yearsCount}y)</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-blue-300">
                    {formatZScore(m.averageCutoff)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-200">
                    {formatZScore(m.range)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-violet-300">
                    {formatZScore(m.standardDeviation)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300">
                    {formatZScore(m.meanAbsYoY)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-xs">
                    <span className="text-amber-400">
                      {m.largestIncrease !== null ? formatSignedZScore(m.largestIncrease) : '—'}
                    </span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-emerald-400">
                      {m.largestDecrease !== null ? formatSignedZScore(m.largestDecrease) : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right text-xs text-slate-300 whitespace-nowrap">
                    {m.quadrant}
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
