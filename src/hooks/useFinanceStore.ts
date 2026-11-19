import { useEffect, useMemo, useState } from 'react';
import { buildSeedData } from '../data/seedData';
import {
  AllocationBreakdown,
  AutoAllocationRule,
  Bill,
  BillStatus,
  Debt,
  DebtPayment,
  Expense,
  FinanceState,
  MonthlyBalanceSummary,
  Paycheck,
  SavingsGoal,
  SavingsTransaction,
} from '../types/finance';
import {
  generateId,
  getMonthKey,
  getTodayISO,
  shiftMonth,
} from '../utils/currency';

const STORAGE_KEY = 'nairaledger_ngn_state_v1';

function loadInitialState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceState;
      if (parsed && Array.isArray(parsed.paychecks) && parsed.autoTracker) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data if storage is unreadable
  }
  return buildSeedData();
}

export function computeMonthlySummary(
  state: FinanceState,
  monthKey: string
): MonthlyBalanceSummary {
  const monthPaychecks = state.paychecks.filter(
    (p) => getMonthKey(p.date) === monthKey
  );
  const totalIncome = monthPaychecks.reduce((sum, p) => sum + p.netAmount, 0);
  const totalGrossIncome = monthPaychecks.reduce(
    (sum, p) => sum + p.grossAmount,
    0
  );
  const totalDeductions = monthPaychecks.reduce(
    (sum, p) => sum + p.deductions,
    0
  );

  const monthBills = state.bills.filter((b) => b.monthKey === monthKey);
  const paidBillsTotal = monthBills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);
  const pendingBillsTotal = monthBills
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);
  const overdueBillsTotal = monthBills
    .filter((b) => b.status === 'overdue')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalBills = paidBillsTotal + pendingBillsTotal + overdueBillsTotal;

  const expensesTotal = state.expenses
    .filter((e) => getMonthKey(e.date) === monthKey)
    .reduce((sum, e) => sum + e.amount, 0);

  const debtPaymentsTotal = state.debtPayments
    .filter((dp) => getMonthKey(dp.date) === monthKey)
    .reduce((sum, dp) => sum + dp.amount, 0);

  const monthSavingsTx = state.savingsTransactions.filter(
    (tx) => getMonthKey(tx.date) === monthKey
  );
  const savingsDepositsTotal = monthSavingsTx
    .filter((tx) => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const savingsWithdrawalsTotal = monthSavingsTx
    .filter((tx) => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const savingsNetTotal = savingsDepositsTotal - savingsWithdrawalsTotal;

  const actualOutflows =
    paidBillsTotal + expensesTotal + debtPaymentsTotal + savingsNetTotal;
  const unpaidBillsTotal = pendingBillsTotal + overdueBillsTotal;
  const committedOutflows = actualOutflows + unpaidBillsTotal;

  const actualRemainingBalance = totalIncome - actualOutflows;
  const projectedRemainingBalance = totalIncome - committedOutflows;
  const savingsRatePercent =
    totalIncome > 0 ? Math.round((savingsNetTotal / totalIncome) * 100) : 0;

  return {
    monthKey,
    totalIncome,
    totalGrossIncome,
    totalDeductions,
    paidBillsTotal,
    pendingBillsTotal,
    overdueBillsTotal,
    totalBills,
    expensesTotal,
    debtPaymentsTotal,
    savingsDepositsTotal,
    savingsWithdrawalsTotal,
    savingsNetTotal,
    actualOutflows,
    committedOutflows,
    actualRemainingBalance,
    projectedRemainingBalance,
    savingsRatePercent,
  };
}

function computeAllocationBreakdown(
  netAmount: number,
  rules: AutoAllocationRule[]
): AllocationBreakdown {
  const getPct = (bucket: AutoAllocationRule['bucket']) =>
    rules.find((r) => r.bucket === bucket)?.percentage ?? 0;

  return {
    bills: Math.round((netAmount * getPct('bills')) / 100),
    expenses: Math.round((netAmount * getPct('expenses')) / 100),
    debt: Math.round((netAmount * getPct('debt')) / 100),
    savings: Math.round((netAmount * getPct('savings')) / 100),
  };
}

export function useFinanceStore(selectedMonth: string) {
  const [state, setState] = useState<FinanceState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const monthlySummary = useMemo(
    () => computeMonthlySummary(state, selectedMonth),
    [state, selectedMonth]
  );

  const previousMonthSummary = useMemo(
    () => computeMonthlySummary(state, shiftMonth(selectedMonth, -1)),
    [state, selectedMonth]
  );

  const sixMonthTrend = useMemo(() => {
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      keys.push(shiftMonth(selectedMonth, -i));
    }
    return keys.map((k) => computeMonthlySummary(state, k));
  }, [state, selectedMonth]);

  // Helper to apply auto-allocation to debt & savings vaults for a paycheck
  const applyAutoAllocationSideEffects = (
    draft: FinanceState,
    paycheck: Paycheck,
    breakdown: AllocationBreakdown
  ): FinanceState => {
    let nextDebts = [...draft.debts];
    let nextDebtPayments = [...draft.debtPayments];
    let nextGoals = [...draft.savingsGoals];
    let nextSavingsTx = [...draft.savingsTransactions];

    if (draft.autoTracker.autoPostToVaults) {
      // Post savings allocation to target goal (or first available)
      if (breakdown.savings > 0 && nextGoals.length > 0) {
        const targetGoal =
          nextGoals.find((g) => g.id === draft.autoTracker.defaultSavingsGoalId) ??
          nextGoals[0];
        if (targetGoal) {
          nextGoals = nextGoals.map((g) =>
            g.id === targetGoal.id
              ? { ...g, currentAmount: g.currentAmount + breakdown.savings }
              : g
          );
          nextSavingsTx = [
            {
              id: generateId('st'),
              goalId: targetGoal.id,
              goalName: targetGoal.name,
              type: 'deposit',
              amount: breakdown.savings,
              date: paycheck.date,
              note: `Auto-allocated from ${paycheck.source}`,
              autoTracked: true,
            },
            ...nextSavingsTx,
          ];
        }
      }

      // Post debt allocation to target debt (if remainingBalance > 0)
      if (breakdown.debt > 0) {
        const activeDebts = nextDebts.filter((d) => d.remainingBalance > 0);
        const targetDebt =
          activeDebts.find((d) => d.id === draft.autoTracker.defaultDebtId) ??
          activeDebts[0];
        if (targetDebt) {
          const appliedPayment = Math.min(
            breakdown.debt,
            targetDebt.remainingBalance
          );
          if (appliedPayment > 0) {
            nextDebts = nextDebts.map((d) =>
              d.id === targetDebt.id
                ? {
                    ...d,
                    remainingBalance: Math.max(
                      0,
                      d.remainingBalance - appliedPayment
                    ),
                  }
                : d
            );
            nextDebtPayments = [
              {
                id: generateId('dp'),
                debtId: targetDebt.id,
                debtName: targetDebt.creditor,
                amount: appliedPayment,
                date: paycheck.date,
                note: `Auto-allocated from ${paycheck.source}`,
                autoTracked: true,
              },
              ...nextDebtPayments,
            ];
          }
        }
      }
    }

    return {
      ...draft,
      debts: nextDebts,
      debtPayments: nextDebtPayments,
      savingsGoals: nextGoals,
      savingsTransactions: nextSavingsTx,
    };
  };

  // Paycheck Actions
  const addPaycheck = (
    input: Omit<Paycheck, 'id' | 'autoAllocated' | 'allocationBreakdown'> & {
      runAutoAllocate?: boolean;
    }
  ) => {
    const shouldAuto =
      input.runAutoAllocate !== undefined
        ? input.runAutoAllocate
        : state.autoTracker.enabled;

    setState((prev) => {
      const breakdown = shouldAuto
        ? computeAllocationBreakdown(input.netAmount, prev.autoTracker.rules)
        : undefined;

      const newPaycheck: Paycheck = {
        id: generateId('pay'),
        source: input.source,
        category: input.category,
        grossAmount: input.grossAmount,
        deductions: input.deductions,
        netAmount: input.netAmount,
        date: input.date,
        frequency: input.frequency,
        autoAllocated: shouldAuto,
        allocationBreakdown: breakdown,
        notes: input.notes,
      };

      const draft: FinanceState = {
        ...prev,
        paychecks: [newPaycheck, ...prev.paychecks],
      };

      if (shouldAuto && breakdown) {
        return applyAutoAllocationSideEffects(draft, newPaycheck, breakdown);
      }
      return draft;
    });
  };

  const runAutoAllocateOnPaycheck = (paycheckId: string) => {
    setState((prev) => {
      const target = prev.paychecks.find((p) => p.id === paycheckId);
      if (!target || target.autoAllocated) return prev;

      const breakdown = computeAllocationBreakdown(
        target.netAmount,
        prev.autoTracker.rules
      );

      const updatedPaychecks = prev.paychecks.map((p) =>
        p.id === paycheckId
          ? { ...p, autoAllocated: true, allocationBreakdown: breakdown }
          : p
      );

      return applyAutoAllocationSideEffects(
        { ...prev, paychecks: updatedPaychecks },
        target,
        breakdown
      );
    });
  };

  const deletePaycheck = (id: string) => {
    setState((prev) => ({
      ...prev,
      paychecks: prev.paychecks.filter((p) => p.id !== id),
    }));
  };

  const updateAutoTrackerConfig = (
    updater: (prev: FinanceState['autoTracker']) => FinanceState['autoTracker']
  ) => {
    setState((prev) => ({
      ...prev,
      autoTracker: updater(prev.autoTracker),
    }));
  };

  // Bill Actions
  const addBill = (input: Omit<Bill, 'id' | 'monthKey'>) => {
    const newBill: Bill = {
      ...input,
      id: generateId('bill'),
      monthKey: getMonthKey(input.dueDate),
    };
    setState((prev) => ({ ...prev, bills: [newBill, ...prev.bills] }));
  };

  const toggleBillStatus = (billId: string, nextStatus?: BillStatus) => {
    const today = getTodayISO();
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => {
        if (b.id !== billId) return b;
        const resolvedStatus: BillStatus =
          nextStatus ?? (b.status === 'paid' ? 'pending' : 'paid');
        return {
          ...b,
          status: resolvedStatus,
          paidDate: resolvedStatus === 'paid' ? today : undefined,
        };
      }),
    }));
  };

  const deleteBill = (id: string) => {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== id),
    }));
  };

  const carryForwardRecurringBills = (targetMonthKey: string): number => {
    const prevMonthKey = shiftMonth(targetMonthKey, -1);
    const existingNames = new Set(
      state.bills
        .filter((b) => b.monthKey === targetMonthKey)
        .map((b) => b.name.toLowerCase())
    );

    const recurringSource = state.bills.filter(
      (b) => b.monthKey === prevMonthKey && b.recurring
    );

    const cloned: Bill[] = [];
    for (const src of recurringSource) {
      if (existingNames.has(src.name.toLowerCase())) continue;
      const day = src.dueDate.slice(8, 10) || '15';
      cloned.push({
        id: generateId('bill'),
        name: src.name,
        category: src.category,
        amount: src.amount,
        dueDate: `${targetMonthKey}-${day}`,
        monthKey: targetMonthKey,
        status: 'pending',
        recurring: true,
        autoPay: src.autoPay,
      });
    }

    if (cloned.length > 0) {
      setState((prev) => ({ ...prev, bills: [...cloned, ...prev.bills] }));
    }

    return cloned.length;
  };

  // Expense Actions
  const addExpense = (input: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...input, id: generateId('exp') };
    setState((prev) => ({ ...prev, expenses: [newExp, ...prev.expenses] }));
  };

  const deleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  // Debt Actions
  const addDebt = (input: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...input, id: generateId('debt') };
    setState((prev) => ({ ...prev, debts: [newDebt, ...prev.debts] }));
  };

  const recordDebtPayment = (
    debtId: string,
    amount: number,
    date: string,
    note?: string
  ) => {
    setState((prev) => {
      const debt = prev.debts.find((d) => d.id === debtId);
      if (!debt || amount <= 0) return prev;

      const applied = Math.min(amount, debt.remainingBalance);
      const payment: DebtPayment = {
        id: generateId('dp'),
        debtId,
        debtName: debt.creditor,
        amount: applied,
        date,
        note,
        autoTracked: false,
      };

      return {
        ...prev,
        debts: prev.debts.map((d) =>
          d.id === debtId
            ? { ...d, remainingBalance: Math.max(0, d.remainingBalance - applied) }
            : d
        ),
        debtPayments: [payment, ...prev.debtPayments],
      };
    });
  };

  const deleteDebt = (id: string) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  // Savings Actions
  const addSavingsGoal = (input: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = { ...input, id: generateId('sav') };
    setState((prev) => ({
      ...prev,
      savingsGoals: [newGoal, ...prev.savingsGoals],
    }));
  };

  const recordSavingsTransaction = (
    goalId: string,
    type: 'deposit' | 'withdrawal',
    amount: number,
    date: string,
    note?: string
  ) => {
    setState((prev) => {
      const goal = prev.savingsGoals.find((g) => g.id === goalId);
      if (!goal || amount <= 0) return prev;

      const delta = type === 'deposit' ? amount : -Math.min(amount, goal.currentAmount);
      const txAmount = Math.abs(delta);
      if (txAmount <= 0) return prev;

      const tx: SavingsTransaction = {
        id: generateId('st'),
        goalId,
        goalName: goal.name,
        type,
        amount: txAmount,
        date,
        note,
        autoTracked: false,
      };

      return {
        ...prev,
        savingsGoals: prev.savingsGoals.map((g) =>
          g.id === goalId
            ? { ...g, currentAmount: Math.max(0, g.currentAmount + delta) }
            : g
        ),
        savingsTransactions: [tx, ...prev.savingsTransactions],
      };
    });
  };

  const deleteSavingsGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
    }));
  };

  // Data Management
  const resetToDemoData = () => {
    setState(buildSeedData());
  };

  const clearAllData = () => {
    setState((prev) => ({
      paychecks: [],
      autoTracker: prev.autoTracker,
      bills: [],
      expenses: [],
      debts: [],
      debtPayments: [],
      savingsGoals: [],
      savingsTransactions: [],
    }));
  };

  const importState = (next: FinanceState) => {
    setState(next);
  };

  return {
    state,
    monthlySummary,
    previousMonthSummary,
    sixMonthTrend,
    addPaycheck,
    runAutoAllocateOnPaycheck,
    deletePaycheck,
    updateAutoTrackerConfig,
    addBill,
    toggleBillStatus,
    deleteBill,
    carryForwardRecurringBills,
    addExpense,
    deleteExpense,
    addDebt,
    recordDebtPayment,
    deleteDebt,
    addSavingsGoal,
    recordSavingsTransaction,
    deleteSavingsGoal,
    resetToDemoData,
    clearAllData,
    importState,
  };
}
