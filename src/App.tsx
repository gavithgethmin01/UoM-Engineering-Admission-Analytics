import { ArrowRight } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CutoffDataTable } from './components/CutoffDataTable';
import { DashboardHeader } from './components/DashboardHeader';
import { DistrictComparison } from './components/DistrictComparison';
import { HistoricalCutoffChart } from './components/HistoricalCutoffChart';
import { HistoricalInsights } from './components/HistoricalInsights';
import { MethodologySection } from './components/MethodologySection';
import { NationalDistrictExplorer } from './components/NationalDistrictExplorer';
import { RawMarksEstimator } from './components/RawMarksEstimator';
import { Sidebar } from './components/Sidebar';
import { SummaryMetrics } from './components/SummaryMetrics';
import { ZScorePlanner } from './components/ZScorePlanner';
import { DataVerificationBadge } from './components/intelligence/DataVerificationBadge';
import { HistoricalIntelligenceHub } from './components/intelligence/HistoricalIntelligenceHub';
import { HISTORICAL_CUTOFFS } from './data/cutoffs';
import { DistrictFilter } from './types/admission';
import { computeSummaryStats } from './utils/analytics';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Overview & All-25-District Analytics',
  '/intelligence': 'Historical Intelligence (8 Analysis Modes)',
  '/trends': 'Historical Cutoff Analysis',
  '/comparison': 'District Cutoff Comparison',
  '/planner': 'Z-Score Target Planner & Raw Marks',
  '/table': 'Historical & All-District Data Tables',
  '/methodology': 'Methodology & Data Sources',
};

function QuickWorkspaceLinks() {
  const links = [
    {
      to: '/intelligence',
      title: 'Historical Intelligence Hub',
      desc: 'Explore bump rankings, volatility scatter plots, gap analysis, and the 25-district heatmap.',
    },
    {
      to: '/intelligence?mode=district-explorer',
      title: 'District Historical Explorer',
      desc: 'Inspect full timelines, annual % changes, median, and extrema for any district.',
    },
    {
      to: '/planner',
      title: 'Z-Score Planner & Raw Marks',
      desc: 'Test target Z-scores against past cutoffs and log mock exam marks locally.',
    },
  ];

  return (
    <section aria-label="Workspace Modules" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {links.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group p-5 rounded-xl bg-[#111827] border border-white/[0.08] hover:border-blue-500/35 transition-colors flex flex-col justify-between gap-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
              <span>{item.title}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}

function DashboardShell() {
  const location = useLocation();
  const allYears = HISTORICAL_CUTOFFS.map((r) => r.admissionYear);

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictFilter>('all');
  const [startYear, setStartYear] = useState<string>(allYears[0]);
  const [endYear, setEndYear] = useState<string>(allYears[allYears.length - 1]);

  const filteredRecords = useMemo(() => {
    const startIdx = allYears.indexOf(startYear);
    const endIdx = allYears.indexOf(endYear);
    if (startIdx === -1 || endIdx === -1) return HISTORICAL_CUTOFFS;
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);
    return HISTORICAL_CUTOFFS.slice(minIdx, maxIdx + 1);
  }, [allYears, startYear, endYear]);

  const summaryStats = useMemo(
    () => computeSummaryStats(filteredRecords, selectedDistrict),
    [filteredRecords, selectedDistrict]
  );

  const handleChangePeriod = (newStart: string, newEnd: string) => {
    setStartYear(newStart);
    setEndYear(newEnd);
  };

  const sectionTitle = ROUTE_TITLES[location.pathname] ?? 'Historical Cutoff Z-Score Analytics';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#080B14] text-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <DashboardHeader
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          startYear={startYear}
          endYear={endYear}
          onChangePeriod={handleChangePeriod}
          sectionTitle={sectionTitle}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <>
                      <DataVerificationBadge />
                      <SummaryMetrics
                        stats={summaryStats}
                        selectedDistrict={selectedDistrict}
                      />
                      <HistoricalCutoffChart
                        records={filteredRecords}
                        selectedDistrict={selectedDistrict}
                      />
                      <NationalDistrictExplorer
                        selectedDistrict={selectedDistrict}
                        onSelectDistrict={setSelectedDistrict}
                      />
                      <HistoricalInsights
                        records={filteredRecords}
                        selectedDistrict={selectedDistrict}
                      />
                      <QuickWorkspaceLinks />
                    </>
                  }
                />
                <Route
                  path="/intelligence"
                  element={<HistoricalIntelligenceHub selectedDistrict={selectedDistrict} />}
                />
                <Route
                  path="/trends"
                  element={
                    <>
                      <SummaryMetrics
                        stats={summaryStats}
                        selectedDistrict={selectedDistrict}
                      />
                      <HistoricalCutoffChart
                        records={filteredRecords}
                        selectedDistrict={selectedDistrict}
                      />
                      <HistoricalInsights
                        records={filteredRecords}
                        selectedDistrict={selectedDistrict}
                      />
                    </>
                  }
                />
                <Route
                  path="/comparison"
                  element={
                    <>
                      <DistrictComparison records={filteredRecords} />
                      <NationalDistrictExplorer
                        selectedDistrict={selectedDistrict}
                        onSelectDistrict={setSelectedDistrict}
                      />
                    </>
                  }
                />
                <Route
                  path="/planner"
                  element={
                    <>
                      <ZScorePlanner />
                      <RawMarksEstimator />
                    </>
                  }
                />
                <Route
                  path="/table"
                  element={<CutoffDataTable records={filteredRecords} />}
                />
                <Route path="/methodology" element={<MethodologySection />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-white/[0.06] py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              UoM Engineering Admission Analytics · Course 008 · All 25 Sri Lankan Districts
            </span>
            <span>
              Verify all cutoffs against official UGC Sri Lanka publications
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <DashboardShell />
      </BrowserRouter>
    </MotionConfig>
  );
}
