import { AlertTriangle, CheckCircle2, Info, RotateCcw, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DISTRICT_MAP,
  DISTRICT_REGISTRY,
  HISTORICAL_CUTOFFS,
  PROVINCES,
} from '../data/cutoffs';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DistrictId, PlannerState } from '../types/admission';
import {
  formatSignedZScore,
  formatZScore,
  getAll25DistrictsLatestSnapshot,
} from '../utils/analytics';

const DEFAULT_PLANNER_STATE: PlannerState = {
  district: 'badulla',
  currentZScore: 1.9850,
  targetZScore: 2.0800,
  safetyMargin: 0.0500,
};

export function ZScorePlanner() {
  const location = useLocation();
  const [planner, setPlanner] = useLocalStorage<PlannerState>(
    'uom_planner_state_v1',
    DEFAULT_PLANNER_STATE
  );

  useEffect(() => {
    const state = location.state as { district?: DistrictId } | null;
    if (state?.district && DISTRICT_MAP[state.district]) {
      setPlanner((prev) => ({ ...prev, district: state.district as DistrictId }));
    }
  }, [location.state, setPlanner]);

  const districtValues = HISTORICAL_CUTOFFS.map((r) => ({
    year: r.admissionYear,
    value: r.cutoffs[planner.district],
  })).filter((d): d is { year: string; value: number } => d.value !== null);

  const snapshot = getAll25DistrictsLatestSnapshot();
  const isNQC = districtValues.length === 0;

  const latestRow =
    districtValues.length > 0
      ? districtValues[districtValues.length - 1]
      : { year: snapshot.latestYear, value: snapshot.nationalMean };

  const minCutoff =
    districtValues.length > 0
      ? Math.min(...districtValues.map((d) => d.value))
      : snapshot.lowest.latestCutoff ?? 2.0291;
  const maxCutoff =
    districtValues.length > 0
      ? Math.max(...districtValues.map((d) => d.value))
      : snapshot.highest.latestCutoff ?? 2.1689;
  const meanCutoff =
    districtValues.length > 0
      ? districtValues.reduce((sum, d) => sum + d.value, 0) / districtValues.length
      : snapshot.nationalMean;

  const latestCutoff = latestRow.value;
  const bufferedBenchmark = Number((latestCutoff + planner.safetyMargin).toFixed(4));
  const targetWithMargin = Number((planner.targetZScore + planner.safetyMargin).toFixed(4));

  const deltaVsLatest = Number((planner.currentZScore - latestCutoff).toFixed(4));
  const improvementToTarget = Number((planner.targetZScore - planner.currentZScore).toFixed(4));
  const improvementToBuffered = Number((targetWithMargin - planner.currentZScore).toFixed(4));
  const targetGapVsLatest = Number((planner.targetZScore - latestCutoff).toFixed(4));

  // Count historical admission years where target exceeded the cutoff
  const targetClearedYears = districtValues.filter((d) => planner.targetZScore >= d.value);
  const bufferedClearedYears = districtValues.filter((d) => targetWithMargin >= d.value);

  // Historical competitiveness descriptor (strictly descriptive of past thresholds)
  const competitivenessLabel =
    isNQC
      ? 'NQC in 2025/26 (No numeric cutoff recorded)'
      : latestCutoff >= snapshot.nationalMean + 0.02
        ? 'Elevated Cutoff Tier (Above National Mean)'
        : latestCutoff <= snapshot.nationalMean - 0.015
          ? 'Moderate Cutoff Tier (Below National Mean)'
          : 'Core National Band (Near National Mean)';

  const baseline = 1.5;
  const progressDenominator = Math.max(0.05, targetWithMargin - baseline);
  const progressPct = Math.min(
    100,
    Math.max(0, ((planner.currentZScore - baseline) / progressDenominator) * 100)
  );

  const scaleMin = 1.85;
  const scaleMax = 2.35;
  const toScalePct = (v: number) =>
    Math.min(100, Math.max(0, ((v - scaleMin) / (scaleMax - scaleMin)) * 100));

  const updateField = <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => {
    setPlanner((prev) => ({ ...prev, [key]: value }));
  };

  const clampZ = (val: number) => {
    if (Number.isNaN(val)) return 0;
    return Math.min(3.5, Math.max(-1.0, Number(val.toFixed(4))));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
              Personal Admission Strategy &amp; Target Planner
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare your current and target Z-scores against all verified historical cutoffs for {DISTRICT_MAP[planner.district].name} ({DISTRICT_MAP[planner.district].province}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPlanner(DEFAULT_PLANNER_STATE)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B101D] hover:bg-[#182235] border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Planner
        </button>
      </div>

      {isNQC && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            {DISTRICT_MAP[planner.district].name} was recorded as <strong>NQC (No Qualified Candidates)</strong> in {snapshot.latestYear}. Comparisons below use the {snapshot.latestYear} national district mean ({formatZScore(snapshot.nationalMean)}) as a reference baseline.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-5 space-y-5 p-4 sm:p-5 rounded-xl bg-[#0B101D] border border-white/[0.07]">
          <div className="space-y-2">
            <label htmlFor="planner-district-select" className="block text-xs font-medium text-slate-300">
              Target Admission District (All 25)
            </label>
            <select
              id="planner-district-select"
              value={planner.district}
              onChange={(e) => updateField('district', e.target.value as DistrictId)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-sm text-slate-100 cursor-pointer"
            >
              {PROVINCES.map((prov) => (
                <optgroup key={prov} label={prov} className="bg-[#0B101D] text-slate-400">
                  {DISTRICT_REGISTRY.filter((d) => d.province === prov).map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#111827] text-slate-100">
                      {d.name}
                      {d.latestStatus === 'NQC' ? ' (NQC in 2025/26)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="text-[11px] text-slate-400">
              Competitiveness: <span className="text-slate-200">{competitivenessLabel}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="planner-current-z" className="font-medium text-slate-300">
                Current Estimated Z-Score
              </label>
              <span className="font-mono text-slate-400">0.0000 – 3.5000</span>
            </div>
            <input
              id="planner-current-z"
              type="number"
              step="0.005"
              min="0"
              max="3.5"
              value={planner.currentZScore}
              onChange={(e) => updateField('currentZScore', clampZ(parseFloat(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-white/[0.1] focus:border-blue-500 focus:outline-none font-mono text-sm text-slate-100 tabular-nums"
            />
            <input
              type="range"
              min="1.5"
              max="2.5"
              step="0.001"
              aria-label="Adjust current estimated Z-score"
              value={Math.min(2.5, Math.max(1.5, planner.currentZScore))}
              onChange={(e) => updateField('currentZScore', clampZ(parseFloat(e.target.value)))}
              className="w-full analytics-slider"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="planner-target-z" className="font-medium text-slate-300">
                Target Base Z-Score
              </label>
              <span className="font-mono font-medium text-blue-400">
                {formatZScore(planner.targetZScore)}
              </span>
            </div>
            <input
              id="planner-target-z"
              type="number"
              step="0.005"
              min="0"
              max="3.5"
              value={planner.targetZScore}
              onChange={(e) => updateField('targetZScore', clampZ(parseFloat(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-white/[0.1] focus:border-blue-500 focus:outline-none font-mono text-sm text-slate-100 tabular-nums"
            />
            <input
              type="range"
              min="1.8"
              max="2.4"
              step="0.001"
              aria-label="Adjust target Z-score"
              value={Math.min(2.4, Math.max(1.8, planner.targetZScore))}
              onChange={(e) => updateField('targetZScore', clampZ(parseFloat(e.target.value)))}
              className="w-full analytics-slider"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="planner-margin" className="font-medium text-slate-300">
                Preferred Safety Margin
              </label>
              <span className="font-mono text-violet-300">
                +{formatZScore(planner.safetyMargin)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0.02, 0.05, 0.08].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateField('safetyMargin', preset)}
                  className={`py-1.5 rounded-md font-mono text-xs border transition-colors ${
                    Math.abs(planner.safetyMargin - preset) < 0.0001
                      ? 'bg-violet-500/20 text-violet-200 border-violet-500/40'
                      : 'bg-[#111827] text-slate-400 border-white/[0.06] hover:text-slate-200'
                  }`}
                >
                  +{preset.toFixed(2)}
                </button>
              ))}
            </div>
            <input
              id="planner-margin"
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              aria-label="Adjust safety margin"
              value={planner.safetyMargin}
              onChange={(e) => updateField('safetyMargin', clampZ(parseFloat(e.target.value)))}
              className="w-full analytics-slider"
            />
          </div>
        </div>

        {/* Right: Outputs & Historical Clearance */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-1.5">
              <div className="text-xs text-slate-400">
                Current Position vs {isNQC ? 'National Mean' : 'Latest Cutoff'} ({latestRow.year})
              </div>
              <div
                className={`text-2xl font-mono font-semibold tabular-nums ${
                  deltaVsLatest >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {formatSignedZScore(deltaVsLatest)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                {deltaVsLatest >= 0 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Above {formatZScore(latestCutoff)} benchmark</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Below {formatZScore(latestCutoff)} benchmark</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-1.5">
              <div className="text-xs text-slate-400">
                Historical Cycles Where Target Exceeded Cutoff
              </div>
              <div className="text-2xl font-mono font-semibold tabular-nums text-blue-300">
                {isNQC
                  ? 'N/A (NQC)'
                  : `${targetClearedYears.length} / ${districtValues.length} years`}
              </div>
              <div className="text-xs text-slate-400">
                {!isNQC &&
                  `With +${formatZScore(planner.safetyMargin)} margin: ${bufferedClearedYears.length}/${districtValues.length} years (historical count only, not probability)`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-1.5">
              <div className="text-xs text-slate-400">Target Gap vs Latest &amp; Required Gain</div>
              <div className="text-xl font-mono font-semibold tabular-nums text-violet-300">
                {formatSignedZScore(targetGapVsLatest)} vs latest
              </div>
              <div className="text-xs text-slate-400">
                Required gain from current:{' '}
                <span className="font-mono text-slate-200">
                  {improvementToTarget <= 0
                    ? 'Base target met'
                    : `+${formatZScore(improvementToTarget)}`}{' '}
                  ({improvementToBuffered <= 0
                    ? 'buffer met'
                    : `+${formatZScore(improvementToBuffered)} buffered`})
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-1.5">
              <div className="text-xs text-slate-400">
                {isNQC
                  ? 'National 25-District Range'
                  : `Historical Min–Max (${districtValues.length} yr${
                      districtValues.length > 1 ? 's' : ''
                    })`}
              </div>
              <div className="text-xl font-mono font-semibold tabular-nums text-slate-100">
                {minCutoff === maxCutoff
                  ? formatZScore(minCutoff)
                  : `${formatZScore(minCutoff)} – ${formatZScore(maxCutoff)}`}
              </div>
              <div className="text-xs text-slate-400">
                Mean:{' '}
                <span className="font-mono text-slate-200">{formatZScore(meanCutoff)}</span> · Buffered:{' '}
                <span className="font-mono text-slate-200">{formatZScore(bufferedBenchmark)}</span>
              </div>
            </div>
          </div>

          {/* Year-by-year target comparison strip */}
          {!isNQC && (
            <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-2.5">
              <div className="text-xs font-medium text-slate-300">
                Target ({formatZScore(planner.targetZScore)}) vs. Verified Historical Cutoffs
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {districtValues.map((row) => {
                  const diff = Number((planner.targetZScore - row.value).toFixed(4));
                  const passed = diff >= 0;
                  return (
                    <div
                      key={row.year}
                      className={`p-2.5 rounded-lg border text-xs ${
                        passed
                          ? 'bg-emerald-500/8 border-emerald-500/25'
                          : 'bg-amber-500/8 border-amber-500/25'
                      }`}
                    >
                      <div className="font-mono text-[11px] text-slate-400">{row.year}</div>
                      <div className="font-mono font-semibold text-slate-100 mt-0.5">
                        {formatZScore(row.value)}
                      </div>
                      <div
                        className={`font-mono text-[11px] mt-0.5 ${
                          passed ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {formatSignedZScore(diff)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress & Spectrum */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">
                  Progress Toward Buffered Target ({formatZScore(targetWithMargin)})
                </span>
                <span className="font-mono text-blue-300 tabular-nums">
                  {progressPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#182235] overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Reference Cutoff Band ({formatZScore(minCutoff)} – {formatZScore(maxCutoff)})</span>
                <span className="font-mono">Scale 1.85 – 2.35</span>
              </div>
              <div className="relative h-6 flex items-center">
                <div className="w-full h-1.5 rounded-full bg-[#182235]" />
                <div
                  className="absolute h-2 rounded-full bg-blue-500/30 border border-blue-400/50"
                  style={{
                    left: `${toScalePct(minCutoff)}%`,
                    width: `${Math.max(2, toScalePct(maxCutoff) - toScalePct(minCutoff))}%`,
                  }}
                />
                <div
                  className="absolute w-3 h-3 -ml-1.5 rounded-full bg-emerald-400 border-2 border-[#080B14] shadow-sm"
                  style={{ left: `${toScalePct(planner.currentZScore)}%` }}
                />
                <div
                  className="absolute w-3 h-3 -ml-1.5 rounded-full bg-violet-400 border-2 border-[#080B14] shadow-sm"
                  style={{ left: `${toScalePct(targetWithMargin)}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Current ({formatZScore(planner.currentZScore)})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm bg-blue-400/60" />
                  Historical Band
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                  Buffered Target ({formatZScore(targetWithMargin)})
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400">
            Transparent historical planning only: past cutoff clearance counts are not future admission probabilities, and no Z-score or raw-mark combination guarantees university selection.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
