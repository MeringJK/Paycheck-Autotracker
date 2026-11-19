import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bill,
  FinanceState,
  MonthlyBalanceSummary,
  SectionId,
} from '../types/finance';
import {
  formatDateShort,
  formatMonthLabel,
  formatNGN,
  formatNGNCompact,
  formatShortMonthLabel,
  getMonthKey,
} from '../utils/currency';

interface DashboardViewProps {
  state: FinanceState;
  selectedMonth: string;
  summary: MonthlyBalanceSummary;
  previousSummary: MonthlyBalanceSummary;
  sixMonthTrend: MonthlyBalanceSummary[];
  onNavigate: (section: SectionId) => void;
  onToggleBillPaid: (billId: string) => void;
  onOpenPaycheckModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  selectedMonth,
  summary,
  previousSummary,
  sixMonthTrend,
  onNavigate,
  onToggleBillPaid,
  onOpenPaycheckModal,
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const monthBills = useMemo(
    () =>
      state.bills
        .filter((b) => b.monthKey === selectedMonth)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [state.bills, selectedMonth]
  );

  const unpaidBills = useMemo(
    () => monthBills.filter((b) => b.status !== 'paid'),
    [monthBills]
  );

  const monthExpenses = useMemo(
    () =>
      state.expenses.filter((e) => getMonthKey(e.date) === selectedMonth),
    [state.expenses, selectedMonth]
  );

