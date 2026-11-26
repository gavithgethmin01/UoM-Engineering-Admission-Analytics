import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { DISTRICT_MAP } from '../data/cutoffs';
import { DistrictFilter, SummaryStats } from '../types/admission';
import { AnimatedCounter } from './AnimatedCounter';

interface SummaryMetricsProps {
  stats: SummaryStats | null;
  selectedDistrict: DistrictFilter;
}

export function SummaryMetrics({ stats, selectedDistrict }: SummaryMetricsProps) {
  if (!stats) {
    return (
      <div className="p-6 rounded-xl bg-[#111827] border border-white/[0.08] text-sm text-slate-400">
        No admission cycles fall within the selected period. Adjust the admission period range to view metrics.
      </div>
    );
  }

  const scopeDescriptor =
    selectedDistrict === 'all' ? 'All Districts Mean' : `${DISTRICT_MAP[selectedDistrict].name}`;

  if (stats.isNQC || stats.latestCutoff === null) {
    return (
      <div className="p-5 rounded-xl bg-[#111827] border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-amber-400">
            {scopeDescriptor} · {stats.latestYear}
          </div>
          <div className="mt-1 text-lg font-mono font-semibold text-slate-100">
            NQC — No Qualified Candidates
          </div>
          <p className="mt-1 text-xs text-slate-400">
            No candidates from this district met the Course 008 selection threshold in the selected cycle.
          </p>
        </div>
      </div>
    );
  }

  const yoyPositive = stats.yoyChange !== null && stats.yoyChange > 0;
  const yoyNegative = stats.yoyChange !== null && stats.yoyChange < 0;

  const cards = [
    {
      id: 'latest',
      label: 'Latest Cutoff Z-Score',
      value: stats.latestCutoff,
      subtext: `${stats.latestYear} · ${scopeDescriptor}`,
      accent: 'text-blue-400',
      highlight: true,
    },
    {
      id: 'highest',
      label: 'Period Highest Cutoff',
      value: stats.highestCutoff ?? stats.latestCutoff,
      subtext: `Peak in ${stats.highestYear}`,
      accent: 'text-amber-400',
      highlight: false,
    },
    {
      id: 'lowest',
      label: 'Period Lowest Cutoff',
      value: stats.lowestCutoff ?? stats.latestCutoff,
      subtext: `Trough in ${stats.lowestYear}`,
      accent: 'text-emerald-400',
      highlight: false,
    },
    {
      id: 'average',
      label: 'Period Average Cutoff',
      value: stats.averageCutoff ?? stats.latestCutoff,
      subtext:
        stats.standardDeviation !== null
          ? `σ = ${stats.standardDeviation.toFixed(4)} (${stats.availableDataPoints} yr${
              stats.availableDataPoints > 1 ? 's' : ''
            })`
          : 'Single cycle',
      accent: 'text-violet-400',
      highlight: false,
    },
  ];

  return (
    <section
      aria-label="Key Admission Summary Metrics"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className={`p-5 rounded-xl bg-[#111827] border transition-colors ${
            card.highlight
              ? 'border-blue-500/35 shadow-[0_0_28px_-12px_rgba(59,130,246,0.45)]'
              : 'border-white/[0.08] hover:border-white/[0.14]'
          }`}
        >
          <div className="text-xs font-medium text-slate-400">{card.label}</div>
          <div className="mt-2.5 text-2xl sm:text-[26px] font-semibold tracking-tight text-slate-50">
            <AnimatedCounter value={card.value} decimals={4} />
          </div>
          <div className={`mt-2 text-xs font-medium ${card.accent}`}>{card.subtext}</div>
        </motion.div>
      ))}

      {/* YoY Cutoff Change Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="p-5 rounded-xl bg-[#111827] border border-white/[0.08] hover:border-white/[0.14] transition-colors sm:col-span-2 xl:col-span-1"
      >
        <div className="text-xs font-medium text-slate-400">Year-over-Year Change</div>
        <div className="mt-2.5 flex items-center gap-2 text-2xl sm:text-[26px] font-semibold tracking-tight">
          {stats.yoyChange !== null ? (
            <>
              <AnimatedCounter
                value={stats.yoyChange}
                decimals={4}
                signed
                className={
                  yoyNegative
                    ? 'text-emerald-400'
                    : yoyPositive
                      ? 'text-amber-400'
                      : 'text-slate-100'
                }
              />
              {yoyNegative ? (
                <ArrowDownRight className="w-5 h-5 text-emerald-400 shrink-0" aria-label="Decreased" />
              ) : yoyPositive ? (
                <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" aria-label="Increased" />
              ) : (
                <Minus className="w-5 h-5 text-slate-400 shrink-0" aria-label="Unchanged" />
              )}
            </>
          ) : (
            <span className="font-mono text-slate-400 text-xl">Single Year</span>
          )}
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {stats.yoyPreviousYear
            ? `${stats.yoyPreviousYear} → ${stats.latestYear} (${
                yoyNegative ? 'Lower threshold' : yoyPositive ? 'Higher threshold' : 'Unchanged'
              })`
            : '2025/26 single-cycle reference'}
        </div>
      </motion.div>
    </section>
  );
}
