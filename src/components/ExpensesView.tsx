import React, { useMemo, useState } from 'react';
import { ArrowDownUp, Search, Trash2 } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types/finance';
import {
  formatDateShort,
  formatMonthLabel,
  formatNGN,
  getMonthKey,
} from '../utils/currency';

interface ExpensesViewProps {
  expenses: Expense[];
  selectedMonth: string;
  monthlyIncome: number;
  onDeleteExpense: (id: string) => void;
  onOpenAddExpense: () => void;
}

const ALL_CATEGORIES: Array<'All' | ExpenseCategory> = [
  'All',
  'Food & Groceries',
  'Transport & Fuel',
  'Dining & Leisure',
  'Data & Airtime',
  'Health & Personal',
  'Family Support',
  'Shopping',
  'Miscellaneous',
];

const PAYMENT_METHODS: Array<'All' | PaymentMethod> = [
  'All',
  'Bank Transfer',
  'Debit Card',
  'USSD',
  'Cash',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  selectedMonth,
  monthlyIncome,
  onDeleteExpense,
  onOpenAddExpense,
}) => {
  const [categoryFilter, setCategoryFilter] =
    useState<'All' | ExpenseCategory>('All');
  const [methodFilter, setMethodFilter] =
    useState<'All' | PaymentMethod>('All');
  const [search, setSearch] = useState('');

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => getMonthKey(e.date) === selectedMonth)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, selectedMonth]
  );

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monthExpenses.filter((e) => {
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
      if (methodFilter !== 'All' && e.paymentMethod !== methodFilter)
        return false;
      if (
        q &&
        !e.description.toLowerCase().includes(q) &&
        !e.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [monthExpenses, categoryFilter, methodFilter, search]);

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses]
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of monthExpenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  const topCategory = categoryTotals[0];
  const incomeShare =
    monthlyIncome > 0 ? Math.round((monthTotal / monthlyIncome) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Expenses Total · {formatMonthLabel(selectedMonth)}
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(monthTotal)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {incomeShare}% of net paycheck income
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Transactions</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {monthExpenses.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Logged in selected month
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Average Per Entry
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(
              monthExpenses.length > 0
                ? Math.round(monthTotal / monthExpenses.length)
                : 0
            )}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Mean transaction size
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Highest Category
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 truncate">
            {topCategory ? topCategory[0] : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {topCategory ? formatNGN(topCategory[1]) : '₦0'}
          </div>
        </div>
      </section>

      {/* Category Distribution Bar */}
      {categoryTotals.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Category Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Share of variable spending across categories
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
            {categoryTotals.map(([cat, amount]) => {
              const pct =
                monthTotal > 0 ? Math.round((amount / monthTotal) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-800">{cat}</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatNGN(amount)}{' '}
                      <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-slate-800"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Expenses Ledger Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Expense Transactions
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredExpenses.length} of {monthExpenses.length} entries
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search merchant..."
                className="w-44 sm:w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'All' | ExpenseCategory)
              }
              aria-label="Filter by expense category"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) =>
                setMethodFilter(e.target.value as 'All' | PaymentMethod)
              }
              aria-label="Filter by payment method"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All Channels' : m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center">
            <ArrowDownUp className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No expenses recorded
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Log groceries, transport, fuel, or family transfers for{' '}
              {formatMonthLabel(selectedMonth)}.
            </p>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Log Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-6 pr-3">Date</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3 text-right">Amount (₦)</th>
                  <th className="py-3 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 pl-6 pr-3 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDateShort(exp.date)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">
                        {exp.description}
                      </div>
                      {exp.notes && (
                        <div className="text-xs text-slate-500">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700 whitespace-nowrap">
                      {exp.category}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                      {formatNGN(exp.amount)}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete expense ${exp.description}`}
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
