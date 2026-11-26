import {
  Activity,
  BarChart3,
  Compass,
  GitCompare,
  Globe2,
  Grid3X3,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { DistrictFilter, IntelligenceMode } from '../../types/admission';
import { ZScorePlanner } from '../ZScorePlanner';
import { AdmissionHeatmapMode } from './AdmissionHeatmapMode';
import { DataVerificationBadge } from './DataVerificationBadge';
import { DistrictGapAnalysisMode } from './DistrictGapAnalysisMode';
import { DistrictHistoricalExplorer } from './DistrictHistoricalExplorer';
import { NationalOverviewMode } from './NationalOverviewMode';
import { RankingEvolutionMode } from './RankingEvolutionMode';
import { VolatilityAnalysisMode } from './VolatilityAnalysisMode';
import { YearByYearComparison } from './YearByYearComparison';

interface HistoricalIntelligenceHubProps {
  selectedDistrict: DistrictFilter;
}

const INTELLIGENCE_MODES: Array<{
  id: IntelligenceMode;
  label: string;
  icon: typeof Globe2;
}> = [
  { id: 'national-overview', label: 'National Overview', icon: Globe2 },
  { id: 'district-explorer', label: 'District Historical Explorer', icon: MapPin },
  { id: 'year-comparison', label: 'Year-by-Year Comparison', icon: BarChart3 },
  { id: 'ranking-evolution', label: 'Ranking Evolution', icon: TrendingUp },
  { id: 'volatility-analysis', label: 'Volatility Analysis', icon: Activity },
  { id: 'gap-analysis', label: 'District Gap Analysis', icon: GitCompare },
  { id: 'heatmap', label: 'Admission Heatmap', icon: Grid3X3 },
  { id: 'personal-strategy', label: 'Personal Strategy', icon: Compass },
];

export function HistoricalIntelligenceHub({
  selectedDistrict,
}: HistoricalIntelligenceHubProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') as IntelligenceMode | null;

  const activeMode: IntelligenceMode = INTELLIGENCE_MODES.some((m) => m.id === modeParam)
    ? (modeParam as IntelligenceMode)
    : 'national-overview';

  const setMode = (mode: IntelligenceMode) => {
    setSearchParams({ mode }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Visible Data Source & Audit Indicator */}
      <DataVerificationBadge />

      {/* Segmented / Tab Navigation for all 8 Intelligence Modes */}
      <div
        role="tablist"
        aria-label="Historical Intelligence Analysis Modes"
        className="p-1.5 rounded-xl bg-[#111827] border border-white/[0.08] flex flex-wrap gap-1.5"
      >
        {INTELLIGENCE_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(mode.id)}
              className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="intelligence-mode-tab"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 rounded-lg bg-[#182235] border border-blue-500/35 shadow-[0_0_18px_-8px_rgba(59,130,246,0.5)]"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={`relative z-10 w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-blue-400' : 'text-slate-400'
                }`}
              />
              <span className="relative z-10">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Mode Viewport */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeMode === 'national-overview' && <NationalOverviewMode />}
          {activeMode === 'district-explorer' && (
            <DistrictHistoricalExplorer
              initialDistrict={
                selectedDistrict === 'all' ? 'anuradhapura' : selectedDistrict
              }
            />
          )}
          {activeMode === 'year-comparison' && <YearByYearComparison />}
          {activeMode === 'ranking-evolution' && <RankingEvolutionMode />}
          {activeMode === 'volatility-analysis' && <VolatilityAnalysisMode />}
          {activeMode === 'gap-analysis' && <DistrictGapAnalysisMode />}
          {activeMode === 'heatmap' && <AdmissionHeatmapMode />}
          {activeMode === 'personal-strategy' && <ZScorePlanner />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
