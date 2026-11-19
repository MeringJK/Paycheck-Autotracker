import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Trash2 } from 'lucide-react';
import { Debt, DebtPayment } from '../types/finance';
import {
  formatDateShort,
  formatMonthLabel,
  formatNGN,
  getMonthKey,
} from '../utils/currency';

interface DebtViewProps {
  debts: Debt[];
  debtPayments: DebtPayment[];
  selectedMonth: string;
  onOpenAddDebt: () => void;
  onOpenRecordPayment: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
}

export const DebtView: React.FC<DebtViewProps> = ({
  debts,
  debtPayments,
  selectedMonth,
  onOpenAddDebt,
  onOpenRecordPayment,
  onDeleteDebt,
}) => {
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      if (a.remainingBalance === 0 && b.remainingBalance > 0) return 1;
      if (b.remainingBalance === 0 && a.remainingBalance > 0) return -1;
      if (strategy === 'avalanche') {
        return b.interestRate - a.interestRate;
      }
      return a.remainingBalance - b.remainingBalance;
    });
  }, [debts, strategy]);

  const monthPayments = useMemo(
    () =>
      debtPayments
        .filter((p) => getMonthKey(p.date) === selectedMonth)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [debtPayments, selectedMonth]
  );

  const totalRemaining = debts.reduce((s, d) => s + d.remainingBalance, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0);
  const totalPaidLifetime = Math.max(0, totalOriginal - totalRemaining);
  const paidThisMonth = monthPayments.reduce((s, p) => s + p.amount, 0);
  const totalMonthlyMinimums = debts
    .filter((d) => d.remainingBalance > 0)
    .reduce((s, d) => s + d.minimumPayment, 0);
  const activeDebts = debts.filter((d) => d.remainingBalance > 0);
  const weightedAvgApr =
    totalRemaining > 0
      ? debts.reduce(
          (s, d) => s + d.interestRate * (d.remainingBalance / totalRemaining),
          0
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Remaining Debt Balance
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(totalRemaining)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Paid off {formatNGN(totalPaidLifetime)} total
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Paid in {formatMonthLabel(selectedMonth)}
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {formatNGN(paidThisMonth)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {monthPayments.length} payment{monthPayments.length === 1 ? '' : 's'} logged
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Monthly Minimums
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(totalMonthlyMinimums)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {activeDebts.length} active account{activeDebts.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Weighted Avg Interest
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {weightedAvgApr.toFixed(1)}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Annualized APR across balances
          </div>
        </div>
      </section>

      {/* Debt Accounts List */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Debt &amp; Liability Accounts
            </h2>
            <p className="text-xs text-slate-500">
              Ordered by{' '}
              {strategy === 'avalanche'
                ? 'highest APR first (Avalanche saves the most interest)'
                : 'lowest balance first (Snowball clears accounts fastest)'}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setStrategy('avalanche')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                strategy === 'avalanche'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Avalanche (APR)
            </button>
            <button
              type="button"
              onClick={() => setStrategy('snowball')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                strategy === 'snowball'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Snowball (Balance)
            </button>
          </div>
        </div>

        {sortedDebts.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No debt accounts tracked
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add cooperative loans, bank credit lines, or BNPL obligations to
              track payoff progress.
            </p>
            <button
              type="button"
              onClick={onOpenAddDebt}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Add Debt Account
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedDebts.map((debt, index) => {
              const paidAmt = Math.max(
                0,
                debt.originalAmount - debt.remainingBalance
              );
              const pct =
                debt.originalAmount > 0
                  ? Math.min(
                      100,
                      Math.round((paidAmt / debt.originalAmount) * 100)
                    )
                  : 100;
              const isCleared = debt.remainingBalance <= 0;

              return (
                <div
                  key={debt.id}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        0{index + 1}.
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {debt.creditor}
                      </h3>
                      <span className="text-xs text-slate-500">
                        · {debt.type} · {debt.interestRate}% APR · Due day{' '}
                        {debt.dueDay}
                      </span>
                    </div>

                    <div className="mt-3 max-w-xl">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600">
                          {isCleared ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Paid in full
                            </span>
                          ) : (
                            <span>{pct}% paid off</span>
                          )}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {formatNGN(paidAmt)} / {formatNGN(debt.originalAmount)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${
                            isCleared ? 'bg-emerald-600' : 'bg-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-xs text-slate-500">Remaining</div>
                      <div className="font-mono text-lg font-bold tabular-nums text-slate-900">
                        {formatNGN(debt.remainingBalance)}
                      </div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        Min {formatNGN(debt.minimumPayment)}/mo
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCleared && (
                        <button
                          type="button"
                          onClick={() => onOpenRecordPayment(debt)}
                          className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteDebt(debt.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete debt ${debt.creditor}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Monthly Debt Payment History */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Debt Payments · {formatMonthLabel(selectedMonth)}
          </h2>
          <p className="text-xs text-slate-500">
            Payments logged this month are deducted from your monthly remaining
            Naira balance
          </p>
        </div>

        {monthPayments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No debt payments recorded for {formatMonthLabel(selectedMonth)}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-6 pr-3">Date</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-3">Note</th>
                  <th className="py-3 pl-3 pr-6 text-right">Amount Paid (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50">
                    <td className="py-3 pl-6 pr-3 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDateShort(pmt.date)}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {pmt.debtName}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {pmt.note || 'Manual payment'}
                      {pmt.autoTracked ? ' · Paycheck Auto-Tracked' : ''}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right font-mono font-semibold tabular-nums text-emerald-700 whitespace-nowrap">
                      {formatNGN(pmt.amount)}
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
