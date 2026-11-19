import React from 'react';
import {
  ArrowDownUp,
  CreditCard,
  Database,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Wallet,
  X,
} from 'lucide-react';
import { MonthlyBalanceSummary, SectionId } from '../types/finance';
import { formatMonthLabel, formatNGN } from '../utils/currency';

interface SidebarProps {
  activeSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  selectedMonth: string;
  summary: MonthlyBalanceSummary;
  overdueBillsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenDataModal: () => void;
}

const NAV_ITEMS: Array<{
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'paycheck', label: 'Paycheck', icon: Wallet },
  { id: 'bills', label: 'Bill Tracker', icon: ReceiptText },
  { id: 'expenses', label: 'Expenses', icon: ArrowDownUp },
  { id: 'debt', label: 'Debt Tracker', icon: CreditCard },
  { id: 'savings', label: 'Savings Tracker', icon: PiggyBank },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  selectedMonth,
  summary,
  overdueBillsCount,
  mobileOpen,
  onCloseMobile,
  onOpenDataModal,
}) => {
  const isPositive = summary.projectedRemainingBalance >= 0;

  const content = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        {/* Brand Zone — clean single-line wordmark */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <Landmark className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              NairaLedger
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden focus-visible:outline-2 focus-visible:outline-emerald-700"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary sections" className="px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-700 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === 'bills' && overdueBillsCount > 0 && (
                  <span className="font-mono tabular-nums text-xs font-semibold text-red-600">
                    {overdueBillsCount} due
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Monthly Balance Snapshot & Data Backup */}
      <div className="border-t border-slate-200 p-4 space-y-4">
        <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
          <div className="text-xs font-medium text-slate-500">
            Projected Remaining · {formatMonthLabel(selectedMonth)}
          </div>
          <div
            className={`mt-1 font-mono text-lg font-bold tabular-nums ${
              isPositive ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatNGN(summary.projectedRemainingBalance)}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>Income</span>
            <span className="font-mono tabular-nums text-slate-700">
              {formatNGN(summary.totalIncome)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDataModal}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <Database className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <span>Backup & Data</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw]">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
