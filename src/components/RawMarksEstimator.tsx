import { BookmarkPlus, Info, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SavedMarksEntry } from '../types/admission';

interface CurrentMarks {
  label: string;
  combinedMaths: number;
  physics: number;
  chemistry: number;
}

const DEFAULT_MARKS: CurrentMarks = {
  label: 'Mock Exam Practice 1',
  combinedMaths: 82,
  physics: 78,
  chemistry: 76,
};

export function RawMarksEstimator() {
  const [draft, setDraft] = useLocalStorage<CurrentMarks>('uom_raw_marks_draft_v1', DEFAULT_MARKS);
  const [savedEntries, setSavedEntries] = useLocalStorage<SavedMarksEntry[]>(
    'uom_saved_marks_v1',
    []
  );
  const [saveMessage, setSaveMessage] = useState<string>('');

  const clampMark = (val: number) => {
    if (Number.isNaN(val)) return 0;
    return Math.min(100, Math.max(0, Math.round(val * 10) / 10));
  };

  const totalRaw = Number((draft.combinedMaths + draft.physics + draft.chemistry).toFixed(1));
  const averageRaw = Number((totalRaw / 3).toFixed(2));

  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = draft.label.trim() || `Saved Marks ${savedEntries.length + 1}`;
    const entry: SavedMarksEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: cleanLabel,
      combinedMaths: draft.combinedMaths,
      physics: draft.physics,
      chemistry: draft.chemistry,
      averageMark: averageRaw,
      createdAt: new Date().toLocaleDateString('en-LK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    };
    setSavedEntries((prev) => [entry, ...prev]);
    setSaveMessage('Marks saved locally in browser storage.');
    window.setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleLoadEntry = (entry: SavedMarksEntry) => {
    setDraft({
      label: entry.label,
      combinedMaths: entry.combinedMaths,
      physics: entry.physics,
      chemistry: entry.chemistry,
    });
  };

  const handleDeleteEntry = (id: string) => {
    setSavedEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const subjects = [
    {
      key: 'combinedMaths' as const,
      name: 'Combined Mathematics',
      value: draft.combinedMaths,
      color: 'bg-blue-500',
    },
    {
      key: 'physics' as const,
      name: 'Physics',
      value: draft.physics,
      color: 'bg-violet-500',
    },
    {
      key: 'chemistry' as const,
      name: 'Chemistry',
      value: draft.chemistry,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-6"
    >
      <div className="space-y-2 pb-4 border-b border-white/[0.07]">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
          Raw Marks Log & Z-Score Relationship
        </h2>
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#0B101D] border border-blue-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            Raw marks do not map directly to a fixed Z-score. Z-scores depend on the examination year, subject-level statistical distribution, and official calculation methodology.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <form onSubmit={handleSaveSnapshot} className="lg:col-span-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="marks-label" className="block text-xs font-medium text-slate-300">
              Attempt / Mock Label
            </label>
            <input
              id="marks-label"
              type="text"
              maxLength={48}
              value={draft.label}
              onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="e.g. Term Test 3 or Past Paper 2024"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-sm text-slate-100"
            />
          </div>

          <div className="space-y-4">
            {subjects.map((subj) => (
              <div
                key={subj.key}
                className="p-3.5 rounded-lg bg-[#0B101D] border border-white/[0.07] space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={`mark-${subj.key}`} className="text-xs font-medium text-slate-200">
                    {subj.name}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={`mark-${subj.key}`}
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={subj.value}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [subj.key]: clampMark(parseFloat(e.target.value)),
                        }))
                      }
                      className="w-20 px-2.5 py-1 rounded-md bg-[#111827] border border-white/[0.1] text-right font-mono text-sm text-slate-100 tabular-nums focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-slate-500">/ 100</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#182235] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${subj.color} transition-all duration-200`}
                    style={{ width: `${subj.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
            >
              <BookmarkPlus className="w-4 h-4" />
              Save Marks Locally
            </button>
            {saveMessage && (
              <span className="text-xs text-emerald-400">{saveMessage}</span>
            )}
          </div>
        </form>

        {/* Right: Raw Summary & Saved Snapshots */}
        <div className="lg:col-span-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-1">
              <div className="text-xs text-slate-400">3-Subject Raw Aggregate</div>
              <div className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
                {totalRaw.toFixed(1)} <span className="text-sm text-slate-500">/ 300</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-1">
              <div className="text-xs text-slate-400">Unweighted Raw Mean</div>
              <div className="text-2xl font-mono font-semibold tabular-nums text-blue-400">
                {averageRaw.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Statistical Formula Explanation */}
          <div className="p-4 rounded-xl bg-[#0B101D] border border-white/[0.07] space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="font-medium text-slate-100">
              Why a raw mark cannot output a guaranteed Z-score
            </div>
            <p className="text-slate-400">
              For each subject <span className="font-mono text-slate-300">i</span>, the standardized score is{' '}
              <span className="font-mono text-slate-200">Z_i = (X_i − μ_i) / σ_i</span>, where{' '}
              <span className="font-mono text-slate-300">μ_i</span> (island-wide subject mean) and{' '}
              <span className="font-mono text-slate-300">σ_i</span> (subject standard deviation) are only known after all candidates&apos; scripts for that specific examination year are marked.
            </p>
          </div>

          {/* Saved Marks History */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-300">
                Saved Local Estimates ({savedEntries.length})
              </h3>
              {savedEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSavedEntries([])}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear All
                </button>
              )}
            </div>

            {savedEntries.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-white/[0.1] bg-[#0B101D]/60 text-center text-xs text-slate-400">
                No saved raw-mark logs yet. Save your subject scores above to track progress locally across sessions.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {savedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-[#0B101D] border border-white/[0.07] flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadEntry(entry)}
                      className="text-left min-w-0 flex-1 group"
                    >
                      <div className="text-xs font-medium text-slate-200 group-hover:text-blue-300 truncate transition-colors">
                        {entry.label}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                        Maths {entry.combinedMaths} · Phys {entry.physics} · Chem {entry.chemistry} · Mean {entry.averageMark.toFixed(1)}%
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        {entry.createdAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        aria-label={`Delete ${entry.label}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
