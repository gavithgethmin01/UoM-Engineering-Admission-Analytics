import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, Download, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { DISTRICT_MAP, HISTORICAL_CUTOFFS, LATEST_ADMISSION_YEAR, SOURCE_METADATA } from '../data/cutoffs';
import { AdmissionRecord, DistrictLatestRow, EnrichedAdmissionRow } from '../types/admission';
import {
  enrichHistoricalRows,
  exportAll25DistrictsCSV,
  exportCutoffsToCSV,
  formatSignedZScore,
  formatZScore,
  getAll25DistrictsSnapshotByYear,
} from '../utils/analytics';

interface CutoffDataTableProps {
  records: AdmissionRecord[];
}

type TableViewMode = 'all25' | 'historical';
type HistSortField =
  | 'admissionYear'
  | 'badulla'
  | 'anuradhapura'
  | 'colombo'
  | 'kandy'
  | 'galle'
  | 'kurunegala';
type All25SortField = 'rank' | 'name' | 'province' | 'latestCutoff' | 'yoy' | 'diff';
type SortDirection = 'asc' | 'desc';

const AVAILABLE_YEARS_DESC = [...HISTORICAL_CUTOFFS].map((r) => r.admissionYear).reverse();

export function CutoffDataTable({ records }: CutoffDataTableProps) {
  const [viewMode, setViewMode] = useState<TableViewMode>('all25');
  const [selectedAll25Year, setSelectedAll25Year] = useState<string>(LATEST_ADMISSION_YEAR);
  const [onlyVerifiedRows, setOnlyVerifiedRows] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [histSortField, setHistSortField] = useState<HistSortField>('admissionYear');
  const [histSortDir, setHistSortDir] = useState<SortDirection>('desc');

  const [all25SortField, setAll25SortField] = useState<All25SortField>('rank');
  const [all25SortDir, setAll25SortDir] = useState<SortDirection>('asc');

  const snapshot = useMemo(
    () => getAll25DistrictsSnapshotByYear(selectedAll25Year),
    [selectedAll25Year]
  );
  const enriched = useMemo(() => enrichHistoricalRows(records), [records]);

  const extrema = useMemo(() => {
    if (enriched.length === 0) {
      return {
        maxBadulla: -Infinity,
        minBadulla: Infinity,
        maxAnuradhapura: -Infinity,
        minAnuradhapura: Infinity,
      };
    }
    const bVals = enriched.map((r) => r.badulla);
    const aVals = enriched.map((r) => r.anuradhapura);
    return {
      maxBadulla: Math.max(...bVals),
      minBadulla: Math.min(...bVals),
      maxAnuradhapura: Math.max(...aVals),
      minAnuradhapura: Math.min(...aVals),
    };
  }, [enriched]);

  const filteredAll25 = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = snapshot.rows.filter((r) => {
      if (onlyVerifiedRows && r.latestCutoff === null) {
        return false;
      }
      if (!q) return true;
      const statusText = r.isNQC
        ? 'nqc'
        : r.latestCutoff !== null
          ? formatZScore(r.latestCutoff)
          : 'unverified';
      return (
        r.district.name.toLowerCase().includes(q) ||
        r.district.province.toLowerCase().includes(q) ||
        statusText.includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const dir = all25SortDir === 'asc' ? 1 : -1;
      if (all25SortField === 'name') {
        return a.district.name.localeCompare(b.district.name) * dir;
      }
      if (all25SortField === 'province') {
        return a.district.province.localeCompare(b.district.province) * dir;
      }

      // Keep NQC and Unverified rows neatly below ranked numeric rows
      const getMissingBucket = (row: DistrictLatestRow) =>
        row.latestCutoff !== null ? 0 : row.isNQC ? 1 : 2;
      const bucketA = getMissingBucket(a);
      const bucketB = getMissingBucket(b);
      if (bucketA !== bucketB) {
        return bucketA - bucketB;
      }
      if (bucketA !== 0 && bucketB !== 0) {
        return a.district.name.localeCompare(b.district.name);
      }

      if (all25SortField === 'rank') {
        return ((a.rank ?? 999) - (b.rank ?? 999)) * dir;
      }
      if (all25SortField === 'yoy') {
        const ya = a.yoyDelta ?? (all25SortDir === 'asc' ? Infinity : -Infinity);
        const yb = b.yoyDelta ?? (all25SortDir === 'asc' ? Infinity : -Infinity);
        if (ya === yb) return a.district.name.localeCompare(b.district.name);
        return (ya - yb) * dir;
      }
      if (all25SortField === 'diff') {
        const da = a.diffFromNationalMean ?? -999;
        const db = b.diffFromNationalMean ?? -999;
        return (da - db) * dir;
      }
      const va = a.latestCutoff ?? -1;
      const vb = b.latestCutoff ?? -1;
      return (va - vb) * dir;
    });
  }, [snapshot.rows, searchQuery, onlyVerifiedRows, all25SortField, all25SortDir]);

  const filteredHistorical = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = enriched.filter((row) => {
      if (!q) return true;
      return (
        row.admissionYear.toLowerCase().includes(q) ||
        formatZScore(row.badulla).includes(q) ||
        formatZScore(row.anuradhapura).includes(q) ||
        formatZScore(row.colombo).includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const dir = histSortDir === 'asc' ? 1 : -1;
      if (histSortField === 'admissionYear') {
        return a.admissionYear.localeCompare(b.admissionYear) * dir;
      }
      const valA = a[histSortField] ?? -999;
      const valB = b[histSortField] ?? -999;
      return (valA - valB) * dir;
    });
  }, [enriched, searchQuery, histSortField, histSortDir]);

  const toggleAll25Sort = (field: All25SortField) => {
    if (all25SortField === field) {
      setAll25SortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAll25SortField(field);
      setAll25SortDir(field === 'rank' || field === 'name' ? 'asc' : 'desc');
    }
  };

  const toggleHistSort = (field: HistSortField) => {
    if (histSortField === field) {
      setHistSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setHistSortField(field);
      setHistSortDir('desc');
    }
  };

  const renderSortIcon = (active: boolean, dir: SortDirection) => {
    if (!active) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />;
    return dir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  const renderValueMarker = (val: number, min: number, max: number) => {
    if (enriched.length < 2) return null;
    if (val === max) {
      return <span className="ml-1.5 text-[10px] font-sans font-medium text-amber-400">Peak</span>;
    }
    if (val === min) {
      return <span className="ml-1.5 text-[10px] font-sans font-medium text-emerald-400">Low</span>;
    }
    return null;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 sm:p-6 rounded-xl bg-[#111827] border border-white/[0.08] space-y-5"
    >
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight">
            Cutoff Data Tables
          </h2>
          <div className="inline-flex items-center p-1 rounded-lg bg-[#0B101D] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode('all25')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'all25'
                  ? 'bg-[#182235] text-white border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All 25 Districts ({snapshot.latestYear})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('historical')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'historical'
                  ? 'bg-[#182235] text-white border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Multi-Year History (2021/22–2025/26)
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewMode === 'all25'
                  ? 'Search district, province, Z-score...'
                  : 'Search year or Z-score...'
              }
              aria-label="Search table records"
              className="w-full sm:w-64 pl-9 pr-3.5 py-2 rounded-lg bg-[#0B101D] border border-white/[0.1] focus:border-blue-500 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              viewMode === 'all25'
                ? exportAll25DistrictsCSV(filteredAll25, snapshot.latestYear)
                : exportCutoffsToCSV(filteredHistorical)
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#182235] hover:bg-blue-600 border border-white/[0.1] hover:border-blue-500 text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Year Switcher & Snapshot Summary for All 25 Districts View */}
      {viewMode === 'all25' && (
        <div className="space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0B101D] border border-white/[0.07]">
            <div className="flex flex-wrap items-center gap-2.5">
              <label
                htmlFor="all25-year-select"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Admission / A/L Year:
              </label>

              <select
                id="all25-year-select"
                value={selectedAll25Year}
                onChange={(e) => setSelectedAll25Year(e.target.value)}
                className="px-3 py-1.5 rounded-md bg-[#111827] border border-white/[0.12] focus:border-blue-500 focus:outline-none text-xs font-mono text-slate-100"
              >
                {AVAILABLE_YEARS_DESC.map((yr) => {
                  const meta = SOURCE_METADATA.find((s) => s.admissionYear === yr);
                  return (
                    <option key={yr} value={yr}>
                      {yr} ({meta?.alExamYear ?? yr.slice(0, 4)} A/L · {meta?.verifiedDistrictCount ?? 0}/25)
                    </option>
                  );
                })}
              </select>

              <div className="flex flex-wrap items-center gap-1">
                {AVAILABLE_YEARS_DESC.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedAll25Year(yr)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                      selectedAll25Year === yr
                        ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40'
                        : 'bg-[#111827] text-slate-400 border border-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
              <div className="inline-flex items-center p-0.5 rounded-md bg-[#111827] border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setOnlyVerifiedRows(false)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    !onlyVerifiedRows
                      ? 'bg-[#182235] text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All 25
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyVerifiedRows(true)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    onlyVerifiedRows
                      ? 'bg-[#182235] text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Verified Only ({snapshot.verifiedNumericCount})
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400">Selected Cycle</div>
              <div className="font-mono font-semibold text-slate-100 mt-0.5">
                {snapshot.latestYear} ({snapshot.alExamYear} A/L)
              </div>
            </div>
            <div className="px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400">Verified Coverage</div>
              <div className="font-mono font-semibold text-slate-100 mt-0.5">
                {snapshot.verifiedNumericCount} numeric
                {snapshot.nqcCount > 0 ? ` · ${snapshot.nqcCount} NQC` : ''}
                {snapshot.unverifiedCount > 0 ? ` · ${snapshot.unverifiedCount} pending` : ''}
              </div>
            </div>
            <div className="px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400">Mean / Median</div>
              <div className="font-mono font-semibold text-blue-300 mt-0.5 tabular-nums">
                {formatZScore(snapshot.nationalMean)} / {formatZScore(snapshot.nationalMedian)}
              </div>
            </div>
            <div className="px-3.5 py-2.5 rounded-lg bg-[#0B101D] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400">Highest / Lowest</div>
              <div className="font-mono font-semibold text-slate-100 mt-0.5 tabular-nums truncate">
                {snapshot.highest.district.name} ({formatZScore(snapshot.highest.latestCutoff)}) ·{' '}
                {snapshot.lowest.district.name} ({formatZScore(snapshot.lowest.latestCutoff)})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 1: All 25 Districts (Year-Selectable) */}
      {viewMode === 'all25' && (
        <>
          {filteredAll25.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No districts match your search or filter criteria.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                      <th className="py-3 pr-4 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleAll25Sort('rank')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-100"
                        >
                          Rank
                          {renderSortIcon(all25SortField === 'rank', all25SortDir)}
                        </button>
                      </th>
                      <th className="py-3 px-4 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleAll25Sort('name')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-100"
                        >
                          District
                          {renderSortIcon(all25SortField === 'name', all25SortDir)}
                        </button>
                      </th>
                      <th className="py-3 px-4 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleAll25Sort('province')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-100"
                        >
                          Province
                          {renderSortIcon(all25SortField === 'province', all25SortDir)}
                        </button>
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        <button
                          type="button"
                          onClick={() => toggleAll25Sort('latestCutoff')}
                          className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                        >
                          {snapshot.latestYear} Cutoff
                          {renderSortIcon(all25SortField === 'latestCutoff', all25SortDir)}
                        </button>
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        <button
                          type="button"
                          onClick={() => toggleAll25Sort('yoy')}
                          className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                        >
                          YoY Δ
                          {renderSortIcon(all25SortField === 'yoy', all25SortDir)}
                        </button>
                      </th>
                      <th className="py-3 pl-4 font-medium text-right">
                        <button
                          type="button"
                          onClick={() => toggleAll25Sort('diff')}
                          className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                        >
                          vs Year Mean ({formatZScore(snapshot.nationalMean)})
                          {renderSortIcon(all25SortField === 'diff', all25SortDir)}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredAll25.map((row: DistrictLatestRow) => {
                      const isPeak = row.rank === 1;
                      const isLow =
                        row.latestCutoff !== null &&
                        row.latestCutoff === snapshot.lowest.latestCutoff;
                      return (
                        <tr key={row.district.id} className="hover:bg-white/[0.025] h-11">
                          <td className="py-2.5 pr-4 font-mono text-xs text-slate-400">
                            {row.rank !== null ? (
                              `#${row.rank}`
                            ) : row.isNQC ? (
                              <span className="text-amber-400">NQC</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-100">
                            {row.district.name}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-400">
                            {row.district.province}
                          </td>
                          <td className="py-2.5 px-4 font-mono tabular-nums text-right">
                            {row.isNQC ? (
                              <span className="text-amber-400 font-medium">NQC</span>
                            ) : row.latestCutoff === null ? (
                              <span className="text-slate-500 text-xs font-sans">Unverified</span>
                            ) : (
                              <span className="text-blue-300 font-semibold">
                                {formatZScore(row.latestCutoff)}
                                {isPeak && (
                                  <span className="ml-1.5 text-[10px] font-sans text-amber-400">
                                    Highest
                                  </span>
                                )}
                                {isLow && (
                                  <span className="ml-1.5 text-[10px] font-sans text-emerald-400">
                                    Lowest
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-2.5 px-4 font-mono tabular-nums text-right text-xs ${
                              row.yoyDelta === null || row.yoyDelta === undefined
                                ? 'text-slate-500'
                                : row.yoyDelta > 0
                                  ? 'text-amber-400'
                                  : row.yoyDelta < 0
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                            }`}
                          >
                            {row.yoyDelta !== null && row.yoyDelta !== undefined
                              ? formatSignedZScore(row.yoyDelta)
                              : '—'}
                          </td>
                          <td
                            className={`py-2.5 pl-4 font-mono tabular-nums text-right text-xs ${
                              row.diffFromNationalMean === null
                                ? 'text-slate-500'
                                : row.diffFromNationalMean > 0
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                            }`}
                          >
                            {row.diffFromNationalMean !== null
                              ? formatSignedZScore(row.diffFromNationalMean)
                              : row.isNQC
                                ? 'NQC'
                                : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-2.5">
                {filteredAll25.map((row) => (
                  <div
                    key={row.district.id}
                    className="p-3.5 rounded-lg bg-[#0B101D] border border-white/[0.07] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-100">
                        {row.district.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {row.district.province} ·{' '}
                        {row.rank !== null
                          ? `Rank #${row.rank}`
                          : row.isNQC
                            ? 'NQC'
                            : 'Unverified'}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div
                        className={`text-sm font-semibold ${
                          row.isNQC
                            ? 'text-amber-400'
                            : row.latestCutoff === null
                              ? 'text-slate-500 font-sans text-xs'
                              : 'text-blue-300'
                        }`}
                      >
                        {row.isNQC
                          ? 'NQC'
                          : row.latestCutoff !== null
                            ? formatZScore(row.latestCutoff)
                            : 'Unverified'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {row.diffFromNationalMean !== null
                          ? `${formatSignedZScore(row.diffFromNationalMean)} vs mean`
                          : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {snapshot.unverifiedCount > 0 && (
                <p className="text-[11px] text-slate-500">
                  For {snapshot.latestYear} ({snapshot.alExamYear} A/L), {snapshot.verifiedNumericCount} districts have verified Course 008 cutoffs loaded. Remaining districts marked &ldquo;Unverified&rdquo; are left blank rather than interpolated; switch to <button type="button" onClick={() => setSelectedAll25Year(LATEST_ADMISSION_YEAR)} className="text-blue-400 hover:underline">{LATEST_ADMISSION_YEAR}</button> for full 25-district coverage.
                </p>
              )}
            </>
          )}
        </>
      )}

      {/* View 2: Historical Multi-Year Series */}
      {viewMode === 'historical' && (
        <>
          {filteredHistorical.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No historical records match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs text-slate-400">
                    <th className="py-3 pr-4 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleHistSort('admissionYear')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-100"
                      >
                        Year
                        {renderSortIcon(histSortField === 'admissionYear', histSortDir)}
                      </button>
                    </th>
                    <th className="py-3 px-3 font-medium text-right">
                      <button
                        type="button"
                        onClick={() => toggleHistSort('badulla')}
                        className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                      >
                        Badulla
                        {renderSortIcon(histSortField === 'badulla', histSortDir)}
                      </button>
                    </th>
                    <th className="py-3 px-3 font-medium text-right">
                      <button
                        type="button"
                        onClick={() => toggleHistSort('anuradhapura')}
                        className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                      >
                        Anuradhapura
                        {renderSortIcon(histSortField === 'anuradhapura', histSortDir)}
                      </button>
                    </th>
                    <th className="py-3 px-3 font-medium text-right">
                      <button
                        type="button"
                        onClick={() => toggleHistSort('colombo')}
                        className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                      >
                        Colombo
                        {renderSortIcon(histSortField === 'colombo', histSortDir)}
                      </button>
                    </th>
                    <th className="py-3 px-3 font-medium text-right">
                      <button
                        type="button"
                        onClick={() => toggleHistSort('kandy')}
                        className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                      >
                        Kandy
                        {renderSortIcon(histSortField === 'kandy', histSortDir)}
                      </button>
                    </th>
                    <th className="py-3 px-3 font-medium text-right">
                      <button
                        type="button"
                        onClick={() => toggleHistSort('galle')}
                        className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                      >
                        Galle
                        {renderSortIcon(histSortField === 'galle', histSortDir)}
                      </button>
                    </th>
                    <th className="py-3 pl-3 font-medium text-right">
                      <button
                        type="button"
                        onClick={() => toggleHistSort('kurunegala')}
                        className="inline-flex items-center justify-end gap-1.5 hover:text-slate-100 ml-auto"
                      >
                        Kurunegala
                        {renderSortIcon(histSortField === 'kurunegala', histSortDir)}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredHistorical.map((row: EnrichedAdmissionRow) => (
                    <tr key={row.admissionYear} className="hover:bg-white/[0.025] h-11">
                      <td className="py-2.5 pr-4 font-mono font-medium text-slate-100">
                        {row.admissionYear}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-blue-300">
                        {formatZScore(row.badulla)}
                        {renderValueMarker(row.badulla, extrema.minBadulla, extrema.maxBadulla)}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-violet-300">
                        {formatZScore(row.anuradhapura)}
                        {renderValueMarker(
                          row.anuradhapura,
                          extrema.minAnuradhapura,
                          extrema.maxAnuradhapura
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-emerald-300">
                        {formatZScore(row.colombo)}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-amber-300">
                        {formatZScore(row.kandy)}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-pink-300">
                        {formatZScore(row.galle)}
                      </td>
                      <td className="py-2.5 pl-3 font-mono tabular-nums text-right text-sky-300">
                        {formatZScore(row.kurunegala)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-slate-500">
                All 25 districts across {AVAILABLE_YEARS_DESC[AVAILABLE_YEARS_DESC.length - 1]}–{AVAILABLE_YEARS_DESC[0]} are verified from official UGC PDF releases; switch to the All 25 Districts tab and choose any year to inspect full national rankings. Higher-cutoff primary benchmark between Badulla &amp; Anuradhapura is{' '}
                {DISTRICT_MAP.anuradhapura.name} in 5/5 cycles.
              </p>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}
