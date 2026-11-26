import { Grid3X3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { DISTRICT_REGISTRY, HISTORICAL_CUTOFFS } from '../../data/cutoffs';
import { DistrictId } from '../../types/admission';
import { formatZScore, isDistrictNQCInRecord } from '../../utils/analytics';

type RowSortMode = 'latest' | 'alpha' | 'mean';

interface HoverCellInfo {
  districtName: string;
  province: string;
  year: string;
  value: number | null;
  isNQC: boolean;
}

export function AdmissionHeatmapMode() {
  const allYears = HISTORICAL_CUTOFFS.map((r) => r.admissionYear);
  const [selectedYears, setSelectedYears] = useState<string[]>(allYears);
  const [sortMode, setSortMode] = useState<RowSortMode>('latest');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId | 'all'>('all');
  const [hoveredCell, setHoveredCell] = useState<HoverCellInfo | null>(null);

  const toggleYear = (year: string) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        if (prev.length <= 1) return prev;
        return prev.filter((y) => y !== year);
      }
      return allYears.filter((y) => [...prev, year].includes(y));
    });
  };

  // Compute global min/max across all numeric cells in dataset for perceptual scale
  const { minVal, maxVal } = useMemo(() => {
    const vals: number[] = [];
    for (const r of HISTORICAL_CUTOFFS) {
      for (const d of DISTRICT_REGISTRY) {
        const v = r.cutoffs[d.id];
        if (v !== null) vals.push(v);
      }
    }
    return {
      minVal: Math.min(...vals),
      maxVal: Math.max(...vals),
    };
  }, []);

  const sortedDistricts = useMemo(() => {
    const latestRec = HISTORICAL_CUTOFFS[HISTORICAL_CUTOFFS.length - 1];
    const list = DISTRICT_REGISTRY.filter((d) =>
      selectedDistrict === 'all' ? true : d.id === selectedDistrict
    ).map((d) => {
      const vals = HISTORICAL_CUTOFFS.map((r) => r.cutoffs[d.id]).filter(
        (v): v is number => v !== null
      );
      const mean =
        vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      const latest = latestRec.cutoffs[d.id];
      return { district: d, mean, latest };
    });

    return list.sort((a, b) => {
      if (sortMode === 'alpha') {
        return a.district.name.localeCompare(b.district.name);
      }
      if (sortMode === 'mean') {
        if (a.mean === null && b.mean === null) return 0;
        if (a.mean === null) return 1;
        if (b.mean === null) return -1;
        return b.mean - a.mean;
      }
      // 'latest'
      if (a.latest === null && b.latest === null) return 0;
      if (a.latest === null) return 1;
      if (b.latest === null) return -1;
      return b.latest - a.latest;
    });
  }, [sortMode, selectedDistrict]);

  const getCellColor = (value: number | null, isNQC: boolean) => {
    if (isNQC) {
      return 'bg-amber-500/12 border-amber-500/30 text-amber-300';
    }
    if (value === null) {
      return 'bg-[#0B101D] border-white/[0.04] text-slate-600';
    }
    const ratio = Math.min(1, Math.max(0, (value - minVal) / Math.max(0.001, maxVal - minVal)));
    if (ratio < 0.25) {
      return 'bg-blue-950/80 border-blue-500/20 text-blue-200';
    }
    if (ratio < 0.5) {
      return 'bg-blue-700/35 border-blue-400/30 text-blue-100';
    }
    if (ratio < 0.75) {
      return 'bg-violet-600/40 border-violet-400/35 text-violet-100';
    }
    return 'bg-amber-500/30 border-amber-400/45 text-amber-100';
  };

  const activeRecords = HISTORICAL_CUTOFFS.filter((r) =>
    selectedYears.includes(r.admissionYear)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5"
    >
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
              National Historical Admission Heatmap (25 Districts)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Exact 4-decimal Z-scores across all 25 Sri Lankan districts (2021/22–2025/26 official UGC PDFs) · NQC preserved explicitly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort Mode */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as RowSortMode)}
            aria-label="Sort heatmap rows"
            className="px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.1] text-xs text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value="latest">Sort: Latest Cutoff (High → Low)</option>
            <option value="mean">Sort: Historical Mean</option>
            <option value="alpha">Sort: Alphabetical (A → Z)</option>
          </select>

          {/* Highlight / Filter District */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as DistrictId | 'all')}
            aria-label="Highlight or filter a district in heatmap"
            className="px-3 py-1.5 rounded-lg bg-[#0B101D] border border-white/[0.1] text-xs text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value="all">All 25 Districts</option>
            {DISTRICT_REGISTRY.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Year Column Toggles & Color Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-2.5 px-3.5 rounded-lg bg-[#0B101D] border border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1">Columns:</span>
          {allYears.map((y) => {
            const active = selectedYears.includes(y);
            return (
              <button
                key={y}
                type="button"
                onClick={() => toggleYear(y)}
                className={`px-2.5 py-1 rounded-md font-mono transition-colors ${
                  active
                    ? 'bg-[#182235] text-slate-100 border border-blue-500/30'
                    : 'text-slate-500 line-through'
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-950 border border-blue-500/30" />
            Lower ({formatZScore(minVal)})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-700/40 border border-blue-400/30" />
            Moderate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-violet-600/45 border border-violet-400/40" />
            Elevated
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500/35 border border-amber-400/50" />
            Peak ({formatZScore(maxVal)})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500/12 border border-amber-500/35" />
            NQC
          </span>
        </div>
      </div>

      {/* Live Hover Inspection Strip */}
      <div className="min-h-[36px] px-3.5 py-2 rounded-lg bg-[#0B101D] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
        {hoveredCell ? (
          <>
            <span className="text-slate-200 font-medium">
              {hoveredCell.districtName} ({hoveredCell.province}) · {hoveredCell.year}
            </span>
            <span className="font-mono text-blue-300">
              {hoveredCell.isNQC
                ? 'NQC — No Qualified Candidates'
                : hoveredCell.value !== null
                  ? `Cutoff Z-Score: ${formatZScore(hoveredCell.value)}`
                  : 'Unverified historical cell'}
            </span>
          </>
        ) : (
          <span className="text-slate-400">
            Hover over any cell in the 25-district matrix to inspect exact cycle details.
          </span>
        )}
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-1.5 text-xs">
          <thead>
            <tr className="text-slate-400">
              <th className="py-1.5 px-2 font-medium min-w-[160px]">District</th>
              {activeRecords.map((rec) => (
                <th
                  key={rec.admissionYear}
                  className="py-1.5 px-2 font-mono font-medium text-center min-w-[96px]"
                >
                  {rec.admissionYear}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDistricts.map(({ district }) => (
              <tr key={district.id}>
                <td className="py-1 px-2">
                  <div className="font-medium text-slate-100">{district.name}</div>
                  <div className="text-[10px] text-slate-500">{district.province}</div>
                </td>
                {activeRecords.map((rec) => {
                  const val = rec.cutoffs[district.id];
                  const isNQC = isDistrictNQCInRecord(rec, district.id);
                  return (
                    <td key={rec.admissionYear} className="p-0">
                      <div
                        onMouseEnter={() =>
                          setHoveredCell({
                            districtName: district.name,
                            province: district.province,
                            year: rec.admissionYear,
                            value: val,
                            isNQC,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-9 px-2 rounded-md border flex items-center justify-center font-mono tabular-nums transition-transform duration-100 hover:scale-[1.03] cursor-default ${getCellColor(
                          val,
                          isNQC
                        )}`}
                      >
                        {isNQC ? 'NQC' : val !== null ? formatZScore(val) : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
