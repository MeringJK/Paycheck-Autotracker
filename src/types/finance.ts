export type SectionId =
  | 'dashboard'
  | 'paycheck'
  | 'bills'
  | 'expenses'
  | 'debt'
  | 'savings';

export type PaycheckCategory =
  | 'Salary'
  | 'Freelance'
  | 'Bonus'
  | 'Dividend'
  | 'Side Hustle';

export type PaycheckFrequency =
  | 'Monthly'
  | 'Bi-Weekly'
  | 'Weekly'
  | 'One-Time';

export interface AllocationBreakdown {
  bills: number;
  expenses: number;
  debt: number;
  savings: number;
}

export interface Paycheck {
  id: string;
  source: string;
  category: PaycheckCategory;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  date: string; // YYYY-MM-DD
  frequency: PaycheckFrequency;
  autoAllocated: boolean;
  allocationBreakdown?: AllocationBreakdown;
  notes?: string;
}

export type AllocationBucket = 'bills' | 'expenses' | 'debt' | 'savings';

export interface AutoAllocationRule {
  bucket: AllocationBucket;
  label: string;
  percentage: number;
  description: string;
}

export interface AutoTrackerConfig {
  enabled: boolean;
  autoPostToVaults: boolean;
  defaultSavingsGoalId: string;
  defaultDebtId: string;
  rules: AutoAllocationRule[];
}

export type BillCategory =
  | 'Housing & Rent'
  | 'Power & Fuel'
  | 'Internet & Airtime'
  | 'Utilities'
  | 'Subscriptions'
  | 'Insurance'
  | 'Other';

export type BillStatus = 'paid' | 'pending' | 'overdue';

export interface Bill {
  id: string;
  name: string;
  category: BillCategory;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  status: BillStatus;
  paidDate?: string;
  recurring: boolean;
  autoPay: boolean;
}

export type ExpenseCategory =
  | 'Food & Groceries'
  | 'Transport & Fuel'
  | 'Dining & Leisure'
  | 'Data & Airtime'
  | 'Health & Personal'
  | 'Family Support'
  | 'Shopping'
  | 'Miscellaneous';

export type PaymentMethod =
  | 'Bank Transfer'
  | 'Debit Card'
  | 'Cash'
  | 'USSD';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type DebtType =
  | 'Bank Loan'
  | 'Cooperative'
  | 'BNPL'
  | 'Credit Line'
  | 'Personal';

export interface Debt {
  id: string;
  creditor: string;
  type: DebtType;
  originalAmount: number;
  remainingBalance: number;
  interestRate: number; // Annual %
  minimumPayment: number;
  dueDay: number;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  debtName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  autoTracked?: boolean;
}

export type SavingsCategory =
  | 'Emergency'
  | 'Rent & Housing'
  | 'Investment'
  | 'Travel'
  | 'Asset'
  | 'Education';

export interface SavingsGoal {
  id: string;
  name: string;
  category: SavingsCategory;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget: number;
  targetDate: string; // YYYY-MM-DD
}

export interface SavingsTransaction {
  id: string;
  goalId: string;
  goalName: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  autoTracked?: boolean;
}

export interface FinanceState {
  paychecks: Paycheck[];
  autoTracker: AutoTrackerConfig;
  bills: Bill[];
  expenses: Expense[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  savingsGoals: SavingsGoal[];
  savingsTransactions: SavingsTransaction[];
}

export interface MonthlyBalanceSummary {
  monthKey: string;
  totalIncome: number;
  totalGrossIncome: number;
  totalDeductions: number;
  paidBillsTotal: number;
  pendingBillsTotal: number;
  overdueBillsTotal: number;
  totalBills: number;
  expensesTotal: number;
  debtPaymentsTotal: number;
  savingsDepositsTotal: number;
  savingsWithdrawalsTotal: number;
  savingsNetTotal: number;
  actualOutflows: number;
  committedOutflows: number;
  actualRemainingBalance: number;
  projectedRemainingBalance: number;
  savingsRatePercent: number;
}
