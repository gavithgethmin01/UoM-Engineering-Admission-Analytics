import { ArrowLeftRight, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DISTRICT_MAP, DISTRICT_REGISTRY, HISTORICAL_CUTOFFS, PROVINCES } from '../../data/cutoffs';
import { DistrictId } from '../../types/admission';
import {
  computeGapAnalysis,
  formatSignedZScore,
  formatZScore,
} from '../../utils/analytics';

export function DistrictGapAnalysisMode() {
  const [districtA, setDistrictA] = useState<DistrictId>('anuradhapura');
  const [districtB, setDistrictB] = useState<DistrictId>('badulla');
  const [extraDistricts, setExtraDistricts] = useState<DistrictId[]>([]);

  const gap = useMemo(
    () => computeGapAnalysis(districtA, districtB, HISTORICAL_CUTOFFS),
    [districtA, districtB]
  );

  const dualChartData = useMemo(
    () =>
      HISTORICAL_CUTOFFS.map((rec) => {
        const row: Record<string, string | number | null> = {
          admissionYear: rec.admissionYear,
          [districtA]: rec.cutoffs[districtA],
          [districtB]: rec.cutoffs[districtB],
        };
        for (const extra of extraDistricts) {
          row[extra] = rec.cutoffs[extra];
        }
        return row;
      }),
    [districtA, districtB, extraDistricts]
  );

  const areaData = useMemo(
    () =>
      gap.points.map((p) => ({
        admissionYear: p.admissionYear,
        diff: p.diff,
        absDiff: p.absDiff,
        gapChange: p.gapChangeFromPrev,
      })),
    [gap.points]
  );

  const handleAddExtra = (id: DistrictId) => {
    if (id === districtA || id === districtB || extraDistricts.includes(id)) return;
    setExtraDistricts((prev) => [...prev, id]);
  };

  const renderGroupedOptions = () =>
    PROVINCES.map((prov) => (
      <optgroup key={prov} label={prov} className="bg-[#0B101D] text-slate-400">
        {DISTRICT_REGISTRY.filter((d) => d.province === prov).map((d) => (
          <option key={d.id} value={d.id} className="bg-[#111827] text-slate-100">
            {d.name}
          </option>
        ))}
      </optgroup>
    ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Selector Bar */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
              District Gap &amp; Crossover Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Measure the signed Z-score gap (District A − District B), widening/narrowing cycles, and historical crossovers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs">
              <label htmlFor="gap-a" className="text-slate-400">
                A
              </label>
              <select
                id="gap-a"
                value={districtA}
                onChange={(e) => setDistrictA(e.target.value as DistrictId)}
                className="bg-transparent text-blue-300 font-medium focus:outline-none cursor-pointer"
              >
                {renderGroupedOptions()}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setDistrictA(districtB);
                setDistrictB(districtA);
              }}
              aria-label="Swap District A and B"
              className="p-2 rounded-lg bg-[#182235] hover:bg-blue-500/20 border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs">
              <label htmlFor="gap-b" className="text-slate-400">
                B
              </label>
              <select
                id="gap-b"
                value={districtB}
                onChange={(e) => setDistrictB(e.target.value as DistrictId)}
                className="bg-transparent text-violet-300 font-medium focus:outline-none cursor-pointer"
              >
                {renderGroupedOptions()}
              </select>
            </div>
          </div>
        </div>

        {/* Optional 3+ District Overlay Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Optional 3+ District Overlay:</span>
          {extraDistricts.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setExtraDistricts((prev) => prev.filter((x) => x !== id))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#182235] border border-white/[0.12] text-slate-200 hover:text-white"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: DISTRICT_MAP[id].color }}
              />
              {DISTRICT_MAP[id].name}
              <X className="w-3 h-3 text-slate-400" />
            </button>
          ))}

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0B101D] border border-white/[0.08]">
            <Plus className="w-3 h-3 text-blue-400" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddExtra(e.target.value as DistrictId);
              }}
              aria-label="Add a third or fourth district to overlay"
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Add district...</option>
              {DISTRICT_REGISTRY.filter(
                (d) =>
                  d.id !== districtA &&
                  d.id !== districtB &&
                  !extraDistricts.includes(d.id)
              ).map((d) => (
                <option key={d.id} value={d.id} className="bg-[#111827]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
            <div className="text-xs text-slate-400">Average Historical Gap</div>
            <div className="mt-1.5 text-xl font-mono font-semibold text-blue-300">
              {gap.averageAbsDiff !== null ? formatZScore(gap.averageAbsDiff) : '—'}
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-400">
              Signed mean: {formatSignedZScore(gap.averageDiff)} ({gap.pairedCount} paired yrs)
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
            <div className="text-xs text-slate-400">Maximum / Minimum Gap</div>
            <div className="mt-1.5 text-xl font-mono font-semibold text-slate-100">
              {gap.maxAbsDiff ? formatZScore(gap.maxAbsDiff.value) : '—'}
            </div>
            <div className="mt-1 text-[11px] font-mono text-slate-400">
              {gap.maxAbsDiff && gap.minAbsDiff
                ? `Peak ${gap.maxAbsDiff.year} · Min ${formatZScore(gap.minAbsDiff.value)} (${gap.minAbsDiff.year})`
                : 'Insufficient paired years'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
            <div className="text-xs text-slate-400">Gap Widened / Narrowed</div>
            <div className="mt-1.5 text-sm font-mono font-semibold text-slate-100">
              Widened: {gap.widenedYears.length} · Narrowed: {gap.narrowedYears.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 truncate">
              {gap.narrowedYears.length > 0
                ? `Narrowed in: ${gap.narrowedYears.join(', ')}`
                : 'No narrowing cycles'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07]">
            <div className="text-xs text-slate-400">Ranking Crossover Check</div>
            <div
              className={`mt-1.5 text-base font-semibold ${
                gap.hasCrossover ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {gap.hasCrossover ? 'Crossover Detected' : 'No Crossover'}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {gap.hasCrossover
                ? `Crossed in ${gap.crossoverYears.join(', ')}`
                : 'Relative leadership remained consistent'}
            </div>
          </div>
        </div>

        {/* Charts: Dual-Line + Difference-Area */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">
              Multi-Line Cutoff Comparison
            </h3>
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dualChartData}
                  margin={{ top: 12, right: 18, left: 4, bottom: 8 }}
                >
                  <CartesianGrid
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="admissionYear"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v: number) => v.toFixed(3)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.14)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono',
                    }}
                    formatter={(v) => [formatZScore(Number(v ?? 0))]}
                  />
                  <Line
                    type="monotone"
                    dataKey={districtA}
                    name={gap.districtA.name}
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={{ r: 4.5, fill: '#3B82F6', stroke: '#F8FAFC', strokeWidth: 1.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={districtB}
                    name={gap.districtB.name}
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={{ r: 4.5, fill: '#8B5CF6', stroke: '#F8FAFC', strokeWidth: 1.5 }}
                  />
                  {extraDistricts.map((id) => (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={DISTRICT_MAP[id].name}
                      stroke={DISTRICT_MAP[id].color}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      connectNulls={false}
                      dot={{ r: 3.5, fill: DISTRICT_MAP[id].color }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">
              Difference-Area Chart ({gap.districtA.name} − {gap.districtB.name})
            </h3>
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={areaData}
                  margin={{ top: 12, right: 18, left: 4, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="gapDiffFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="admissionYear"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v: number) => formatSignedZScore(v)}
                  />
                  <ReferenceLine y={0} stroke="#64748B" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.14)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono',
                    }}
                    formatter={(v) => [
                      formatSignedZScore(Number(v ?? 0)),
                      `${gap.districtA.name} − ${gap.districtB.name}`,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="diff"
                    stroke="#60A5FA"
                    strokeWidth={2.25}
                    fill="url(#gapDiffFill)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
