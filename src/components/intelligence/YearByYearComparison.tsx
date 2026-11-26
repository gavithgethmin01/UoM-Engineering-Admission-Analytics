import { ArrowUpDown, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DISTRICT_MAP, DISTRICT_REGISTRY, HISTORICAL_CUTOFFS, PROVINCES } from '../../data/cutoffs';
import { DistrictId, ProvinceName } from '../../types/admission';
import {
  computeYearDistribution,
  formatSignedZScore,
  formatZScore,
} from '../../utils/analytics';

export function YearByYearComparison() {
  const years = HISTORICAL_CUTOFFS.map((r) => r.admissionYear);
  const [selectedYear, setSelectedYear] = useState<string>(years[years.length - 1]);
  const [compareYear, setCompareYear] = useState<string>('none');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceName | 'all'>('all');
  const [search, setSearch] = useState('');
  const [highlightedDistrict, setHighlightedDistrict] = useState<DistrictId>('badulla');

  const primaryDist = useMemo(
    () => computeYearDistribution(selectedYear, HISTORICAL_CUTOFFS),
    [selectedYear]
  );

  const secondaryDist = useMemo(
    () =>
      compareYear !== 'none'
        ? computeYearDistribution(compareYear, HISTORICAL_CUTOFFS)
        : null,
    [compareYear]
  );

  const filteredItems = useMemo(() => {
    if (!primaryDist) return [];
    const q = search.trim().toLowerCase();

    const list = primaryDist.items.filter((item) => {
      if (selectedProvince !== 'all' && item.district.province !== selectedProvince) {
        return false;
      }
      if (!q) return true;
      return (
        item.district.name.toLowerCase().includes(q) ||
        item.district.province.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (a.cutoff === null && b.cutoff === null) {
        return a.district.name.localeCompare(b.district.name);
      }
      if (a.cutoff === null) return 1;
      if (b.cutoff === null) return -1;
      return sortOrder === 'desc' ? b.cutoff - a.cutoff : a.cutoff - b.cutoff;
    });
  }, [primaryDist, selectedProvince, search, sortOrder]);

  const numericChartItems = useMemo(() => {
    return filteredItems
      .filter((item) => item.cutoff !== null)
      .map((item) => {
        const compItem = secondaryDist?.items.find((s) => s.district.id === item.district.id);
        return {
          id: item.district.id,
          name: item.district.name,
          province: item.district.province,
          rank: item.rank,
          cutoff: item.cutoff as number,
          compareCutoff: compItem?.cutoff ?? null,
          delta:
            item.cutoff !== null && compItem?.cutoff !== null && compItem?.cutoff !== undefined
              ? Number((item.cutoff - compItem.cutoff).toFixed(4))
              : null,
        };
      });
  }, [filteredItems, secondaryDist]);

  const highlightedEntry = primaryDist?.items.find(
    (i) => i.district.id === highlightedDistrict
  );

  const chartHeight = Math.max(260, numericChartItems.length * 32 + 50);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-6"
    >
      {/* Controls Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
            Year-by-Year National Comparison ({selectedYear})
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Ranked district cutoffs for {selectedYear} · Verified numeric: {primaryDist?.verifiedNumericCount ?? 0} · NQC: {primaryDist?.nqcCount ?? 0} · Unverified: {primaryDist?.unverifiedCount ?? 0}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Year */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs">
            <label htmlFor="yby-primary-year" className="text-slate-400">
              Year
            </label>
            <select
              id="yby-primary-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-mono text-slate-100 focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-[#111827]">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Compare Year */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs">
            <label htmlFor="yby-compare-year" className="text-slate-400">
              Compare With
            </label>
            <select
              id="yby-compare-year"
              value={compareYear}
              onChange={(e) => setCompareYear(e.target.value)}
              className="bg-transparent font-mono text-violet-300 focus:outline-none cursor-pointer"
            >
              <option value="none" className="bg-[#111827]">
                Single Year
              </option>
              {years
                .filter((y) => y !== selectedYear)
                .map((y) => (
                  <option key={y} value={y} className="bg-[#111827]">
                    {y}
                  </option>
                ))}
            </select>
          </div>

          {/* Province Filter */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value as ProvinceName | 'all')}
            aria-label="Filter by province"
            className="px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.08] text-xs text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#111827]">
              All Provinces
            </option>
            {PROVINCES.map((p) => (
              <option key={p} value={p} className="bg-[#111827]">
                {p}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B101D] hover:bg-[#182235] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
            {sortOrder === 'desc' ? 'Highest → Lowest' : 'Lowest → Highest'}
          </button>
        </div>
      </div>

      {/* Highlight District + Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B101D] border border-white/[0.07]">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label htmlFor="yby-highlight" className="text-slate-400">
            Highlight District:
          </label>
          <select
            id="yby-highlight"
            value={highlightedDistrict}
            onChange={(e) => setHighlightedDistrict(e.target.value as DistrictId)}
            className="px-2.5 py-1.5 rounded-md bg-[#111827] border border-white/[0.1] text-slate-100 focus:outline-none cursor-pointer"
          >
            {DISTRICT_REGISTRY.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {highlightedEntry && (
            <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-slate-300">
              <span>
                Cutoff:{' '}
                <strong className="text-blue-300">
                  {highlightedEntry.isNQC
                    ? 'NQC'
                    : highlightedEntry.cutoff !== null
                      ? formatZScore(highlightedEntry.cutoff)
                      : 'Unverified'}
                </strong>
              </span>
              {highlightedEntry.rank !== null && (
                <span>
                  Rank: <strong className="text-slate-100">#{highlightedEntry.rank}</strong> /{' '}
                  {primaryDist?.verifiedNumericCount}
                </span>
              )}
              {highlightedEntry.diffFromMean !== null && (
                <span
                  className={
                    highlightedEntry.diffFromMean >= 0 ? 'text-amber-400' : 'text-emerald-400'
                  }
                >
                  ({formatSignedZScore(highlightedEntry.diffFromMean)} vs {selectedYear} mean)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search district..."
            aria-label="Search districts in year comparison"
            className="w-full md:w-52 pl-8 pr-3 py-1.5 rounded-lg bg-[#111827] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Horizontal Ranked Bar Chart */}
      {numericChartItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400 border border-dashed border-white/[0.1] rounded-xl">
          No verified numeric districts match your current filter for {selectedYear}.
        </div>
      ) : (
        <div className="w-full" style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              key={`${selectedYear}-${compareYear}-${sortOrder}-${selectedProvince}`}
              data={numericChartItems}
              layout="vertical"
              margin={{ top: 10, right: 32, left: 20, bottom: 10 }}
              barGap={3}
            >
              <CartesianGrid
                stroke="rgba(148, 163, 184, 0.1)"
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={['dataMin - 0.02', 'dataMax + 0.02']}
                tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                tickFormatter={(v: number) => v.toFixed(3)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: '#E2E8F0', fontSize: 11, fontFamily: 'DM Sans' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const row = payload[0].payload;
                  return (
                    <div className="p-3 rounded-lg bg-[#0F172A]/95 border border-white/[0.14] text-xs space-y-1.5 shadow-xl">
                      <div className="font-semibold text-slate-100">
                        {row.name} · Rank #{row.rank}
                      </div>
                      <div className="font-mono text-blue-300">
                        {selectedYear}: {formatZScore(row.cutoff)}
                      </div>
                      {compareYear !== 'none' && (
                        <div className="font-mono text-violet-300">
                          {compareYear}:{' '}
                          {row.compareCutoff !== null ? formatZScore(row.compareCutoff) : 'Unverified'}
                        </div>
                      )}
                      {row.delta !== null && (
                        <div className="font-mono text-slate-300">
                          Diff ({selectedYear} − {compareYear}): {formatSignedZScore(row.delta)}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {primaryDist?.mean && (
                <ReferenceLine
                  x={primaryDist.mean}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                />
              )}
              <Bar
                dataKey="cutoff"
                name={selectedYear}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                onClick={(d) => {
                  const id = (d as unknown as { id?: DistrictId })?.id;
                  if (id) setHighlightedDistrict(id);
                }}
                className="cursor-pointer"
              >
                {numericChartItems.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === highlightedDistrict ? '#60A5FA' : '#3B82F6'}
                    fillOpacity={entry.id === highlightedDistrict ? 1 : 0.72}
                  />
                ))}
              </Bar>
              {compareYear !== 'none' && (
                <Bar
                  dataKey="compareCutoff"
                  name={compareYear}
                  fill="#8B5CF6"
                  fillOpacity={0.78}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={14}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Non-numeric status footer (NQC / Unverified in selected year) */}
      {filteredItems.some((i) => i.cutoff === null) && (
        <div className="pt-3 border-t border-white/[0.07] text-xs text-slate-400">
          <span className="font-medium text-slate-300">
            Districts without numeric bar in {selectedYear}:
          </span>{' '}
          {filteredItems
            .filter((i) => i.cutoff === null)
            .map((i) => `${DISTRICT_MAP[i.district.id].name} (${i.isNQC ? 'NQC' : 'Unverified'})`)
            .join(', ')}
        </div>
      )}
    </motion.div>
  );
}
