import { BookOpen, CheckSquare, FileText, Scale, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { DATASET_NOTICE, SOURCE_METADATA } from '../data/cutoffs';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UGCVerificationNote } from '../types/admission';

const DEFAULT_VERIFICATION_NOTE: UGCVerificationNote = {
  publicationTitle: 'UGC Sri Lanka — University Admission Handbook / Official Cutoff Z-Score Release',
  academicYearChecked: '2021/22 – 2025/26 (Course 008)',
  verificationStatus: 'Pending Verification',
  notes: '',
};

export function MethodologySection() {
  const [sourceNote, setSourceNote] = useLocalStorage<UGCVerificationNote>(
    'uom_ugc_verification_log_v1',
    DEFAULT_VERIFICATION_NOTE
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const sections = [
    {
      icon: Scale,
      title: '1. What a University Admission Cutoff Z-Score Means',
      body: 'In Sri Lanka, GCE Advanced Level results across three subjects are standardized using island-wide subject means and standard deviations to compute a candidate’s Z-score. A cutoff Z-score published for Engineering (Course 008) at the University of Moratuwa represents the lowest Z-score of an eligible candidate admitted under that district’s intake quota for a given academic year.',
    },
    {
      icon: BookOpen,
      title: '2. Why Cutoffs Fluctuate Between Admission Years',
      body: 'Cutoff Z-scores shift each year due to changes in overall exam difficulty, cohort performance distributions in Combined Mathematics, Physics, and Chemistry, total university engineering seat allocations, applicant preference ordering, and the number of high-scoring candidates applying from a specific district.',
    },
    {
      icon: CheckSquare,
      title: '3. Course Isolation & District Selection Rules',
      body: 'This dataset strictly isolates University of Moratuwa B.Sc. Engineering Honours (Course Code 008 / 008G). It never mixes Engineering (TM), Engineering (EM), or other Moratuwa degree programs. NQC (No Qualified Candidates) is preserved explicitly and never converted to zero.',
    },
    {
      icon: ShieldAlert,
      title: '4. Why Historical Cutoffs Are Not Future Guarantees',
      body: 'Past cutoffs provide structural context for target setting, not predictive certainty. Historical target clearance counts are descriptive summaries of past cycles and must never be interpreted as future admission probabilities.',
    },
    {
      icon: FileText,
      title: '5. Why Raw Marks Cannot Convert Directly to a Guaranteed Z-Score',
      body: 'Because Z-score standardization normalizes each candidate’s raw score relative to that specific year’s national subject mean and standard deviation, an identical raw mark yields a different Z-score across different examination years.',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Explanatory Methodology */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-6">
        <div className="space-y-1.5 pb-4 border-b border-white/[0.07]">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
            Methodology &amp; Academic Transparency
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
            How GCE A/L Physical Science Z-scores, Course 008 isolation, district admission quotas, and historical reference cutoffs should be interpreted.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="p-4 sm:p-5 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      {/* Audited Source Metadata Table */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-4">
        <div className="space-y-1 pb-3 border-b border-white/[0.07]">
          <h3 className="text-base sm:text-lg font-semibold text-slate-50">
            Audited Dataset Source Metadata (Course 008)
          </h3>
          <p className="text-xs text-slate-400">
            Every cycle tracks A/L exam year, UGC source document, verification coverage, and exact NQC counts. Unverified historical cells remain null and are never interpolated.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Admission</th>
                <th className="py-2.5 px-3 font-medium">A/L Exam</th>
                <th className="py-2.5 px-3 font-medium">Course</th>
                <th className="py-2.5 px-3 font-medium">UGC Source</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 pl-3 font-medium text-right">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {SOURCE_METADATA.map((src) => (
                <tr key={src.admissionYear} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-3 font-mono font-medium text-slate-100">
                    {src.admissionYear}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{src.alExamYear}</td>
                  <td className="py-2.5 px-3 text-slate-300">{src.courseCode}</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <div>{src.sourceDocument}</div>
                    <div className="text-[11px] text-slate-500">{src.notes}</div>
                  </td>
                  <td className="py-2.5 px-3 text-blue-300">{src.verificationStatus}</td>
                  <td className="py-2.5 pl-3 text-right font-mono text-slate-300">
                    {src.lastVerifiedDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User-Editable Official UGC Verification Tracker */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5">
        <div className="space-y-1 pb-4 border-b border-white/[0.07]">
          <h3 className="text-base sm:text-lg font-semibold text-slate-50 tracking-tight">
            Local UGC Verification Log
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">{DATASET_NOTICE}</p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="ugc-pub-title" className="block text-xs font-medium text-slate-300">
              Official UGC Reference Publication / Document Title
            </label>
            <input
              id="ugc-pub-title"
              type="text"
              value={sourceNote.publicationTitle}
              onChange={(e) =>
                setSourceNote((prev) => ({ ...prev, publicationTitle: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ugc-year-checked" className="block text-xs font-medium text-slate-300">
              Academic Years / Gazette Reference Checked
            </label>
            <input
              id="ugc-year-checked"
              type="text"
              value={sourceNote.academicYearChecked}
              onChange={(e) =>
                setSourceNote((prev) => ({ ...prev, academicYearChecked: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ugc-status" className="block text-xs font-medium text-slate-300">
              Local Verification Status
            </label>
            <select
              id="ugc-status"
              value={sourceNote.verificationStatus}
              onChange={(e) =>
                setSourceNote((prev) => ({
                  ...prev,
                  verificationStatus: e.target.value as UGCVerificationNote['verificationStatus'],
                }))
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-100 cursor-pointer"
            >
              <option value="Pending Verification">Pending Verification</option>
              <option value="Cross-Checked Locally">Cross-Checked Locally</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ugc-notes" className="block text-xs font-medium text-slate-300">
              Reviewer Notes / Official Publication Citation
            </label>
            <input
              id="ugc-notes"
              type="text"
              value={sourceNote.notes}
              onChange={(e) => setSourceNote((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Record page number, table ID, or official UGC circular date..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4 pt-1">
            <span className="text-[11px] text-slate-400">
              Stored locally in your browser.
            </span>
            <div className="flex items-center gap-3">
              {savedNotice && (
                <span className="text-xs text-emerald-400">Source record updated</span>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors whitespace-nowrap"
              >
                Save Source Record
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.section>
  );
}
