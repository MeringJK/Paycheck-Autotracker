import { useMemo, useState } from 'react';
import { BillsView } from './components/BillsView';
import { DashboardView } from './components/DashboardView';
import { DebtView } from './components/DebtView';
import { ExpensesView } from './components/ExpensesView';
import {
  BillModal,
  DataModal,
  DebtModal,
  DebtPaymentModal,
  ExpenseModal,
  PaycheckModal,
  SavingsGoalModal,
  SavingsTxModal,
} from './components/Modals';
import { PaycheckView } from './components/PaycheckView';
import { SavingsView } from './components/SavingsView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { useFinanceStore } from './hooks/useFinanceStore';
import { Debt, SavingsGoal, SectionId } from './types/finance';
import {
  getCurrentMonthKey,
  getTodayISO,
  shiftMonth,
} from './utils/currency';

type ActiveModal =
  | null
  | { type: 'paycheck' }
  | { type: 'bill' }
  | { type: 'expense' }
  | { type: 'debt' }
  | { type: 'debtPayment'; debt: Debt }
  | { type: 'savingsGoal' }
  | { type: 'savingsTx'; goal: SavingsGoal; txType: 'deposit' | 'withdrawal' }
  | { type: 'data' };

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const {
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
  } = useFinanceStore(selectedMonth);

  const overdueBillsCount = useMemo(
    () =>
      state.bills.filter(
        (b) => b.monthKey === selectedMonth && b.status === 'overdue'
      ).length,
    [state.bills, selectedMonth]
  );

  // Default date inside modals aligns with selectedMonth
  const defaultModalDate = useMemo(() => {
    const current = getCurrentMonthKey();
    if (selectedMonth === current) return getTodayISO();
    return `${selectedMonth}-15`;
  }, [selectedMonth]);

  const handlePrimaryAction = () => {
    switch (activeSection) {
      case 'dashboard':
      case 'paycheck':
        setActiveModal({ type: 'paycheck' });
        break;
      case 'bills':
        setActiveModal({ type: 'bill' });
        break;
      case 'expenses':
        setActiveModal({ type: 'expense' });
        break;
      case 'debt':
        setActiveModal({ type: 'debt' });
        break;
      case 'savings':
        setActiveModal({ type: 'savingsGoal' });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        selectedMonth={selectedMonth}
        summary={monthlySummary}
        overdueBillsCount={overdueBillsCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenDataModal={() => setActiveModal({ type: 'data' })}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col">
        <TopBar
          activeSection={activeSection}
          selectedMonth={selectedMonth}
          onChangeMonth={(delta) =>
            setSelectedMonth((prev) => shiftMonth(prev, delta))
          }
          onResetToCurrentMonth={() => setSelectedMonth(getCurrentMonthKey())}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onPrimaryAction={handlePrimaryAction}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardView
              state={state}
              selectedMonth={selectedMonth}
              summary={monthlySummary}
              previousSummary={previousMonthSummary}
              sixMonthTrend={sixMonthTrend}
              onNavigate={setActiveSection}
              onToggleBillPaid={(billId) => toggleBillStatus(billId)}
              onOpenPaycheckModal={() => setActiveModal({ type: 'paycheck' })}
            />
          )}

          {activeSection === 'paycheck' && (
            <PaycheckView
              paychecks={state.paychecks}
              autoTracker={state.autoTracker}
              savingsGoals={state.savingsGoals}
              debts={state.debts}
              selectedMonth={selectedMonth}
              onOpenAddPaycheck={() => setActiveModal({ type: 'paycheck' })}
              onRunAutoAllocate={runAutoAllocateOnPaycheck}
              onDeletePaycheck={deletePaycheck}
              onUpdateAutoTracker={updateAutoTrackerConfig}
            />
          )}

          {activeSection === 'bills' && (
            <BillsView
              bills={state.bills}
              selectedMonth={selectedMonth}
              onToggleBillStatus={toggleBillStatus}
              onDeleteBill={deleteBill}
              onCarryForwardRecurring={carryForwardRecurringBills}
              onOpenAddBill={() => setActiveModal({ type: 'bill' })}
            />
          )}

          {activeSection === 'expenses' && (
            <ExpensesView
              expenses={state.expenses}
              selectedMonth={selectedMonth}
              monthlyIncome={monthlySummary.totalIncome}
              onDeleteExpense={deleteExpense}
              onOpenAddExpense={() => setActiveModal({ type: 'expense' })}
            />
          )}

          {activeSection === 'debt' && (
            <DebtView
              debts={state.debts}
              debtPayments={state.debtPayments}
              selectedMonth={selectedMonth}
              onOpenAddDebt={() => setActiveModal({ type: 'debt' })}
              onOpenRecordPayment={(debt) =>
                setActiveModal({ type: 'debtPayment', debt })
              }
              onDeleteDebt={deleteDebt}
            />
          )}

          {activeSection === 'savings' && (
            <SavingsView
              goals={state.savingsGoals}
              transactions={state.savingsTransactions}
              selectedMonth={selectedMonth}
              onOpenAddGoal={() => setActiveModal({ type: 'savingsGoal' })}
              onOpenTxModal={(goal, txType) =>
                setActiveModal({ type: 'savingsTx', goal, txType })
              }
              onDeleteGoal={deleteSavingsGoal}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {activeModal?.type === 'paycheck' && (
        <PaycheckModal
          defaultDate={defaultModalDate}
          autoAllocateDefault={state.autoTracker.enabled}
          onClose={() => setActiveModal(null)}
          onSubmit={addPaycheck}
        />
      )}

      {activeModal?.type === 'bill' && (
        <BillModal
          defaultDueDate={defaultModalDate}
          onClose={() => setActiveModal(null)}
          onSubmit={addBill}
        />
      )}

      {activeModal?.type === 'expense' && (
        <ExpenseModal
          defaultDate={defaultModalDate}
          onClose={() => setActiveModal(null)}
          onSubmit={addExpense}
        />
      )}

      {activeModal?.type === 'debt' && (
        <DebtModal
          onClose={() => setActiveModal(null)}
          onSubmit={addDebt}
        />
      )}

      {activeModal?.type === 'debtPayment' && (
        <DebtPaymentModal
          debt={activeModal.debt}
          defaultDate={defaultModalDate}
          onClose={() => setActiveModal(null)}
          onSubmit={recordDebtPayment}
        />
      )}

      {activeModal?.type === 'savingsGoal' && (
        <SavingsGoalModal
          onClose={() => setActiveModal(null)}
          onSubmit={addSavingsGoal}
        />
      )}

      {activeModal?.type === 'savingsTx' && (
        <SavingsTxModal
          goal={activeModal.goal}
          type={activeModal.txType}
          defaultDate={defaultModalDate}
          onClose={() => setActiveModal(null)}
          onSubmit={recordSavingsTransaction}
        />
      )}

      {activeModal?.type === 'data' && (
        <DataModal
          state={state}
          selectedMonth={selectedMonth}
          summary={monthlySummary}
          onClose={() => setActiveModal(null)}
          onResetDemo={resetToDemoData}
          onClearAll={clearAllData}
          onImport={importState}
        />
      )}
    </div>
  );
}
