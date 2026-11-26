import { Compass, Map, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PROVINCES } from '../data/cutoffs';
import { DistrictFilter, DistrictId, ProvinceName } from '../types/admission';
import {
  formatSignedZScore,
  formatZScore,
  getAll25DistrictsLatestSnapshot,
} from '../utils/analytics';

interface NationalDistrictExplorerProps {
  selectedDistrict: DistrictFilter;
  onSelectDistrict: (district: DistrictFilter) => void;
}

export function NationalDistrictExplorer({
  selectedDistrict,
  onSelectDistrict,
}: NationalDistrictExplorerProps) {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState<ProvinceName | 'all'>('all');
  const [search, setSearch] = useState('');

  const snapshot = useMemo(() => getAll25DistrictsLatestSnapshot(), []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot.rows
      .filter((r) => {
        if (selectedProvince !== 'all' && r.district.province !== selectedProvince) {
          return false;
        }
        if (!q) return true;
        return (
          r.district.name.toLowerCase().includes(q) ||
          r.district.province.toLowerCase().includes(q) ||
          (r.isNQC ? 'nqc' : formatZScore(r.latestCutoff)).includes(q)
        );
      })
      .sort((a, b) => {
        if (a.latestCutoff === null && b.latestCutoff === null) {
          return a.district.name.localeCompare(b.district.name);
        }
        if (a.latestCutoff === null) return 1;
        if (b.latestCutoff === null) return -1;
        return b.latestCutoff - a.latestCutoff;
      });
  }, [snapshot.rows, selectedProvince, search]);

  const chartData = useMemo(
    () =>
      filteredRows
        .filter((r) => r.latestCutoff !== null)
        .map((r) => ({
          id: r.district.id,
          name: r.district.name,
          province: r.district.province,
          cutoff: r.latestCutoff as number,
          rank: r.rank,
        })),
    [filteredRows]
  );

  const handlePlanForDistrict = (id: DistrictId) => {
    onSelectDistrict(id);
    navigate('/planner', { state: { district: id } });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
              All 25 Sri Lankan Districts — {snapshot.latestYear} Cutoff Landscape
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Course Code 008 (B.Sc. Engineering Hons) · National mean{' '}
            <span className="font-mono text-slate-200">{formatZScore(snapshot.nationalMean)}</span> ·{' '}
            {snapshot.nqcCount} districts marked NQC (No Qualified Candidates)
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value as ProvinceName | 'all')}
            aria-label="Filter 25 districts by province"
            className="px-3 py-2 rounded-lg bg-[#0B101D] border border-white/[0.1] text-xs text-slate-100 focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All 9 Provinces (25 Districts)</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter district..."
              aria-label="Search all 25 districts"
              className="w-full sm:w-48 pl-8 pr-3 py-2 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Bar Distribution Chart */}
      {chartData.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Z-Score Ranking Distribution ({chartData.length} numeric districts shown)</span>
            <span className="font-mono">Range: 2.0000 – 2.2000</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 28 }}
              >
                <CartesianGrid
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={56}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'DM Sans' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[2.0, 2.18]}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v: number) => v.toFixed(2)}
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
                  formatter={(value) => [formatZScore(Number(value ?? 0)), '2025/26 Cutoff']}
                />
                <ReferenceLine
                  y={snapshot.nationalMean}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                />
                <Bar
                  dataKey="cutoff"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={26}
                  onClick={(data) => {
                    const id = (data as unknown as { id?: DistrictId })?.id;
                    if (id) onSelectDistrict(id);
                  }}
                  className="cursor-pointer"
                >
                  {chartData.map((entry) => {
                    const isFocused = selectedDistrict === entry.id;
                    return (
                      <Cell
                        key={entry.id}
                        fill={
                          isFocused
                            ? '#60A5FA'
                            : entry.cutoff >= snapshot.nationalMean
                              ? '#8B5CF6'
                              : '#3B82F6'
                        }
                        fillOpacity={selectedDistrict === 'all' || isFocused ? 0.92 : 0.45}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Compact 25-District Grid */}
      {filteredRows.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400 border border-dashed border-white/[0.1] rounded-lg">
          No districts match your province or search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredRows.map((row) => {
            const isSelected = selectedDistrict === row.district.id;
            return (
              <div
                key={row.district.id}
                className={`p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[#182235] border-blue-500/45'
                    : 'bg-[#0B101D] border-white/[0.07] hover:border-white/[0.16]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {row.district.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {row.district.province}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {row.rank !== null ? `#${row.rank}` : 'NQC'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  {row.isNQC ? (
                    <span className="font-mono text-sm font-semibold text-amber-400">
                      NQC
                    </span>
                  ) : (
                    <span className="font-mono text-lg font-semibold tabular-nums text-blue-300">
                      {formatZScore(row.latestCutoff)}
                    </span>
                  )}
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {row.diffFromNationalMean !== null
                      ? `${formatSignedZScore(row.diffFromNationalMean)} vs mean`
                      : 'No qualified quota'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
                  <button
                    type="button"
                    onClick={() =>
                      onSelectDistrict(isSelected ? 'all' : row.district.id)
                    }
                    className={`font-medium transition-colors ${
                      isSelected
                        ? 'text-blue-300 hover:text-blue-200'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Clear Focus' : 'Focus District'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlanForDistrict(row.district.id)}
                    className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200 font-medium"
                  >
                    <Compass className="w-3 h-3" />
                    Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
