import {
  BarChart3,
  BookOpen,
  Compass,
  GitCompare,
  Layers,
  LayoutDashboard,
  Menu,
  Table2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/intelligence', label: 'Historical Intelligence', icon: Layers },
  { path: '/trends', label: 'Historical Trends', icon: BarChart3 },
  { path: '/comparison', label: 'District Comparison', icon: GitCompare },
  { path: '/planner', label: 'Z-Score Planner', icon: Compass },
  { path: '/table', label: 'Data Table', icon: Table2 },
  { path: '/methodology', label: 'Methodology', icon: BookOpen },
];

function EngineeringEmblem() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="uomEmblemGrad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect
        x="1.5"
        y="1.5"
        width="33"
        height="33"
        rx="8"
        fill="#111827"
        stroke="url(#uomEmblemGrad)"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <path
        d="M8 26.5C8 17.5 12.2 10.5 18 10.5C23.8 10.5 28 17.5 28 26.5"
        stroke="url(#uomEmblemGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12.5 26.5L18 14L23.5 26.5"
        stroke="#94A3B8"
        strokeOpacity="0.65"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="7" y1="26.5" x2="29" y2="26.5" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="10.5" r="2" fill="#60A5FA" />
    </svg>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[#0B101D] border-r border-white/[0.08]">
        <div className="px-5 py-6 border-b border-white/[0.07]">
          <NavLink to="/" className="flex items-center gap-3 group focus-visible:outline-none">
            <EngineeringEmblem />
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-slate-100 whitespace-nowrap">
                UoM Analytics
              </div>
              <div className="text-xs text-slate-400 truncate">
                Course 008 Intelligence
              </div>
            </div>
          </NavLink>
        </div>

        <nav aria-label="Primary Navigation" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                    isActive
                      ? 'text-slate-50'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="desktop-nav-active"
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 rounded-lg bg-[#182235] border border-blue-500/25 shadow-[0_0_20px_-8px_rgba(59,130,246,0.45)]"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      className={`relative z-10 w-4 h-4 shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/[0.07] text-xs text-slate-400 space-y-1">
          <div className="font-medium text-slate-300">GCE A/L Physical Science</div>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Course 008 · All 25 Districts · Verify with official UGC releases
          </div>
        </div>
      </aside>

      {/* Mobile Compact Top Navigation Bar */}
      <div className="lg:hidden sticky top-0 z-40 h-14 px-4 bg-[#0B101D]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
          <EngineeringEmblem />
          <span className="text-sm font-semibold text-slate-100 whitespace-nowrap truncate">
            UoM Analytics
          </span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-72 max-w-[82vw] h-full bg-[#0B101D] border-r border-white/[0.1] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <EngineeringEmblem />
                  <div>
                    <div className="text-sm font-semibold text-slate-100">UoM Analytics</div>
                    <div className="text-[11px] text-slate-400">Course 008 Intelligence</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav aria-label="Mobile Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#182235] text-white border border-blue-500/25'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-blue-400' : 'text-slate-400'
                            }`}
                          />
                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="px-5 py-4 border-t border-white/[0.08] text-xs text-slate-400">
                Sri Lanka A/L Physical Science · Course 008
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
