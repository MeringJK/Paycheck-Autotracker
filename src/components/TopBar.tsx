import React from 'react';
import { ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import { SectionId } from '../types/finance';
import { formatMonthLabel, formatShortMonthLabel } from '../utils/currency';

interface TopBarProps {
  activeSection: SectionId;
  selectedMonth: string;
  onChangeMonth: (delta: number) => void;
  onResetToCurrentMonth: () => void;
  onOpenMobileMenu: () => void;
  onPrimaryAction: () => void;
}

const SECTION_META: Record<
  SectionId,
  { title: string; actionLabel: string }
> = {
  dashboard: { title: 'Monthly Overview', actionLabel: 'Log Paycheck' },
  paycheck: { title: 'Paycheck & Auto-Allocation', actionLabel: 'Log Paycheck' },
  bills: { title: 'Bill Tracker', actionLabel: 'Add Bill' },
  expenses: { title: 'Expenses Ledger', actionLabel: 'Log Expense' },
  debt: { title: 'Debt Tracker', actionLabel: 'Add Debt' },
  savings: { title: 'Savings Tracker', actionLabel: 'New Goal' },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  selectedMonth,
  onChangeMonth,
  onResetToCurrentMonth,
  onOpenMobileMenu,
  onPrimaryAction,
}) => {
  const meta = SECTION_META[activeSection];

  return (
    <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Zone 1: Context / Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden focus-visible:outline-2 focus-visible:outline-emerald-700"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 whitespace-nowrap">
            NairaLedger
          </span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">
            /
          </span>
          <h1 className="font-semibold text-slate-900 truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Zone 2: Month Selector */}
      <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:p-1 shrink-0">
        <button
          type="button"
          onClick={() => onChangeMonth(-1)}
          className="rounded-md p-1 sm:p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-700"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <button
          type="button"
          onClick={onResetToCurrentMonth}
          className="px-1.5 sm:px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-800 hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 tabular-nums"
          title="Jump to current month"
        >
          <span className="sm:hidden">{formatShortMonthLabel(selectedMonth)}</span>
          <span className="hidden sm:inline">{formatMonthLabel(selectedMonth)}</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeMonth(1)}
          className="rounded-md p-1 sm:p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-700"
          aria-label="Next month"
        >
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Zone 3: 1 Primary Action */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
          <span>{meta.actionLabel}</span>
        </button>
      </div>
    </header>
  );
};