  const topExpenseCategories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const exp of monthExpenses) {
      totals.set(exp.category, (totals.get(exp.category) ?? 0) + exp.amount);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [monthExpenses]);

  const totalDebtRemaining = useMemo(
    () => state.debts.reduce((sum, d) => sum + d.remainingBalance, 0),
    [state.debts]
  );

  const totalSavingsBalance = useMemo(
    () => state.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0),
    [state.savingsGoals]
  );

  const totalSavingsTarget = useMemo(
    () => state.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0),
    [state.savingsGoals]
  );

  const balanceDelta =
    summary.projectedRemainingBalance -
    previousSummary.projectedRemainingBalance;

  const unpaidBillsAmount =
    summary.pendingBillsTotal + summary.overdueBillsTotal;

  // Allocation bar segments relative to total monthly income
  const allocationBase = Math.max(
    summary.totalIncome,
    summary.committedOutflows,
    1
  );
  const pct = (val: number) =>
    Math.min(100, Math.max(0, (val / allocationBase) * 100));

  // Chart scaling for 6-month trend
  const maxChartVal = Math.max(
    100_000,
    ...sixMonthTrend.map((m) => Math.max(m.totalIncome, m.committedOutflows))
  );

  const hoveredTrend =
    sixMonthTrend.find((m) => m.monthKey === hoveredMonth) ??
    sixMonthTrend[sixMonthTrend.length - 1];

  return (
    <div className="space-y-6">
      {/* Focal Anchor: Monthly Remaining Balance in NGN */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Monthly Remaining Balance · {formatMonthLabel(selectedMonth)}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-4">
              <div
                className={`font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
                  summary.projectedRemainingBalance >= 0
                    ? 'text-slate-900'
                    : 'text-red-600'
                }`}
              >
                {formatNGN(summary.projectedRemainingBalance, true)}
              </div>
              {previousSummary.totalIncome > 0 && (
                <div
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    balanceDelta >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {balanceDelta >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span className="font-mono tabular-nums">
                    {balanceDelta >= 0 ? '+' : ''}
                    {formatNGNCompact(balanceDelta)} vs prior month
                  </span>
                </div>
              )}
            </div>
            <p className="mt-1.5 text-sm text-slate-600">
              Projected free balance in Naira after paid &amp; upcoming bills,
              expenses, debt payments, and savings transfers.
            </p>
          </div>

          {/* Current Cash vs Committed Outflows Mini Balance Ledger */}
          <div className="grid grid-cols-2 gap-6 border-t border-slate-200 pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0 shrink-0">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Cash on Hand (Pre-Pending)
              </div>
              <div
                className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                  summary.actualRemainingBalance >= 0
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}
              >
                {formatNGN(summary.actualRemainingBalance)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                Before {formatNGN(unpaidBillsAmount)} unpaid bills
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">
                Savings Rate
              </div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900">
                {summary.savingsRatePercent}%
              </div>
              <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                {formatNGN(summary.savingsNetTotal)} net saved
              </div>
            </div>
          </div>
        </div>

        {/* Visual Paycheck Allocation Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
            <span className="font-medium text-slate-700">
              Monthly Income Distribution ({formatNGN(summary.totalIncome)} Net)
            </span>
            <span className="font-mono tabular-nums text-slate-500">
              {summary.totalIncome > 0
                ? `${Math.round(
                    (summary.committedOutflows / summary.totalIncome) * 100
                  )}% committed`
                : 'No paychecks logged for this month'}
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex">
            <div
              style={{ width: `${pct(summary.totalBills)}%` }}
              className="bg-amber-500 transition-all"
              title={`Bills: ${formatNGN(summary.totalBills)}`}
            />
            <div
              style={{ width: `${pct(summary.expensesTotal)}%` }}
              className="bg-slate-700 transition-all"
              title={`Expenses: ${formatNGN(summary.expensesTotal)}`}
            />
            <div
              style={{ width: `${pct(summary.debtPaymentsTotal)}%` }}
              className="bg-red-500 transition-all"
              title={`Debt Payments: ${formatNGN(summary.debtPaymentsTotal)}`}
            />
            <div
              style={{ width: `${pct(Math.max(0, summary.savingsNetTotal))}%` }}
              className="bg-emerald-600 transition-all"
              title={`Savings: ${formatNGN(summary.savingsNetTotal)}`}
            />
          </div>

          {/* Clean unboxed legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" aria-hidden="true" />
              <span>Bills</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {formatNGN(summary.totalBills)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" aria-hidden="true" />
              <span>Expenses</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {formatNGN(summary.expensesTotal)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-500" aria-hidden="true" />
              <span>Debt Paid</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {formatNGN(summary.debtPaymentsTotal)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" aria-hidden="true" />
              <span>Savings</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {formatNGN(summary.savingsNetTotal)}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 4-Column Section KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('paycheck')}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Paycheck Income</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(summary.totalIncome)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Gross {formatNGN(summary.totalGrossIncome)} · Tax/Ded{' '}
            {formatNGN(summary.totalDeductions)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('bills')}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Monthly Bills</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(summary.totalBills)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Paid {formatNGN(summary.paidBillsTotal)} · Unpaid{' '}
            {formatNGN(unpaidBillsAmount)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('expenses')}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Variable Expenses</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(summary.expensesTotal)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {monthExpenses.length} transactions this month
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('debt')}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Debt &amp; Savings</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(totalSavingsBalance)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            Saved · Debt left {formatNGN(totalDebtRemaining)}
          </div>
        </button>
      </section>

      {/* Main Analytics Split: 6-Month NGN Trend & Monthly Balance Equation */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 6-Month Cashflow Chart */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                6-Month Naira Cashflow Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Net paycheck income vs. total monthly commitments (NGN)
              </p>
            </div>
            {hoveredTrend && (
              <div className="text-right">
                <div className="text-xs font-medium text-slate-500">
                  {formatMonthLabel(hoveredTrend.monthKey)}
                </div>
                <div className="font-mono text-xs tabular-nums text-slate-800">
                  In {formatNGNCompact(hoveredTrend.totalIncome)} · Out{' '}
                  {formatNGNCompact(hoveredTrend.committedOutflows)} · Net{' '}
                  <span
                    className={
                      hoveredTrend.projectedRemainingBalance >= 0
                        ? 'text-emerald-700 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {formatNGNCompact(hoveredTrend.projectedRemainingBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 h-56 flex items-end justify-between gap-3 sm:gap-5 pt-4 border-b border-slate-200 pb-2">
            {sixMonthTrend.map((m) => {
              const incH = Math.round((m.totalIncome / maxChartVal) * 100);
              const outH = Math.round(
                (m.committedOutflows / maxChartVal) * 100
              );
              const isSelected = m.monthKey === selectedMonth;
              return (
                <div
                  key={m.monthKey}
                  onMouseEnter={() => setHoveredMonth(m.monthKey)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className={`flex-1 flex flex-col items-center gap-2 h-full justify-end rounded-lg px-1 pt-2 transition-colors ${
                    isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-40">
                    <div
                      style={{ height: `${Math.max(4, incH)}%` }}
                      className="w-4 sm:w-5 rounded-t bg-emerald-700 transition-all"
                      title={`Income: ${formatNGN(m.totalIncome)}`}
                    />
                    <div
                      style={{ height: `${Math.max(4, outH)}%` }}
                      className="w-4 sm:w-5 rounded-t bg-slate-300 transition-all"
                      title={`Outflows: ${formatNGN(m.committedOutflows)}`}
                    />
                  </div>
                  <div
                    className={`text-xs font-mono tabular-nums whitespace-nowrap ${
                      isSelected
                        ? 'font-bold text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {formatShortMonthLabel(m.monthKey)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700" aria-hidden="true" />
                <span>Net Paycheck</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" aria-hidden="true" />
                <span>Bills, Expenses, Debt &amp; Savings</span>
              </span>
            </div>
            <span className="font-mono tabular-nums">NGN (₦)</span>
          </div>
        </div>

        {/* Monthly Remaining Balance Statement */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Monthly Naira Balance Statement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact reconciliation for {formatMonthLabel(selectedMonth)}
            </p>

            <dl className="mt-4 sm:mt-5 divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-slate-600 min-w-0">Net Paycheck Income</dt>
                <dd className="font-mono font-semibold tabular-nums text-emerald-700 whitespace-nowrap shrink-0">
                  +{formatNGN(summary.totalIncome)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-slate-600 min-w-0">Bills Already Paid</dt>
                <dd className="font-mono tabular-nums text-slate-900 whitespace-nowrap shrink-0">
                  −{formatNGN(summary.paidBillsTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-slate-600 min-w-0">Expenses Logged</dt>
                <dd className="font-mono tabular-nums text-slate-900 whitespace-nowrap shrink-0">
                  −{formatNGN(summary.expensesTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-slate-600 min-w-0">Debt Payments Made</dt>
                <dd className="font-mono tabular-nums text-slate-900 whitespace-nowrap shrink-0">
                  −{formatNGN(summary.debtPaymentsTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-slate-600 min-w-0">Net Savings Transfers</dt>
                <dd className="font-mono tabular-nums text-slate-900 whitespace-nowrap shrink-0">
                  {summary.savingsNetTotal >= 0 ? '−' : '+'}
                  {formatNGN(Math.abs(summary.savingsNetTotal))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5 bg-slate-50 -mx-2 px-2 rounded">
                <dt className="font-medium text-slate-800 min-w-0">
                  Current Cash Remaining
                </dt>
                <dd
                  className={`font-mono font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                    summary.actualRemainingBalance >= 0
                      ? 'text-slate-900'
                      : 'text-red-600'
                  }`}
                >
                  {formatNGN(summary.actualRemainingBalance)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-amber-700 font-medium min-w-0">
                  Pending &amp; Overdue Bills
                </dt>
                <dd className="font-mono tabular-nums text-amber-700 whitespace-nowrap shrink-0">
                  −{formatNGN(unpaidBillsAmount)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 min-w-0">
              Projected Remaining Balance
            </span>
            <span
              className={`font-mono text-base sm:text-lg font-bold tabular-nums whitespace-nowrap shrink-0 ${
                summary.projectedRemainingBalance >= 0
                  ? 'text-emerald-700'
                  : 'text-red-600'
              }`}
            >
              {formatNGN(summary.projectedRemainingBalance)}
            </span>
          </div>
        </div>
      </section>

      {/* Actionable Lower Grid: Unpaid Bills + Top Expenses + Vaults/Debt */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming & Overdue Bills */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Unpaid Bills Queue
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('bills')}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                View all
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mark bills paid to update your cash-on-hand immediately
            </p>

            {unpaidBills.length === 0 ? (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-700" />
                <p className="mt-2 text-sm font-medium text-slate-800">
                  All scheduled bills settled
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  No pending or overdue bills for {formatMonthLabel(selectedMonth)}.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {unpaidBills.slice(0, 5).map((bill: Bill) => (
                  <li
                    key={bill.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {bill.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        {bill.status === 'overdue' ? (
                          <AlertCircle
                            className="h-3.5 w-3.5 text-red-600 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Clock
                            className="h-3.5 w-3.5 text-amber-600 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={
                            bill.status === 'overdue'
                              ? 'text-red-600 font-medium'
                              : 'text-amber-700 font-medium'
                          }
                        >
                          {bill.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Due {formatDateShort(bill.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                        {formatNGN(bill.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleBillPaid(bill.id)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-colors"
                      >
                        Pay
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Top Expense Categories */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Top Expense Categories
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              View ledger
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Variable spend distribution in Naira
          </p>

          {topExpenseCategories.length === 0 ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-800">
                No expenses recorded yet
              </p>
              <button
                type="button"
                onClick={() => onNavigate('expenses')}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
              >
                Log your first expense
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {topExpenseCategories.map(([cat, amount]) => {
                const share =
                  summary.expensesTotal > 0
                    ? Math.round((amount / summary.expensesTotal) * 100)
                    : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="font-mono tabular-nums text-slate-900">
                        {formatNGN(amount)}{' '}
                        <span className="text-slate-400">({share}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${share}%` }}
                        className="h-full rounded-full bg-slate-800"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Savings & Debt Snapshot */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Savings &amp; Debt Progress
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('savings')}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Manage vaults
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Naira goals and remaining liabilities
            </p>

            <div className="mt-5 space-y-4">
              {state.savingsGoals.slice(0, 3).map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                );
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-800 truncate pr-2">
                        {goal.name}
                      </span>
                      <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className="h-full rounded-full bg-emerald-600"
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500 font-mono tabular-nums">
                      <span>{formatNGNCompact(goal.currentAmount)} saved</span>
                      <span>Goal {formatNGNCompact(goal.targetAmount)}</span>
                    </div>
                  </div>
                );
              })}

              {state.savingsGoals.length === 0 && (
                <p className="text-xs text-slate-500 py-4">
                  No savings goals created yet.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-500">Total Vault Savings</div>
              <div className="font-mono font-bold tabular-nums text-emerald-700">
                {formatNGN(totalSavingsBalance)} /{' '}
                {formatNGNCompact(totalSavingsTarget)}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPaycheckModal}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              + Paycheck
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
