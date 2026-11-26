import { AlertCircle, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DISTRICT_MAP,
  DISTRICT_REGISTRY,
  HISTORICAL_CUTOFFS,
  PROVINCES,
} from '../data/cutoffs';
import { DistrictFilter, DistrictId } from '../types/admission';

interface DashboardHeaderProps {
  selectedDistrict: DistrictFilter;
  onSelectDistrict: (district: DistrictFilter) => void;
  startYear: string;
  endYear: string;
  onChangePeriod: (startYear: string, endYear: string) => void;
  sectionTitle?: string;
}

const QUICK_DISTRICTS: DistrictId[] = ['badulla', 'anuradhapura', 'colombo', 'kandy', 'galle'];

export function DashboardHeader({
  selectedDistrict,
  onSelectDistrict,
  startYear,
  endYear,
  onChangePeriod,
  sectionTitle,
}: DashboardHeaderProps) {
  const allYears = HISTORICAL_CUTOFFS.map((r) => r.admissionYear);
  const startIndex = allYears.indexOf(startYear);
  const endIndex = allYears.indexOf(endYear);

  const selectedDistrictLabel =
    selectedDistrict === 'all'
      ? 'All 25 Districts (National Overview)'
      : `${DISTRICT_MAP[selectedDistrict].name} District (${DISTRICT_MAP[selectedDistrict].province})`;

  const handleStartChange = (newStart: string) => {
    const newStartIdx = allYears.indexOf(newStart);
    if (newStartIdx > endIndex) {
      onChangePeriod(newStart, newStart);
    } else {
      onChangePeriod(newStart, endYear);
    }
  };

  const handleEndChange = (newEnd: string) => {
    const newEndIdx = allYears.indexOf(newEnd);
    if (newEndIdx < startIndex) {
      onChangePeriod(newEnd, newEnd);
    } else {
      onChangePeriod(startYear, newEnd);
    }
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#080B14]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Top Context Row */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <span className="font-medium text-blue-400">University of Moratuwa Engineering</span>
              <span aria-hidden="true">·</span>
              <span>Sri Lanka A/L Physical Science</span>
              <span aria-hidden="true">·</span>
              <span>Historical Admission Analytics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-50 text-balance">
              {sectionTitle || 'Historical Cutoff Z-Score Analytics'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Selected District:{' '}
                  <strong className="font-medium text-slate-200">{selectedDistrictLabel}</strong>
                </span>
              </span>
              <span aria-hidden="true" className="text-slate-600">
                /
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Admission Period:{' '}
                  <strong className="font-mono font-medium text-slate-200">
                    {startYear === endYear ? startYear : `${startYear} – ${endYear}`}
                  </strong>
                </span>
              </span>
            </div>
          </div>

          {/* Interactive Global Filters */}
          <div className="flex flex-col gap-2.5 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              {/* All 25 Districts Grouped Dropdown */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-white/[0.08] text-xs">
                <label htmlFor="global-district-select" className="text-slate-400 whitespace-nowrap">
                  District
                </label>
                <select
                  id="global-district-select"
                  value={selectedDistrict}
                  onChange={(e) => onSelectDistrict(e.target.value as DistrictFilter)}
                  className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#111827] text-slate-100">
                    All 25 Districts
                  </option>
                  {PROVINCES.map((prov) => (
                    <optgroup key={prov} label={prov} className="bg-[#0B101D] text-slate-400">
                      {DISTRICT_REGISTRY.filter((d) => d.province === prov).map((d) => (
                        <option
                          key={d.id}
                          value={d.id}
                          className="bg-[#111827] text-slate-100"
                        >
                          {d.name}
                          {d.latestStatus === 'NQC' ? ' (NQC)' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Period Range Controls */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-white/[0.08] text-xs">
                <label htmlFor="period-start" className="text-slate-400 whitespace-nowrap">
                  Period
                </label>
                <select
                  id="period-start"
                  value={startYear}
                  onChange={(e) => handleStartChange(e.target.value)}
                  aria-label="Admission period start year"
                  className="bg-transparent text-slate-100 font-mono focus:outline-none cursor-pointer"
                >
                  {allYears.map((y) => (
                    <option key={y} value={y} className="bg-[#111827] text-slate-100">
                      {y}
                    </option>
                  ))}
                </select>
                <span className="text-slate-500">to</span>
                <select
                  id="period-end"
                  value={endYear}
                  onChange={(e) => handleEndChange(e.target.value)}
                  aria-label="Admission period end year"
                  className="bg-transparent text-slate-100 font-mono focus:outline-none cursor-pointer"
                >
                  {allYears.map((y) => (
                    <option key={y} value={y} className="bg-[#111827] text-slate-100">
                      {y}
                    </option>
                  ))}
                </select>
                {(startYear !== allYears[0] || endYear !== allYears[allYears.length - 1]) && (
                  <button
                    type="button"
                    onClick={() => onChangePeriod(allYears[0], allYears[allYears.length - 1])}
                    className="ml-1 text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Quick District Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectDistrict('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  selectedDistrict === 'all'
                    ? 'bg-[#182235] text-white border border-blue-500/35'
                    : 'bg-[#111827] text-slate-400 border border-white/[0.06] hover:text-slate-200'
                }`}
              >
                All
              </button>
              {QUICK_DISTRICTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectDistrict(id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                    selectedDistrict === id
                      ? 'bg-[#182235] text-white border border-blue-500/35'
                      : 'bg-[#111827] text-slate-400 border border-white/[0.06] hover:text-slate-200'
                  }`}
                >
                  {DISTRICT_MAP[id].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prototype Verification Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-[#111827]/90 border border-amber-500/20 text-xs text-slate-300">
          <div className="flex items-start sm:items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Includes all 25 Sri Lankan districts for 2025/26 (Course 008) plus multi-year reference series. Cross-verify all Z-scores against official UGC Sri Lanka publications before formal application decisions.
            </span>
          </div>
          <Link
            to="/methodology"
            className="text-amber-300 hover:text-amber-200 font-medium whitespace-nowrap shrink-0 underline underline-offset-4"
          >
            Verification details
          </Link>
        </div>
      </div>
    </header>
  );
}
