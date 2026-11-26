import { Eye, EyeOff, Info, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
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
import { DATASET_NOTICE, DISTRICT_MAP } from '../data/cutoffs';
import { AdmissionRecord, DistrictFilter, DistrictId } from '../types/admission';
import { formatSignedZScore, formatZScore } from '../utils/analytics';

interface HistoricalCutoffChartProps {
  records: AdmissionRecord[];
  selectedDistrict: DistrictFilter;
}

// Districts with multi-year historical trajectories loaded
const MULTI_YEAR_DISTRICTS: DistrictId[] = [
  'badulla',
  'anuradhapura',
  'colombo',
  'kandy',
  'galle',
  'kurunegala',
  'matara',
  'matale',
  'nuwara_eliya',
];

interface ChartRow {
  admissionYear: string;
  [key: string]: string | number | null | undefined;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: DistrictId;
    value: number;
    color: string;
    payload: ChartRow;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0].payload;

  return (
    <div className="min-w-[235px] p-3.5 rounded-xl bg-[#0F172A]/95 backdrop-blur-md border border-white/[0.14] shadow-2xl text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
        <span className="font-semibold text-slate-100">Admission {label}</span>
        <span className="text-[11px] text-slate-400">Z-Score Cutoff</span>
      </div>

      <div className="space-y-2">
        {payload.map((entry) => {
          const districtId = entry.dataKey;
          const delta = row[`${districtId}_delta`] as number | null | undefined;
          return (
            <div key={districtId} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300">{DISTRICT_MAP[districtId].name}</span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <span className="font-semibold text-slate-50">
                  {formatZScore(entry.value)}
                </span>
                {delta !== null && delta !== undefined && (
                  <span
                    className={`ml-2 text-[11px] ${
                      delta < 0
                        ? 'text-emerald-400'
                        : delta > 0
                          ? 'text-amber-400'
                          : 'text-slate-400'
                    }`}
                  >
                    ({formatSignedZScore(delta)})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  color: string;
  value?: number | null;
}

function LatestHighlightDot({ cx, cy, index, dataLength, color, value }: CustomDotProps) {
  if (cx === undefined || cy === undefined || index === undefined || value === null || value === undefined) {
    return null;
  }
  const isLatest = index === dataLength - 1;

  if (isLatest) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.2} />
        <circle cx={cx} cy={cy} r={5} fill={color} stroke="#F8FAFC" strokeWidth={2} />
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={3.5} fill="#080B14" stroke={color} strokeWidth={2} />;
}

export function HistoricalCutoffChart({
  records,
  selectedDistrict,
}: HistoricalCutoffChartProps) {
  const [activeDistricts, setActiveDistricts] = useState<DistrictId[]>([
    'badulla',
    'anuradhapura',
  ]);
  const [excludedYears, setExcludedYears] = useState<string[]>([]);
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);

  useEffect(() => {
    if (selectedDistrict === 'all') {
      setActiveDistricts(['badulla', 'anuradhapura']);
    } else {
      setActiveDistricts([selectedDistrict]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    const validSet = new Set(records.map((r) => r.admissionYear));
    setExcludedYears((prev) => prev.filter((y) => validSet.has(y)));
  }, [records]);

  const selectableDistricts = useMemo(() => {
    const set = new Set<DistrictId>(MULTI_YEAR_DISTRICTS);
    if (selectedDistrict !== 'all') {
      set.add(selectedDistrict);
    }
    return Array.from(set);
  }, [selectedDistrict]);

  const toggleDistrict = (id: DistrictId) => {
    setActiveDistricts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleYear = (year: string) => {
    setExcludedYears((prev) => {
      if (prev.includes(year)) {
        return prev.filter((y) => y !== year);
      }
      if (records.length - prev.length <= 1) {
        return prev;
      }
      return [...prev, year];
    });
  };

  const filteredData = useMemo<ChartRow[]>(() => {
    const activeRows = records.filter((r) => !excludedYears.includes(r.admissionYear));
    return activeRows.map((row, idx) => {
      const prev = idx > 0 ? activeRows[idx - 1] : null;
      const out: ChartRow = { admissionYear: row.admissionYear };

      for (const id of selectableDistricts) {
        const currVal = row.cutoffs[id];
        const prevVal = prev ? prev.cutoffs[id] : null;
        out[id] = currVal;
        out[`${id}_delta`] =
          currVal !== null && prevVal !== null
            ? Number((currVal - prevVal).toFixed(4))
            : null;
      }

      return out;
    });
  }, [records, excludedYears, selectableDistricts]);

  const { yMin, yMax, combinedAverage } = useMemo(() => {
    const vals: number[] = [];
    for (const row of filteredData) {
      for (const id of activeDistricts) {
        const v = row[id];
        if (typeof v === 'number') vals.push(v);
      }
    }
    if (vals.length === 0) {
      return { yMin: 2.0, yMax: 2.2, combinedAverage: 2.08 };
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const pad = Math.max(0.015, (max - min) * 0.22);
    return {
      yMin: Number((min - pad).toFixed(4)),
      yMax: Number((max + pad).toFixed(4)),
      combinedAverage: Number(avg.toFixed(4)),
    };
  }, [filteredData, activeDistricts]);

  const latestPoint = filteredData[filteredData.length - 1];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5"
    >
      {/* Header & District Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight text-balance">
            UoM Engineering — Historical District Cutoff Trends
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Toggle districts to overlay multi-year trajectories · Latest cycle ({latestPoint?.admissionYear ?? '—'}) highlighted
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {selectableDistricts.map((id) => {
            const d = DISTRICT_MAP[id];
            const active = activeDistricts.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleDistrict(id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#182235] text-slate-100 border-white/[0.16]'
                    : 'bg-[#0C111E] text-slate-500 border-white/[0.06] hover:text-slate-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: active ? d.color : '#475569' }}
                />
                <span>{d.name}</span>
                {active ? (
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowAverageLine((prev) => !prev)}
            aria-pressed={showAverageLine}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              showAverageLine
                ? 'bg-blue-500/12 text-blue-300 border-blue-500/30'
                : 'bg-[#0C111E] text-slate-400 border-white/[0.06] hover:text-slate-200'
            }`}
          >
            Mean ({formatZScore(combinedAverage)})
          </button>
        </div>
      </div>

      {/* Year Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 rounded-lg bg-[#0B101D] border border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1.5">Admission Years:</span>
          {records.map((r) => {
            const isIncluded = !excludedYears.includes(r.admissionYear);
            return (
              <button
                key={r.admissionYear}
                type="button"
                onClick={() => toggleYear(r.admissionYear)}
                aria-pressed={isIncluded}
                className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors whitespace-nowrap ${
                  isIncluded
                    ? 'bg-[#182235] text-slate-100 border border-blue-500/30'
                    : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-300 line-through'
                }`}
              >
                {r.admissionYear}
              </button>
            );
          })}
        </div>

        {excludedYears.length > 0 && (
          <button
            type="button"
            onClick={() => setExcludedYears([])}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Show All Years
          </button>
        )}
      </div>

      {/* Main Chart */}
      <div className="h-[340px] sm:h-[380px] w-full">
        {activeDistricts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/[0.1] bg-[#0B101D]/60 text-center px-4">
            <p className="text-sm text-slate-300">No district series selected.</p>
            <button
              type="button"
              onClick={() => setActiveDistricts(['badulla', 'anuradhapura'])}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
            >
              Show Badulla & Anuradhapura
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 18, right: 24, left: 6, bottom: 10 }}
            >
              <CartesianGrid
                stroke="rgba(148, 163, 184, 0.1)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="admissionYear"
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                domain={[yMin, yMax]}
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(val: number) => val.toFixed(4)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgba(148, 163, 184, 0.22)', strokeWidth: 1 }}
              />
              {showAverageLine && (
                <ReferenceLine
                  y={combinedAverage}
                  stroke="#64748B"
                  strokeDasharray="4 4"
                  label={{
                    value: `Mean ${formatZScore(combinedAverage)}`,
                    position: 'insideTopRight',
                    fill: '#94A3B8',
                    fontSize: 11,
                    fontFamily: 'IBM Plex Mono',
                  }}
                />
              )}
              {activeDistricts.map((id) => {
                const d = DISTRICT_MAP[id];
                return (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    name={d.name}
                    stroke={d.color}
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={(props) => (
                      <LatestHighlightDot
                        key={`${id}-dot-${props.index}`}
                        cx={props.cx}
                        cy={props.cy}
                        index={props.index}
                        dataLength={filteredData.length}
                        color={d.color}
                        value={props.value}
                      />
                    )}
                    activeDot={{
                      r: 6,
                      fill: d.color,
                      stroke: '#F8FAFC',
                      strokeWidth: 2,
                    }}
                    isAnimationActive
                    animationDuration={750}
                    animationEasing="ease-out"
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Latest Cycle Snapshot & Dataset Disclaimer */}
      <div className="pt-3 border-t border-white/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-400">
        {latestPoint ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-slate-300 font-medium">
              Latest ({latestPoint.admissionYear}):
            </span>
            {activeDistricts.map((id) => {
              const val = latestPoint[id];
              return (
                <span key={id} className="font-mono tabular-nums text-slate-200">
                  {DISTRICT_MAP[id].name}{' '}
                  {typeof val === 'number' ? formatZScore(val) : 'NQC'}
                </span>
              );
            })}
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-start md:items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 md:mt-0" />
          <span>{DATASET_NOTICE}</span>
        </div>
      </div>
    </motion.section>
  );
}
