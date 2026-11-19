import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Play,
  SlidersHorizontal,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  AutoAllocationRule,
  AutoTrackerConfig,
  Debt,
  Paycheck,
  SavingsGoal,
} from '../types/finance';
import {
  formatDateShort,
  formatMonthLabel,
  formatNGN,
  getMonthKey,
} from '../utils/currency';

interface PaycheckViewProps {
  paychecks: Paycheck[];
  autoTracker: AutoTrackerConfig;
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  selectedMonth: string;
  onOpenAddPaycheck: () => void;
  onRunAutoAllocate: (paycheckId: string) => void;
  onDeletePaycheck: (id: string) => void;
  onUpdateAutoTracker: (
    updater: (prev: AutoTrackerConfig) => AutoTrackerConfig
  ) => void;
}

export const PaycheckView: React.FC<PaycheckViewProps> = ({
  paychecks,
  autoTracker,
  savingsGoals,
  debts,
  selectedMonth,
  onOpenAddPaycheck,
  onRunAutoAllocate,
  onDeletePaycheck,
  onUpdateAutoTracker,
}) => {
  const [scope, setScope] = useState<'month' | 'all'>('month');

  const visiblePaychecks = useMemo(() => {
    const list =
      scope === 'month'
        ? paychecks.filter((p) => getMonthKey(p.date) === selectedMonth)
        : paychecks;
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [paychecks, scope, selectedMonth]);

  const monthNetTotal = useMemo(
    () =>
      paychecks
        .filter((p) => getMonthKey(p.date) === selectedMonth)
        .reduce((s, p) => s + p.netAmount, 0),
    [paychecks, selectedMonth]
  );

  const monthGrossTotal = useMemo(
    () =>
      paychecks
        .filter((p) => getMonthKey(p.date) === selectedMonth)
        .reduce((s, p) => s + p.grossAmount, 0),
    [paychecks, selectedMonth]
  );

  const totalAllocationPct = autoTracker.rules.reduce(
    (s, r) => s + r.percentage,
    0
  );

  const handleRulePctChange = (
    bucket: AutoAllocationRule['bucket'],
    value: number
  ) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value || 0)));
    onUpdateAutoTracker((prev) => ({
      ...prev,
      rules: prev.rules.map((r) =>
        r.bucket === bucket ? { ...r, percentage: clamped } : r
      ),
    }));
  };

  const handleNormalizeRules = () => {
    const sum = autoTracker.rules.reduce((s, r) => s + r.percentage, 0);
    if (sum === 0) {
      onUpdateAutoTracker((prev) => ({
        ...prev,
        rules: prev.rules.map((r) => ({ ...r, percentage: 25 })),
      }));
      return;
    }
    let running = 0;
    onUpdateAutoTracker((prev) => ({
      ...prev,
      rules: prev.rules.map((r, idx) => {
        if (idx === prev.rules.length - 1) {
          return { ...r, percentage: Math.max(0, 100 - running) };
        }
        const scaled = Math.round((r.percentage / sum) * 100);
        running += scaled;
        return { ...r, percentage: scaled };
      }),
    }));
  };

  const activeDebts = debts.filter((d) => d.remainingBalance > 0);

  return (
    <div className="space-y-6">
      {/* Top KPI Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Net Paycheck Income · {formatMonthLabel(selectedMonth)}
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {formatNGN(monthNetTotal)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Gross {formatNGN(monthGrossTotal)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Auto-Tracker Engine
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {autoTracker.enabled ? 'Active' : 'Manual'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {autoTracker.autoPostToVaults
              ? 'Auto-posts to Savings & Debt vaults'
              : 'Preview breakdown only'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Rule Split Total
          </div>
          <div
            className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
              totalAllocationPct === 100 ? 'text-slate-900' : 'text-amber-600'
            }`}
          >
            {totalAllocationPct}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {totalAllocationPct === 100
              ? '100% of net paycheck assigned'
              : 'Adjust splits or normalize to 100%'}
          </div>
        </div>
      </section>

      {/* Paycheck Auto-Allocation Rules Engine */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="h-4 w-4 text-emerald-700"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-slate-900">
                Paycheck Auto-Allocation Rules
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Automatically split every incoming Naira paycheck across your four
              core buckets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoTracker.enabled}
                onChange={(e) =>
                  onUpdateAutoTracker((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-700"
              />
              <span>Auto-allocate on paycheck log</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoTracker.autoPostToVaults}
                onChange={(e) =>
                  onUpdateAutoTracker((prev) => ({
                    ...prev,
                    autoPostToVaults: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-700"
              />
              <span>Auto-post to Debt &amp; Savings vaults</span>
            </label>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {autoTracker.rules.map((rule) => {
            const previewNGN = Math.round(
              (monthNetTotal * rule.percentage) / 100
            );
            return (
              <div
                key={rule.bucket}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {rule.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={rule.percentage}
                        onChange={(e) =>
                          handleRulePctChange(
                            rule.bucket,
                            Number(e.target.value)
                          )
                        }
                        aria-label={`${rule.label} percentage`}
                        className="w-14 rounded border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-semibold tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
                      />
                      <span className="text-xs font-mono text-slate-500">%</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {rule.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Month target</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {formatNGN(previewNGN)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Target Vault Selectors + Rule Validation */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Target Savings Vault:
              </label>
              <select
                value={autoTracker.defaultSavingsGoalId}
                onChange={(e) =>
                  onUpdateAutoTracker((prev) => ({
                    ...prev,
                    defaultSavingsGoalId: e.target.value,
                  }))
                }
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              >
                {savingsGoals.length === 0 && (
                  <option value="">No goals created</option>
                )}
                {savingsGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Target Priority Debt:
              </label>
              <select
                value={autoTracker.defaultDebtId}
                onChange={(e) =>
                  onUpdateAutoTracker((prev) => ({
                    ...prev,
                    defaultDebtId: e.target.value,
                  }))
                }
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              >
                {activeDebts.length === 0 && (
                  <option value="">No active debts</option>
                )}
                {activeDebts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.creditor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {totalAllocationPct !== 100 && (
            <button
              type="button"
              onClick={handleNormalizeRules}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 whitespace-nowrap shrink-0"
            >
              Normalize Rules to 100% (Currently {totalAllocationPct}%)
            </button>
          )}
        </div>
      </section>

      {/* Paycheck History Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Paycheck Ledger
            </h2>
            <p className="text-xs text-slate-500">
              {visiblePaychecks.length} paycheck entries shown
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setScope('month')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  scope === 'month'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Selected Month
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  scope === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All History
              </button>
            </div>
          </div>
        </div>

        {visiblePaychecks.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No paychecks logged for {formatMonthLabel(selectedMonth)}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Record a salary or freelance deposit to calculate your monthly
              remaining balance.
            </p>
            <button
              type="button"
              onClick={onOpenAddPaycheck}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Log First Paycheck
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-6 pr-3">Date</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Allocation Split</th>
                  <th className="py-3 px-3 text-right">Gross (₦)</th>
                  <th className="py-3 px-3 text-right">Deductions</th>
                  <th className="py-3 px-3 text-right">Net Pay (₦)</th>
                  <th className="py-3 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePaychecks.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pl-6 pr-3 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDateShort(p.date)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">
                        {p.source}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.category} · {p.frequency}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {p.autoAllocated && p.allocationBreakdown ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                          <CheckCircle2
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-mono tabular-nums text-slate-600">
                            B {formatNGN(p.allocationBreakdown.bills)} · S{' '}
                            {formatNGN(p.allocationBreakdown.savings)}
                          </span>
                        </div>
                      ) : p.autoAllocated ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Auto-allocated</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRunAutoAllocate(p.id)}
                          className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <Play className="h-3 w-3" aria-hidden="true" />
                          <span>Run Auto-Allocate</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {formatNGN(p.grossAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {formatNGN(p.deductions)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                      {formatNGN(p.netAmount)}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => onDeletePaycheck(p.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete paycheck ${p.source}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
