import { DISTRICT_MAP, DISTRICT_REGISTRY, HISTORICAL_CUTOFFS, SOURCE_METADATA } from '../data/cutoffs';
import {
  AdmissionRecord,
  DeterministicInsight,
  DistrictFilter,
  DistrictId,
  DistrictLatestRow,
  DistrictTimelinePoint,
  DistrictTimelineSummary,
  EnrichedAdmissionRow,
  GapAnalysisPoint,
  GapAnalysisSummary,
  NationalYearSummary,
  SummaryStats,
  VolatilityDistrictMetrics,
} from '../types/admission';

export function formatZScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(4);
}

export function formatSignedZScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(4)}`;
}

export function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(4));
  }
  return Number(sorted[mid].toFixed(4));
}

export function getDistrictValue(record: AdmissionRecord, district: DistrictId): number | null {
  return record.cutoffs[district] ?? null;
}

export function isDistrictNQCInRecord(record: AdmissionRecord, district: DistrictId): boolean {
  return Boolean(record.nqcDistricts?.includes(district)) && record.cutoffs[district] === null;
}

export function getRecordMetric(record: AdmissionRecord, filter: DistrictFilter): number | null {
  if (filter === 'all') {
    const numericVals = Object.values(record.cutoffs).filter(
      (v): v is number => typeof v === 'number'
    );
    if (numericVals.length === 0) return null;
    if (numericVals.length === 2) {
      return (record.badulla + record.anuradhapura) / 2;
    }
    return numericVals.reduce((s, v) => s + v, 0) / numericVals.length;
  }
  return record.cutoffs[filter] ?? null;
}

export function enrichHistoricalRows(records: AdmissionRecord[]): EnrichedAdmissionRow[] {
  return records.map((row, idx) => {
    const prev = idx > 0 ? records[idx - 1] : null;
    const badullaYoY = prev ? Number((row.badulla - prev.badulla).toFixed(4)) : null;
    const anuradhapuraYoY = prev ? Number((row.anuradhapura - prev.anuradhapura).toFixed(4)) : null;
    const spread = Number(Math.abs(row.anuradhapura - row.badulla).toFixed(4));
    const higherDistrict: DistrictId | 'tie' =
      row.anuradhapura > row.badulla
        ? 'anuradhapura'
        : row.badulla > row.anuradhapura
          ? 'badulla'
          : 'tie';
    const averageBoth = Number(((row.badulla + row.anuradhapura) / 2).toFixed(4));

    return {
      admissionYear: row.admissionYear,
      badulla: row.badulla,
      anuradhapura: row.anuradhapura,
      colombo: row.cutoffs.colombo,
      kandy: row.cutoffs.kandy,
      galle: row.cutoffs.galle,
      kurunegala: row.cutoffs.kurunegala,
      badullaYoY,
      anuradhapuraYoY,
      spread,
      higherDistrict,
      averageBoth,
    };
  });
}

export function computeSummaryStats(
  records: AdmissionRecord[],
  filter: DistrictFilter
): SummaryStats | null {
  if (records.length === 0) return null;

  const latestRecord = records[records.length - 1];
  const isNQC =
    filter !== 'all' &&
    DISTRICT_MAP[filter].latestStatus === 'NQC' &&
    latestRecord.cutoffs[filter] === null;

  const validSeries = records
    .map((r) => ({
      year: r.admissionYear,
      value: getRecordMetric(r, filter),
    }))
    .filter((item): item is { year: string; value: number } => item.value !== null);

  if (validSeries.length === 0) {
    return {
      latestYear: latestRecord.admissionYear,
      latestCutoff: null,
      highestYear: latestRecord.admissionYear,
      highestCutoff: null,
      lowestYear: latestRecord.admissionYear,
      lowestCutoff: null,
      averageCutoff: null,
      yoyChange: null,
      yoyPreviousYear: null,
      standardDeviation: null,
      range: null,
      isNQC,
      availableDataPoints: 0,
    };
  }

  const latest = validSeries[validSeries.length - 1];
  const previous = validSeries.length >= 2 ? validSeries[validSeries.length - 2] : null;

  let highest = validSeries[0];
  let lowest = validSeries[0];
  let sum = 0;

  for (const item of validSeries) {
    sum += item.value;
    if (item.value > highest.value) highest = item;
    if (item.value < lowest.value) lowest = item;
  }

  const averageCutoff = sum / validSeries.length;
  const variance =
    validSeries.reduce((acc, item) => acc + Math.pow(item.value - averageCutoff, 2), 0) /
    validSeries.length;
  const standardDeviation = Math.sqrt(variance);
  const yoyChange = previous ? Number((latest.value - previous.value).toFixed(4)) : null;

  return {
    latestYear: latest.year,
    latestCutoff: Number(latest.value.toFixed(4)),
    highestYear: highest.year,
    highestCutoff: Number(highest.value.toFixed(4)),
    lowestYear: lowest.year,
    lowestCutoff: Number(lowest.value.toFixed(4)),
    averageCutoff: Number(averageCutoff.toFixed(4)),
    yoyChange,
    yoyPreviousYear: previous ? previous.year : null,
    standardDeviation: Number(standardDeviation.toFixed(4)),
    range: Number((highest.value - lowest.value).toFixed(4)),
    isNQC: false,
    availableDataPoints: validSeries.length,
  };
}

export function getAll25DistrictsSnapshotByYear(admissionYear: string): {
  rows: DistrictLatestRow[];
  nationalMean: number;
  nationalMedian: number;
  highest: DistrictLatestRow;
  lowest: DistrictLatestRow;
  nqcCount: number;
  verifiedNumericCount: number;
  unverifiedCount: number;
  latestYear: string;
  alExamYear: string;
  verificationStatus: string;
} {
  const targetIdx = HISTORICAL_CUTOFFS.findIndex((r) => r.admissionYear === admissionYear);
  const resolvedIdx = targetIdx >= 0 ? targetIdx : HISTORICAL_CUTOFFS.length - 1;
  const targetRecord = HISTORICAL_CUTOFFS[resolvedIdx];
  const prevRecord = resolvedIdx > 0 ? HISTORICAL_CUTOFFS[resolvedIdx - 1] : null;
  const meta = SOURCE_METADATA.find((s) => s.admissionYear === targetRecord.admissionYear);

  const numericEntries = DISTRICT_REGISTRY.map((d) => ({
    id: d.id,
    val: targetRecord.cutoffs[d.id],
  })).filter((item): item is { id: DistrictId; val: number } => item.val !== null);

  const nationalMean =
    numericEntries.length > 0
      ? numericEntries.reduce((sum, e) => sum + e.val, 0) / numericEntries.length
      : 0;
  const nationalMedian = computeMedian(numericEntries.map((e) => e.val)) ?? nationalMean;

  const sortedNumeric = [...numericEntries].sort((a, b) => b.val - a.val);
  const rankMap = new Map<DistrictId, number>();
  sortedNumeric.forEach((item, idx) => {
    rankMap.set(item.id, idx + 1);
  });

  const rows: DistrictLatestRow[] = DISTRICT_REGISTRY.map((district) => {
    const val = targetRecord.cutoffs[district.id];
    const isNQC = isDistrictNQCInRecord(targetRecord, district.id);
    const isUnverified = val === null && !isNQC;
    const prevVal = prevRecord ? prevRecord.cutoffs[district.id] : null;
    const yoyDelta =
      val !== null && prevVal !== null ? Number((val - prevVal).toFixed(4)) : null;
    const historyCount = HISTORICAL_CUTOFFS.filter(
      (r) => r.cutoffs[district.id] !== null
    ).length;

    return {
      district,
      latestCutoff: val,
      isNQC,
      isUnverified,
      diffFromNationalMean:
        val !== null && numericEntries.length > 0
          ? Number((val - nationalMean).toFixed(4))
          : null,
      yoyDelta,
      previousYear: prevRecord ? prevRecord.admissionYear : null,
      rank: rankMap.get(district.id) ?? null,
      historyCount,
    };
  });

  const numericRows = rows.filter((r) => r.latestCutoff !== null);
  const highest =
    numericRows.length > 0
      ? numericRows.reduce((a, b) =>
          (a.latestCutoff ?? 0) >= (b.latestCutoff ?? 0) ? a : b
        )
      : rows[0];
  const lowest =
    numericRows.length > 0
      ? numericRows.reduce((a, b) =>
          (a.latestCutoff ?? 99) <= (b.latestCutoff ?? 99) ? a : b
        )
      : rows[0];

  return {
    rows,
    nationalMean: Number(nationalMean.toFixed(4)),
    nationalMedian: Number(nationalMedian.toFixed(4)),
    highest,
    lowest,
    nqcCount: rows.filter((r) => r.isNQC).length,
    verifiedNumericCount: numericRows.length,
    unverifiedCount: rows.filter((r) => r.isUnverified).length,
    latestYear: targetRecord.admissionYear,
    alExamYear: meta?.alExamYear ?? targetRecord.admissionYear.slice(0, 4),
    verificationStatus: meta?.verificationStatus ?? 'Verified Subset',
  };
}

export function getAll25DistrictsLatestSnapshot() {
  const latestYear = HISTORICAL_CUTOFFS[HISTORICAL_CUTOFFS.length - 1].admissionYear;
  return getAll25DistrictsSnapshotByYear(latestYear);
}

/**
 * Mode 2: Complete District Historical Timeline & Descriptive Statistics
 */
export function computeDistrictTimeline(
  districtId: DistrictId,
  records: AdmissionRecord[]
): DistrictTimelineSummary {
  const district = DISTRICT_MAP[districtId];
  let prevNumeric: number | null = null;

  const points: DistrictTimelinePoint[] = records.map((rec) => {
    const val = rec.cutoffs[districtId];
    const isNQC = isDistrictNQCInRecord(rec, districtId);

    let absChange: number | null = null;
    let pctChange: number | null = null;

    if (val !== null && prevNumeric !== null) {
      absChange = Number((val - prevNumeric).toFixed(4));
      pctChange = Number((((val - prevNumeric) / prevNumeric) * 100).toFixed(2));
    }

    if (val !== null) {
      prevNumeric = val;
    }

    return {
      admissionYear: rec.admissionYear,
      cutoff: val,
      isNQC,
      absChange,
      pctChange,
    };
  });

  const numericPoints = points.filter(
    (p): p is DistrictTimelinePoint & { cutoff: number } => p.cutoff !== null
  );

  if (numericPoints.length === 0) {
    return {
      district,
      points,
      numericCount: 0,
      highestYear: null,
      highestCutoff: null,
      lowestYear: null,
      lowestCutoff: null,
      average: null,
      median: null,
      overallChange: null,
      overallTrendLabel: 'No Numeric Data',
      largestIncrease: null,
      largestDecrease: null,
    };
  }

  let high = numericPoints[0];
  let low = numericPoints[0];
  let sum = 0;

  for (const p of numericPoints) {
    sum += p.cutoff;
    if (p.cutoff > high.cutoff) high = p;
    if (p.cutoff < low.cutoff) low = p;
  }

  const average = Number((sum / numericPoints.length).toFixed(4));
  const median = computeMedian(numericPoints.map((p) => p.cutoff));

  let overallChange: number | null = null;
  let overallTrendLabel: DistrictTimelineSummary['overallTrendLabel'] = 'Single Cycle';

  if (numericPoints.length >= 2) {
    overallChange = Number(
      (numericPoints[numericPoints.length - 1].cutoff - numericPoints[0].cutoff).toFixed(4)
    );
    overallTrendLabel =
      overallChange < -0.0005
        ? 'Downward Trend'
        : overallChange > 0.0005
          ? 'Upward Trend'
          : 'Unchanged';
  }

  let largestIncrease: DistrictTimelineSummary['largestIncrease'] = null;
  let largestDecrease: DistrictTimelineSummary['largestDecrease'] = null;

  for (let i = 1; i < numericPoints.length; i++) {
    const delta = Number((numericPoints[i].cutoff - numericPoints[i - 1].cutoff).toFixed(4));
    if (delta > 0 && (!largestIncrease || delta > largestIncrease.delta)) {
      largestIncrease = {
        year: numericPoints[i].admissionYear,
        prevYear: numericPoints[i - 1].admissionYear,
        delta,
      };
    }
    if (delta < 0 && (!largestDecrease || delta < largestDecrease.delta)) {
      largestDecrease = {
        year: numericPoints[i].admissionYear,
        prevYear: numericPoints[i - 1].admissionYear,
        delta,
      };
    }
  }

  return {
    district,
    points,
    numericCount: numericPoints.length,
    highestYear: high.admissionYear,
    highestCutoff: high.cutoff,
    lowestYear: low.admissionYear,
    lowestCutoff: low.cutoff,
    average,
    median,
    overallChange,
    overallTrendLabel,
    largestIncrease,
    largestDecrease,
  };
}

/**
 * Mode 3: Year-by-Year National Comparison & Distribution
 */
export function computeYearDistribution(year: string, records: AdmissionRecord[]) {
  const rec = records.find((r) => r.admissionYear === year);
  if (!rec) return null;

  const numericVals = DISTRICT_REGISTRY.map((d) => ({
    district: d,
    cutoff: rec.cutoffs[d.id],
  })).filter((x): x is { district: typeof DISTRICT_REGISTRY[number]; cutoff: number } => x.cutoff !== null);

  const sortedDesc = [...numericVals].sort((a, b) => b.cutoff - a.cutoff);
  const rankMap = new Map<DistrictId, number>();
  sortedDesc.forEach((item, idx) => rankMap.set(item.district.id, idx + 1));

  const mean =
    numericVals.length > 0
      ? Number(
          (numericVals.reduce((s, x) => s + x.cutoff, 0) / numericVals.length).toFixed(4)
        )
      : null;
  const median = computeMedian(numericVals.map((x) => x.cutoff));

  const items = DISTRICT_REGISTRY.map((d) => {
    const val = rec.cutoffs[d.id];
    const isNQC = isDistrictNQCInRecord(rec, d.id);
    return {
      district: d,
      cutoff: val,
      isNQC,
      isUnverified: val === null && !isNQC,
      rank: rankMap.get(d.id) ?? null,
      diffFromMean: val !== null && mean !== null ? Number((val - mean).toFixed(4)) : null,
    };
  });

  return {
    admissionYear: year,
    items,
    verifiedNumericCount: numericVals.length,
    nqcCount: items.filter((i) => i.isNQC).length,
    unverifiedCount: items.filter((i) => i.isUnverified).length,
    mean,
    median,
    min: sortedDesc.length > 0 ? sortedDesc[sortedDesc.length - 1].cutoff : null,
    max: sortedDesc.length > 0 ? sortedDesc[0].cutoff : null,
  };
}

/**
 * Mode 4: District Ranking Evolution (Bump Chart & Movement Statistics)
 */
export function computeRankingEvolution(records: AdmissionRecord[]) {
  // Compute dense rank within each year across districts with numeric data
  const yearRanks: Record<string, Map<DistrictId, number>> = {};

  for (const rec of records) {
    const entries = DISTRICT_REGISTRY.map((d) => ({
      id: d.id,
      val: rec.cutoffs[d.id],
    }))
      .filter((e): e is { id: DistrictId; val: number } => e.val !== null)
      .sort((a, b) => b.val - a.val);

    const map = new Map<DistrictId, number>();
    entries.forEach((e, idx) => {
      map.set(e.id, idx + 1);
    });
    yearRanks[rec.admissionYear] = map;
  }

  // Identify districts with >= 2 verified years for longitudinal bump tracking
  const multiYearDistricts = DISTRICT_REGISTRY.filter((d) => {
    const count = records.filter((r) => r.cutoffs[d.id] !== null).length;
    return count >= 2;
  });

  // Compute longitudinal ranks strictly among multi-year cohort (so rank scales stay consistent 1..N across years)
  // AND also store full-cohort rank per year for exact accuracy
  const bumpRows = records.map((rec) => {
    const row: Record<string, string | number | null> = {
      admissionYear: rec.admissionYear,
    };
    const multiEntries = multiYearDistricts
      .map((d) => ({ id: d.id, val: rec.cutoffs[d.id] }))
      .filter((e): e is { id: DistrictId; val: number } => e.val !== null)
      .sort((a, b) => b.val - a.val);

    multiEntries.forEach((e, idx) => {
      row[e.id] = idx + 1;
      row[`${e.id}_cutoff`] = e.val;
    });

    for (const d of multiYearDistricts) {
      if (row[d.id] === undefined) {
        row[d.id] = null;
      }
    }
    return row;
  });

  const summaries = multiYearDistricts.map((d) => {
    const rankHistory = records
      .map((r) => {
        const rank = bumpRows.find((b) => b.admissionYear === r.admissionYear)?.[d.id];
        return typeof rank === 'number'
          ? { year: r.admissionYear, rank, cutoff: r.cutoffs[d.id] as number }
          : null;
      })
      .filter((x): x is { year: string; rank: number; cutoff: number } => x !== null);

    const first = rankHistory[0];
    const last = rankHistory[rankHistory.length - 1];
    // Positive netRankGain means moved closer to #1 (e.g., #6 -> #2 = +4)
    const netRankGain = first && last ? first.rank - last.rank : 0;
    const avgRank =
      rankHistory.length > 0
        ? Number(
            (rankHistory.reduce((s, x) => s + x.rank, 0) / rankHistory.length).toFixed(2)
          )
        : 99;

    return {
      district: d,
      rankHistory,
      firstRank: first?.rank ?? null,
      firstYear: first?.year ?? null,
      latestRank: last?.rank ?? null,
      latestYear: last?.year ?? null,
      fullCohortLatestRank: yearRanks[records[records.length - 1].admissionYear]?.get(d.id) ?? null,
      netRankGain,
      avgRank,
    };
  });

  const sortedByGain = [...summaries].sort((a, b) => b.netRankGain - a.netRankGain);
  const sortedByAvgRank = [...summaries].sort((a, b) => a.avgRank - b.avgRank);

  return {
    multiYearDistricts,
    bumpRows,
    summaries,
    biggestRiser: sortedByGain[0] ?? null,
    biggestDecliner: sortedByGain[sortedByGain.length - 1] ?? null,
    mostConsistentlyHigh: sortedByAvgRank.slice(0, 3),
    mostConsistentlyLow: [...sortedByAvgRank].reverse().slice(0, 3),
  };
}

/**
 * Mode 5: Cutoff Volatility Analysis
 */
export function computeVolatilityAnalysis(records: AdmissionRecord[]): {
  metrics: VolatilityDistrictMetrics[];
  meanCutoffAll: number;
  meanStdDevAll: number;
  singleYearDistricts: typeof DISTRICT_REGISTRY;
} {
  const rawList: Array<Omit<VolatilityDistrictMetrics, 'volatilityRank' | 'quadrant'>> = [];
  const singleYearDistricts: typeof DISTRICT_REGISTRY = [];

  for (const d of DISTRICT_REGISTRY) {
    const series = records
      .map((r) => r.cutoffs[d.id])
      .filter((v): v is number => v !== null);

    if (series.length < 2) {
      singleYearDistricts.push(d);
      continue;
    }

    const avg = series.reduce((s, v) => s + v, 0) / series.length;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min;
    const variance = series.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / series.length;
    const stdDev = Math.sqrt(variance);

    const yoyDeltas: number[] = [];
    for (let i = 1; i < series.length; i++) {
      yoyDeltas.push(series[i] - series[i - 1]);
    }
    const meanAbsYoY =
      yoyDeltas.reduce((s, delta) => s + Math.abs(delta), 0) / Math.max(1, yoyDeltas.length);

    const posDeltas = yoyDeltas.filter((x) => x > 0);
    const negDeltas = yoyDeltas.filter((x) => x < 0);

    rawList.push({
      district: d,
      yearsCount: series.length,
      averageCutoff: Number(avg.toFixed(4)),
      range: Number(range.toFixed(4)),
      standardDeviation: Number(stdDev.toFixed(4)),
      meanAbsYoY: Number(meanAbsYoY.toFixed(4)),
      largestIncrease: posDeltas.length > 0 ? Number(Math.max(...posDeltas).toFixed(4)) : null,
      largestDecrease: negDeltas.length > 0 ? Number(Math.min(...negDeltas).toFixed(4)) : null,
    });
  }

  const meanCutoffAll =
    rawList.length > 0
      ? Number(
          (rawList.reduce((s, m) => s + m.averageCutoff, 0) / rawList.length).toFixed(4)
        )
      : 2.08;
  const meanStdDevAll =
    rawList.length > 0
      ? Number(
          (rawList.reduce((s, m) => s + m.standardDeviation, 0) / rawList.length).toFixed(4)
        )
      : 0.03;

  const sortedByVol = [...rawList].sort((a, b) => b.standardDeviation - a.standardDeviation);
  const metrics: VolatilityDistrictMetrics[] = sortedByVol.map((m, idx) => {
    const highCutoff = m.averageCutoff >= meanCutoffAll;
    const highVol = m.standardDeviation >= meanStdDevAll;
    const quadrant: VolatilityDistrictMetrics['quadrant'] = highCutoff
      ? highVol
        ? 'High Cutoff · Volatile'
        : 'High Cutoff · Stable'
      : highVol
        ? 'Lower Cutoff · Volatile'
        : 'Lower Cutoff · Stable';

    return {
      ...m,
      volatilityRank: idx + 1,
      quadrant,
    };
  });

  return {
    metrics,
    meanCutoffAll,
    meanStdDevAll,
    singleYearDistricts,
  };
}

/**
 * Mode 6: District Gap Analysis
 */
export function computeGapAnalysis(
  districtAId: DistrictId,
  districtBId: DistrictId,
  records: AdmissionRecord[]
): GapAnalysisSummary {
  const districtA = DISTRICT_MAP[districtAId];
  const districtB = DISTRICT_MAP[districtBId];

  let prevAbsDiff: number | null = null;
  let prevHigher: DistrictId | 'tie' | null = null;

  const widenedYears: string[] = [];
  const narrowedYears: string[] = [];
  const crossoverYears: string[] = [];

  const points: GapAnalysisPoint[] = records.map((rec) => {
    const valA = rec.cutoffs[districtAId];
    const valB = rec.cutoffs[districtBId];
    const diff = valA !== null && valB !== null ? Number((valA - valB).toFixed(4)) : null;
    const absDiff = diff !== null ? Number(Math.abs(diff).toFixed(4)) : null;
    const higher: DistrictId | 'tie' | null =
      diff === null ? null : diff > 0 ? districtAId : diff < 0 ? districtBId : 'tie';

    let gapChangeFromPrev: GapAnalysisPoint['gapChangeFromPrev'] = null;
    if (absDiff !== null && prevAbsDiff !== null) {
      if (absDiff > prevAbsDiff + 0.00005) {
        gapChangeFromPrev = 'Widened';
        widenedYears.push(rec.admissionYear);
      } else if (absDiff < prevAbsDiff - 0.00005) {
        gapChangeFromPrev = 'Narrowed';
        narrowedYears.push(rec.admissionYear);
      } else {
        gapChangeFromPrev = 'Unchanged';
      }
    }

    if (
      higher !== null &&
      higher !== 'tie' &&
      prevHigher !== null &&
      prevHigher !== 'tie' &&
      higher !== prevHigher
    ) {
      crossoverYears.push(rec.admissionYear);
    }

    if (absDiff !== null) prevAbsDiff = absDiff;
    if (higher !== null && higher !== 'tie') prevHigher = higher;

    return {
      admissionYear: rec.admissionYear,
      valA,
      valB,
      diff,
      absDiff,
      gapChangeFromPrev,
      higher,
    };
  });

  const paired = points.filter((p) => p.diff !== null && p.absDiff !== null);
  const averageDiff =
    paired.length > 0
      ? Number((paired.reduce((s, p) => s + (p.diff as number), 0) / paired.length).toFixed(4))
      : null;
  const averageAbsDiff =
    paired.length > 0
      ? Number(
          (paired.reduce((s, p) => s + (p.absDiff as number), 0) / paired.length).toFixed(4)
        )
      : null;

  let maxAbsDiff: GapAnalysisSummary['maxAbsDiff'] = null;
  let minAbsDiff: GapAnalysisSummary['minAbsDiff'] = null;

  for (const p of paired) {
    const abs = p.absDiff as number;
    if (!maxAbsDiff || abs > maxAbsDiff.value) {
      maxAbsDiff = { value: abs, year: p.admissionYear };
    }
    if (!minAbsDiff || abs < minAbsDiff.value) {
      minAbsDiff = { value: abs, year: p.admissionYear };
    }
  }

  return {
    districtA,
    districtB,
    points,
    pairedCount: paired.length,
    averageDiff,
    averageAbsDiff,
    maxAbsDiff,
    minAbsDiff,
    widenedYears,
    narrowedYears,
    hasCrossover: crossoverYears.length > 0,
    crossoverYears,
  };
}

/**
 * Mode 1 & Section 8: National Trend & Change Analysis across all districts per year
 */
export function computeNationalTrendSummary(records: AdmissionRecord[]): NationalYearSummary[] {
  let prevMedian: number | null = null;

  return records.map((rec, idx) => {
    const prevRec = idx > 0 ? records[idx - 1] : null;
    const vals = DISTRICT_REGISTRY.map((d) => rec.cutoffs[d.id]).filter(
      (v): v is number => v !== null
    );
    const nqcCount = rec.nqcDistricts?.length ?? 0;
    const mean =
      vals.length > 0
        ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(4))
        : 0;
    const median = computeMedian(vals) ?? 0;
    const min = vals.length > 0 ? Math.min(...vals) : 0;
    const max = vals.length > 0 ? Math.max(...vals) : 0;
    const range = Number((max - min).toFixed(4));

    let increasedCount = 0;
    let decreasedCount = 0;
    let unchangedCount = 0;

    if (prevRec) {
      for (const d of DISTRICT_REGISTRY) {
        const currVal = rec.cutoffs[d.id];
        const prevVal = prevRec.cutoffs[d.id];
        if (currVal !== null && prevVal !== null) {
          if (currVal > prevVal + 0.00005) increasedCount++;
          else if (currVal < prevVal - 0.00005) decreasedCount++;
          else unchangedCount++;
        }
      }
    }

    const medianYoYChange =
      prevMedian !== null ? Number((median - prevMedian).toFixed(4)) : null;
    prevMedian = median;

    return {
      admissionYear: rec.admissionYear,
      verifiedCount: vals.length,
      nqcCount,
      mean,
      median,
      min,
      max,
      range,
      increasedCount,
      decreasedCount,
      unchangedCount,
      medianYoYChange,
    };
  });
}

export function generateDeterministicInsights(
  records: AdmissionRecord[],
  filter: DistrictFilter
): DeterministicInsight[] {
  if (records.length === 0) return [];

  const stats = computeSummaryStats(records, filter);
  if (!stats) return [];

  if (stats.availableDataPoints === 0) {
    return [
      {
        id: 'nqc-notice',
        category: 'dominance',
        title: `${filter === 'all' ? 'Selected Scope' : DISTRICT_MAP[filter].name} Status`,
        metricValue: 'NQC (No Qualified Candidates)',
        explanation: `In the ${stats.latestYear} UGC Course 008 release, ${
          filter === 'all' ? 'this scope' : DISTRICT_MAP[filter].name
        } was recorded as NQC (No Qualified Candidates).`,
        tone: 'neutral',
      },
    ];
  }

  const scopeLabel =
    filter === 'all' ? 'Cross-District Mean' : `${DISTRICT_MAP[filter].name} District`;

  const insights: DeterministicInsight[] = [];

  if (stats.highestCutoff !== null && stats.averageCutoff !== null) {
    insights.push({
      id: 'peak-year',
      category: 'peak',
      title: `Highest Cutoff Year (${scopeLabel})`,
      metricValue: `${stats.highestYear} · ${formatZScore(stats.highestCutoff)}`,
      explanation: `In ${stats.highestYear}, the ${scopeLabel.toLowerCase()} reached its observed peak of ${formatZScore(
        stats.highestCutoff
      )} (${formatSignedZScore(stats.highestCutoff - stats.averageCutoff)} vs period mean).`,
      tone: 'warning',
    });
  }

  if (stats.lowestCutoff !== null && stats.highestCutoff !== null) {
    insights.push({
      id: 'lowest-year',
      category: 'trough',
      title: `Lowest Cutoff Year (${scopeLabel})`,
      metricValue: `${stats.lowestYear} · ${formatZScore(stats.lowestCutoff)}`,
      explanation: `The lowest observed threshold occurred in ${stats.lowestYear} at ${formatZScore(
        stats.lowestCutoff
      )}, sitting ${formatZScore(stats.highestCutoff - stats.lowestCutoff)} below the period peak.`,
      tone: 'positive',
    });
  }

  const validPoints = records
    .map((r) => ({ year: r.admissionYear, val: getRecordMetric(r, filter) }))
    .filter((p): p is { year: string; val: number } => p.val !== null);

  if (validPoints.length >= 2) {
    let largestDrop = { year: '', prevYear: '', delta: 0 };
    let largestRise = { year: '', prevYear: '', delta: 0 };

    for (let i = 1; i < validPoints.length; i++) {
      const delta = Number((validPoints[i].val - validPoints[i - 1].val).toFixed(4));
      if (delta < largestDrop.delta) {
        largestDrop = {
          year: validPoints[i].year,
          prevYear: validPoints[i - 1].year,
          delta,
        };
      }
      if (delta > largestRise.delta) {
        largestRise = {
          year: validPoints[i].year,
          prevYear: validPoints[i - 1].year,
          delta,
        };
      }
    }

    if (largestDrop.delta < 0) {
      insights.push({
        id: 'largest-drop',
        category: 'delta',
        title: 'Largest Year-over-Year Decrease',
        metricValue: `${formatSignedZScore(largestDrop.delta)} (${largestDrop.prevYear} → ${largestDrop.year})`,
        explanation: `The steepest downward adjustment occurred between ${largestDrop.prevYear} and ${largestDrop.year}, easing by ${formatZScore(
          Math.abs(largestDrop.delta)
        )} Z-score units.`,
        tone: 'positive',
      });
    } else if (largestRise.delta > 0) {
      insights.push({
        id: 'largest-rise',
        category: 'delta',
        title: 'Largest Year-over-Year Increase',
        metricValue: `${formatSignedZScore(largestRise.delta)} (${largestRise.prevYear} → ${largestRise.year})`,
        explanation: `No net year-over-year decrease occurred in the selected period; the sharpest upward shift was ${formatSignedZScore(
          largestRise.delta
        )} into ${largestRise.year}.`,
        tone: 'warning',
      });
    }
  }

  if (stats.standardDeviation !== null && stats.range !== null && stats.averageCutoff !== null) {
    insights.push({
      id: 'volatility',
      category: 'volatility',
      title: 'Historical Dispersion & Volatility',
      metricValue: `σ = ${formatZScore(stats.standardDeviation)} · Range ${formatZScore(stats.range)}`,
      explanation: `Across ${stats.availableDataPoints} recorded cycle${
        stats.availableDataPoints > 1 ? 's' : ''
      }, values fluctuated within a ${formatZScore(stats.range)} band around a mean of ${formatZScore(
        stats.averageCutoff
      )}.`,
      tone: 'accent',
    });
  }

  const snapshot = getAll25DistrictsLatestSnapshot();
  insights.push({
    id: 'national-spread',
    category: 'dominance',
    title: `All-25-District Spread (${snapshot.latestYear})`,
    metricValue: `${snapshot.lowest.district.name} (${formatZScore(snapshot.lowest.latestCutoff)}) – ${snapshot.highest.district.name} (${formatZScore(snapshot.highest.latestCutoff)})`,
    explanation: `Across all 23 numeric districts in ${snapshot.latestYear} (with ${snapshot.nqcCount} NQC), the national district mean is ${formatZScore(
      snapshot.nationalMean
    )}.`,
    tone: 'neutral',
  });

  if (validPoints.length >= 2) {
    const firstVal = validPoints[0].val;
    const lastVal = validPoints[validPoints.length - 1].val;
    const netDelta = Number((lastVal - firstVal).toFixed(4));

    insights.push({
      id: 'net-trajectory',
      category: 'trajectory',
      title: `Net Period Shift (${validPoints[0].year} → ${validPoints[validPoints.length - 1].year})`,
      metricValue: formatSignedZScore(netDelta),
      explanation: `Comparing the start and end of the available window, the cutoff shifted by ${formatSignedZScore(
        netDelta
      )} from ${formatZScore(firstVal)} to ${formatZScore(lastVal)}.`,
      tone: netDelta <= 0 ? 'positive' : 'warning',
    });
  }

  return insights;
}

export function compareTwoDistricts(
  records: AdmissionRecord[],
  districtA: DistrictId,
  districtB: DistrictId
) {
  const metaA = DISTRICT_MAP[districtA];
  const metaB = DISTRICT_MAP[districtB];

  const rows = records.map((r) => {
    const valA = r.cutoffs[districtA] ?? null;
    const valB = r.cutoffs[districtB] ?? null;
    const diff = valA !== null && valB !== null ? Number((valA - valB).toFixed(4)) : null;
    return {
      admissionYear: r.admissionYear,
      valA,
      valB,
      diff,
      absDiff: diff !== null ? Number(Math.abs(diff).toFixed(4)) : null,
      higher:
        diff === null
          ? ('incomplete' as const)
          : diff > 0
            ? districtA
            : diff < 0
              ? districtB
              : ('tie' as const),
    };
  });

  const validA = rows.map((r) => r.valA).filter((v): v is number => v !== null);
  const validB = rows.map((r) => r.valB).filter((v): v is number => v !== null);
  const pairedRows = rows.filter((r) => r.diff !== null);

  const avgA =
    validA.length > 0
      ? Number((validA.reduce((s, v) => s + v, 0) / validA.length).toFixed(4))
      : null;
  const avgB =
    validB.length > 0
      ? Number((validB.reduce((s, v) => s + v, 0) / validB.length).toFixed(4))
      : null;

  const winsA = pairedRows.filter((r) => r.higher === districtA).length;
  const winsB = pairedRows.filter((r) => r.higher === districtB).length;
  const ties = pairedRows.filter((r) => r.higher === 'tie').length;

  const latestRecord = records[records.length - 1];

  const ranking = DISTRICT_REGISTRY.map((d) => {
    const vals = records.map((r) => r.cutoffs[d.id]).filter((v): v is number => v !== null);
    const mean =
      vals.length > 0
        ? Number((vals.reduce((sum, v) => sum + v, 0) / vals.length).toFixed(4))
        : null;
    const latest = latestRecord ? (latestRecord.cutoffs[d.id] ?? null) : null;
    return {
      district: d,
      mean,
      latest,
      yearsCount: vals.length,
    };
  }).sort((a, b) => {
    if (a.latest === null && b.latest === null) return 0;
    if (a.latest === null) return 1;
    if (b.latest === null) return -1;
    return b.latest - a.latest;
  });

  return {
    metaA,
    metaB,
    rows,
    pairedCount: pairedRows.length,
    avgA,
    avgB,
    avgDiff: avgA !== null && avgB !== null ? Number((avgA - avgB).toFixed(4)) : null,
    winsA,
    winsB,
    ties,
    ranking,
  };
}

export function exportCutoffsToCSV(rows: EnrichedAdmissionRow[]): void {
  const headers = [
    'Admission Year',
    'Badulla',
    'Badulla YoY',
    'Anuradhapura',
    'Anuradhapura YoY',
    'Colombo',
    'Kandy',
    'Galle',
    'Kurunegala',
    'Inter-District Spread (Badulla vs Anuradhapura)',
  ];

  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${r.admissionYear}"`,
        formatZScore(r.badulla),
        r.badullaYoY !== null ? formatSignedZScore(r.badullaYoY) : 'N/A',
        formatZScore(r.anuradhapura),
        r.anuradhapuraYoY !== null ? formatSignedZScore(r.anuradhapuraYoY) : 'N/A',
        formatZScore(r.colombo),
        formatZScore(r.kandy),
        formatZScore(r.galle),
        formatZScore(r.kurunegala),
        formatZScore(r.spread),
      ].join(',')
    ),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'uom-engineering-historical-cutoffs.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAll25DistrictsCSV(rows: DistrictLatestRow[], yearLabel: string): void {
  const headers = [
    `Rank (${yearLabel})`,
    'District',
    'Province',
    `Cutoff Z-Score (${yearLabel})`,
    'YoY Change',
    'Diff vs National Mean',
    'Multi-Year Cycles Loaded',
  ];

  const csvLines = [
    headers.join(','),
    ...rows.map((r) => {
      const missingLabel = r.isNQC ? 'NQC' : 'Unverified';
      return [
        r.rank !== null ? `#${r.rank}` : missingLabel,
        `"${r.district.name}"`,
        `"${r.district.province}"`,
        r.latestCutoff !== null ? formatZScore(r.latestCutoff) : missingLabel,
        r.yoyDelta !== null && r.yoyDelta !== undefined ? formatSignedZScore(r.yoyDelta) : 'N/A',
        r.diffFromNationalMean !== null
          ? formatSignedZScore(r.diffFromNationalMean)
          : missingLabel,
        r.historyCount,
      ].join(',');
    }),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `uom-engineering-all-25-districts-${yearLabel.replace('/', '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
