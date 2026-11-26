import { CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { SOURCE_METADATA } from '../../data/cutoffs';

export function DataVerificationBadge() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-[#0B101D] border border-white/[0.08] overflow-hidden">
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Audited Course 008 Dataset
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span>University of Moratuwa · B.Sc. Engineering (Hons)</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-slate-400">
            Excludes TM / EM / specialized courses · Official UGC PDFs verified across all 25 districts (2021/22–2025/26) · NQC preserved
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <span>{expanded ? 'Hide Source Audit' : 'Inspect Source Metadata'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/[0.07]"
          >
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400">
                    <th className="py-2 pr-3 font-medium">Admission</th>
                    <th className="py-2 px-3 font-medium">A/L Year</th>
                    <th className="py-2 px-3 font-medium">Course &amp; Code</th>
                    <th className="py-2 px-3 font-medium">Source Document</th>
                    <th className="py-2 px-3 font-medium">Verification Status</th>
                    <th className="py-2 pl-3 font-medium text-right">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {SOURCE_METADATA.map((src) => (
                    <tr key={src.admissionYear} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-100 whitespace-nowrap">
                        {src.admissionYear}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {src.alExamYear} A/L
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {src.courseCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <div>{src.sourceDocument}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{src.notes}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            src.verificationStatus.includes('All 25')
                              ? 'text-emerald-400'
                              : src.verificationStatus.includes('Multi-District')
                                ? 'text-blue-400'
                                : 'text-amber-400'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          {src.verificationStatus}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                        {src.verifiedDistrictCount}/25 · {src.lastVerifiedDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
