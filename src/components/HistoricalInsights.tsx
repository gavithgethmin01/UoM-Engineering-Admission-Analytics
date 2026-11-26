import { Calculator } from 'lucide-react';
import { motion } from 'motion/react';
import { AdmissionRecord, DistrictFilter } from '../types/admission';
import { generateDeterministicInsights } from '../utils/analytics';

interface HistoricalInsightsProps {
  records: AdmissionRecord[];
  selectedDistrict: DistrictFilter;
}

export function HistoricalInsights({ records, selectedDistrict }: HistoricalInsightsProps) {
  const insights = generateDeterministicInsights(records, selectedDistrict);

  const toneStyles = {
    positive: 'text-emerald-400',
    warning: 'text-amber-400',
    accent: 'text-blue-400',
    neutral: 'text-violet-400',
  };

  return (
    <section
      aria-label="Deterministic Historical Insights"
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.07]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="text-lg font-semibold text-slate-50 tracking-tight">
              Deterministic Analytical Insights
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Computed directly from the selected historical dataset using statistical variance, extrema, and year-over-year deltas.
          </p>
        </div>
        <div className="text-xs text-slate-400 whitespace-nowrap">
          {records.length} cycle{records.length === 1 ? '' : 's'} analyzed
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          Select at least one admission year to generate deterministic statistical insights.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <motion.article
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 rounded-lg bg-[#0B101D] border border-white/[0.07] hover:border-white/[0.14] transition-colors flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-slate-400">{insight.title}</div>
                <div className={`text-base font-mono font-semibold tabular-nums ${toneStyles[insight.tone]}`}>
                  {insight.metricValue}
                </div>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300">
                {insight.explanation}
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
