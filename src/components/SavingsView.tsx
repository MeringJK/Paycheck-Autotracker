import React, { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Trash2 } from 'lucide-react';
import { SavingsGoal, SavingsTransaction } from '../types/finance';
import {
  formatDateShort,
  formatMonthLabel,
  formatNGN,
  getMonthKey,
} from '../utils/currency';

interface SavingsViewProps {
  goals: SavingsGoal[];
  transactions: SavingsTransaction[];
  selectedMonth: string;
  onOpenAddGoal: () => void;
  onOpenTxModal: (goal: SavingsGoal, type: 'deposit' | 'withdrawal') => void;
  onDeleteGoal: (id: string) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  goals,
  transactions,
  selectedMonth,
  onOpenAddGoal,
  onOpenTxModal,
  onDeleteGoal,
}) => {
  const monthTransactions = useMemo(
    () =>
      transactions
        .filter((t) => getMonthKey(t.date) === selectedMonth)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth]
  );

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalMonthlyTarget = goals.reduce((s, g) => s + g.monthlyTarget, 0);
  const overallProgress =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const savedThisMonth = monthTransactions.reduce(
    (s, t) => s + (t.type === 'deposit' ? t.amount : -t.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Vault Balance
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {formatNGN(totalSaved)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Across {goals.length} Naira vault{goals.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Net Saved · {formatMonthLabel(selectedMonth)}
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(savedThisMonth)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Monthly goal {formatNGN(totalMonthlyTarget)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Combined Goal Target
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(totalTarget)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {formatNGN(Math.max(0, totalTarget - totalSaved))} remaining
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Overall Progress
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {overallProgress}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Funded toward targets
          </div>
        </div>
      </section>

      {/* Savings Goals Grid */}
      <section>
        {goals.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <PiggyBank className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No savings vaults created
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Create Naira vaults for Emergency Funds, Annual Rent Renewal, or
              Treasury Bills.
            </p>
            <button
              type="button"
              onClick={onOpenAddGoal}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Create First Vault
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {goals.map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.min(
                      100,
                      Math.round((goal.currentAmount / goal.targetAmount) * 100)
                    )
                  : 0;
              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">
                          {goal.category} · Target{' '}
                          {formatDateShort(goal.targetDate)}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-slate-900 truncate">
                          {goal.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                        aria-label={`Delete vault ${goal.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                          {formatNGN(goal.currentAmount)}
                        </span>
                        <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full rounded-full bg-emerald-600"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                        <span>Target {formatNGN(goal.targetAmount)}</span>
                        <span>Monthly {formatNGN(goal.monthlyTarget)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenTxModal(goal, 'deposit')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Deposit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTxModal(goal, 'withdrawal')}
                      disabled={goal.currentAmount <= 0}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Withdraw</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Monthly Savings Transactions Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Savings Activity · {formatMonthLabel(selectedMonth)}
          </h2>
          <p className="text-xs text-slate-500">
            Deposits and withdrawals affecting this month&apos;s Naira remaining
            balance
          </p>
        </div>

        {monthTransactions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No savings transfers recorded for {formatMonthLabel(selectedMonth)}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-6 pr-3">Date</th>
                  <th className="py-3 px-3">Vault</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Note</th>
                  <th className="py-3 pl-3 pr-6 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-3 pl-6 pr-3 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDateShort(tx.date)}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {tx.goalName}
                    </td>
                    <td className="py-3 px-3 text-xs capitalize">
                      <span
                        className={
                          tx.type === 'deposit'
                            ? 'font-medium text-emerald-700'
                            : 'font-medium text-amber-700'
                        }
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {tx.note || 'Manual transfer'}
                      {tx.autoTracked ? ' · Paycheck Auto-Tracked' : ''}
                    </td>
                    <td
                      className={`py-3 pl-3 pr-6 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                        tx.type === 'deposit'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {tx.type === 'deposit' ? '+' : '−'}
                      {formatNGN(tx.amount)}
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
