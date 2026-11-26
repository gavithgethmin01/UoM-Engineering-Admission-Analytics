export type DistrictId =
  | 'colombo'
  | 'gampaha'
  | 'kalutara'
  | 'kandy'
  | 'matale'
  | 'nuwara_eliya'
  | 'galle'
  | 'matara'
  | 'hambantota'
  | 'jaffna'
  | 'kilinochchi'
  | 'mannar'
  | 'vavuniya'
  | 'mullaitivu'
  | 'batticaloa'
  | 'ampara'
  | 'trincomalee'
  | 'kurunegala'
  | 'puttalam'
  | 'anuradhapura'
  | 'polonnaruwa'
  | 'badulla'
  | 'monaragala'
  | 'ratnapura'
  | 'kegalle';

export type ProvinceName =
  | 'Western Province'
  | 'Central Province'
  | 'Southern Province'
  | 'Northern Province'
  | 'Eastern Province'
  | 'North Western Province'
  | 'North Central Province'
  | 'Uva Province'
  | 'Sabaragamuwa Province';

export type DistrictFilter = DistrictId | 'all';

export type IntelligenceMode =
  | 'national-overview'
  | 'district-explorer'
  | 'year-comparison'
  | 'ranking-evolution'
  | 'volatility-analysis'
  | 'gap-analysis'
  | 'heatmap'
  | 'personal-strategy';

export interface DistrictMeta {
  id: DistrictId;
  name: string;
  province: ProvinceName;
  color: string;
  latestStatus?: 'NQC' | 'Numeric';
  description: string;
}

export interface AdmissionRecord {
  admissionYear: string;
  cutoffs: Record<DistrictId, number | null>;
  nqcDistricts?: DistrictId[];
  badulla: number;
  anuradhapura: number;
}

export interface SourceMetadataRecord {
  admissionYear: string;
  alExamYear: string;
  courseName: string;
  courseCode: string;
  university: string;
  sourceDocument: string;
  sourceUrl: string;
  verificationStatus:
    | 'Verified (All 25 Districts)'
    | 'Verified (Multi-District Subset)'
    | 'Reference Prototype (2-District Baseline)';
  lastVerifiedDate: string;
  verifiedDistrictCount: number;
  nqcCount: number;
  notes: string;
}

export interface EnrichedAdmissionRow {
  admissionYear: string;
  badulla: number;
  anuradhapura: number;
  colombo: number | null;
  kandy: number | null;
  galle: number | null;
  kurunegala: number | null;
  badullaYoY: number | null;
  anuradhapuraYoY: number | null;
  spread: number;
  higherDistrict: DistrictId | 'tie';
  averageBoth: number;
}

export interface DistrictLatestRow {
  district: DistrictMeta;
  latestCutoff: number | null;
  isNQC: boolean;
  isUnverified?: boolean;
  diffFromNationalMean: number | null;
  yoyDelta?: number | null;
  previousYear?: string | null;
  rank: number | null;
  historyCount: number;
}

export interface SummaryStats {
  latestYear: string;
  latestCutoff: number | null;
  highestYear: string;
  highestCutoff: number | null;
  lowestYear: string;
  lowestCutoff: number | null;
  averageCutoff: number | null;
  yoyChange: number | null;
  yoyPreviousYear: string | null;
  standardDeviation: number | null;
  range: number | null;
  isNQC?: boolean;
  availableDataPoints: number;
}

export interface DeterministicInsight {
  id: string;
  category: 'peak' | 'trough' | 'volatility' | 'delta' | 'dominance' | 'trajectory';
  title: string;
  metricValue: string;
  explanation: string;
  tone: 'positive' | 'warning' | 'neutral' | 'accent';
}

export interface DistrictTimelinePoint {
  admissionYear: string;
  cutoff: number | null;
  isNQC: boolean;
  absChange: number | null;
  pctChange: number | null;
}

export interface DistrictTimelineSummary {
  district: DistrictMeta;
  points: DistrictTimelinePoint[];
  numericCount: number;
  highestYear: string | null;
  highestCutoff: number | null;
  lowestYear: string | null;
  lowestCutoff: number | null;
  average: number | null;
  median: number | null;
  overallChange: number | null;
  overallTrendLabel: 'Downward Trend' | 'Upward Trend' | 'Unchanged' | 'Single Cycle' | 'No Numeric Data';
  largestIncrease: { year: string; prevYear: string; delta: number } | null;
  largestDecrease: { year: string; prevYear: string; delta: number } | null;
}

export interface VolatilityDistrictMetrics {
  district: DistrictMeta;
  yearsCount: number;
  averageCutoff: number;
  range: number;
  standardDeviation: number;
  meanAbsYoY: number;
  largestIncrease: number | null;
  largestDecrease: number | null;
  volatilityRank: number;
  quadrant:
    | 'High Cutoff · Stable'
    | 'High Cutoff · Volatile'
    | 'Lower Cutoff · Stable'
    | 'Lower Cutoff · Volatile';
}

export interface NationalYearSummary {
  admissionYear: string;
  verifiedCount: number;
  nqcCount: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  increasedCount: number;
  decreasedCount: number;
  unchangedCount: number;
  medianYoYChange: number | null;
}

export interface GapAnalysisPoint {
  admissionYear: string;
  valA: number | null;
  valB: number | null;
  diff: number | null; // A - B
  absDiff: number | null;
  gapChangeFromPrev: 'Widened' | 'Narrowed' | 'Unchanged' | null;
  higher: DistrictId | 'tie' | null;
}

export interface GapAnalysisSummary {
  districtA: DistrictMeta;
  districtB: DistrictMeta;
  points: GapAnalysisPoint[];
  pairedCount: number;
  averageDiff: number | null;
  averageAbsDiff: number | null;
  maxAbsDiff: { value: number; year: string } | null;
  minAbsDiff: { value: number; year: string } | null;
  widenedYears: string[];
  narrowedYears: string[];
  hasCrossover: boolean;
  crossoverYears: string[];
}

export interface PlannerState {
  district: DistrictId;
  currentZScore: number;
  targetZScore: number;
  safetyMargin: number;
}

export interface SavedMarksEntry {
  id: string;
  label: string;
  combinedMaths: number;
  physics: number;
  chemistry: number;
  averageMark: number;
  createdAt: string;
}

export interface UGCVerificationNote {
  publicationTitle: string;
  academicYearChecked: string;
  verificationStatus: 'Pending Verification' | 'Cross-Checked Locally';
  notes: string;
}
