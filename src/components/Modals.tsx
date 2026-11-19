import React, { useState } from 'react';
import { AlertTriangle, Download, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import {
  BillCategory,
  BillStatus,
  Debt,
  DebtType,
  ExpenseCategory,
  FinanceState,
  MonthlyBalanceSummary,
  PaycheckCategory,
  PaycheckFrequency,
  PaymentMethod,
  SavingsCategory,
  SavingsGoal,
} from '../types/finance';
import {
  estimateNigerianDeductions,
  formatMonthLabel,
  formatNGN,
  getTodayISO,
} from '../utils/currency';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  subtitle,
  onClose,
  children,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl max-h-[90vh] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto px-6 py-5">{children}</div>
    </div>
  </div>
);

/* 1. Log Paycheck Modal */
interface PaycheckModalProps {
  defaultDate: string;
  autoAllocateDefault: boolean;
  onClose: () => void;
  onSubmit: (data: {
    source: string;
    category: PaycheckCategory;
    grossAmount: number;
    deductions: number;
    netAmount: number;
    date: string;
    frequency: PaycheckFrequency;
    runAutoAllocate: boolean;
    notes?: string;
  }) => void;
}

export const PaycheckModal: React.FC<PaycheckModalProps> = ({
  defaultDate,
  autoAllocateDefault,
  onClose,
  onSubmit,
}) => {
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<PaycheckCategory>('Salary');
  const [grossAmount, setGrossAmount] = useState('');
  const [deductions, setDeductions] = useState('0');
  const [date, setDate] = useState(defaultDate);
  const [frequency, setFrequency] = useState<PaycheckFrequency>('Monthly');
  const [runAutoAllocate, setRunAutoAllocate] = useState(autoAllocateDefault);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const grossNum = Number(grossAmount) || 0;
  const dedNum = Number(deductions) || 0;
  const netAmount = Math.max(0, grossNum - dedNum);

  const handleEstimateNigerianTax = () => {
    if (grossNum <= 0) return;
    const est = estimateNigerianDeductions(grossNum);
    setDeductions(String(est.totalDeductions));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) {
      setError('Enter a paycheck source or employer name.');
      return;
    }
    if (netAmount <= 0) {
      setError('Net paycheck amount must be greater than ₦0.');
      return;
    }
    onSubmit({
      source: source.trim(),
      category,
      grossAmount: grossNum,
      deductions: dedNum,
      netAmount,
      date,
      frequency,
      runAutoAllocate,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <ModalShell
      title="Log Paycheck (NGN)"
      subtitle="Record salary or side income and optionally trigger auto-allocation rules"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Income Source
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Monthly Salary, Consulting Retainer"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PaycheckCategory)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Bonus">Bonus</option>
              <option value="Dividend">Dividend</option>
              <option value="Side Hustle">Side Hustle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as PaycheckFrequency)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="Monthly">Monthly</option>
              <option value="Bi-Weekly">Bi-Weekly</option>
              <option value="Weekly">Weekly</option>
              <option value="One-Time">One-Time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Gross Amount (₦)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={grossAmount}
              onChange={(e) => setGrossAmount(e.target.value)}
              placeholder="1000000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Deductions (₦)
              </label>
              <button
                type="button"
                onClick={handleEstimateNigerianTax}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Estimate PAYE + Pension
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="100"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <span className="text-xs font-medium text-slate-600">
            Net Take-Home Paycheck
          </span>
          <span className="font-mono text-base font-bold tabular-nums text-emerald-700">
            {formatNGN(netAmount)}
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Pay Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            required
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={runAutoAllocate}
            onChange={(e) => setRunAutoAllocate(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
          />
          <div>
            <div className="text-xs font-semibold text-slate-800">
              Auto-allocate using paycheck rules
            </div>
            <div className="text-xs text-slate-500">
              Splits net pay across Bills, Expenses, Debt, and Savings vaults immediately.
            </div>
          </div>
        </label>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional memo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Save Paycheck
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 2. Add Bill Modal */
interface BillModalProps {
  defaultDueDate: string;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: BillCategory;
    amount: number;
    dueDate: string;
    status: BillStatus;
    paidDate?: string;
    recurring: boolean;
    autoPay: boolean;
  }) => void;
}

export const BillModal: React.FC<BillModalProps> = ({
  defaultDueDate,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BillCategory>('Utilities');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [status, setStatus] = useState<BillStatus>('pending');
  const [recurring, setRecurring] = useState(true);
  const [autoPay, setAutoPay] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!name.trim() || !num || num <= 0) return;
    onSubmit({
      name: name.trim(),
      category,
      amount: num,
      dueDate,
      status,
      paidDate: status === 'paid' ? getTodayISO() : undefined,
      recurring,
      autoPay,
    });
    onClose();
  };

  return (
    <ModalShell
      title="Add Monthly Bill (NGN)"
      subtitle="Track rent, power tokens, internet, waste, and recurring subscriptions"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Bill Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. EKEDC Prepaid Power, Fibre Internet"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BillCategory)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="Housing & Rent">Housing & Rent</option>
              <option value="Power & Fuel">Power & Fuel</option>
              <option value="Internet & Airtime">Internet & Airtime</option>
              <option value="Utilities">Utilities</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Insurance">Insurance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amount (₦)
            </label>
            <input
              type="number"
              min="1"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="45000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BillStatus)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700"
            />
            <span>Recurring monthly bill (eligible for carry-forward)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPay}
              onChange={(e) => setAutoPay(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700"
            />
            <span>Direct debit / auto-pay enabled</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Save Bill
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 3. Log Expense Modal */
interface ExpenseModalProps {
  defaultDate: string;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  defaultDate,
  onClose,
  onSubmit,
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Groceries');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Bank Transfer');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!description.trim() || !num || num <= 0) return;
    onSubmit({
      description: description.trim(),
      category,
      amount: num,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <ModalShell
      title="Log Expense (NGN)"
      subtitle="Record daily spending to update your remaining monthly Naira balance"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Description / Merchant
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Market groceries, Fuel refill, Bolt trip"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="Food & Groceries">Food & Groceries</option>
              <option value="Transport & Fuel">Transport & Fuel</option>
              <option value="Dining & Leisure">Dining & Leisure</option>
              <option value="Data & Airtime">Data & Airtime</option>
              <option value="Health & Personal">Health & Personal</option>
              <option value="Family Support">Family Support</option>
              <option value="Shopping">Shopping</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amount (₦)
            </label>
            <input
              type="number"
              min="1"
              step="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="USSD">USSD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional details"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Save Expense
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 4. Add Debt Modal */
interface DebtModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Debt, 'id'>) => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({ onClose, onSubmit }) => {
  const [creditor, setCreditor] = useState('');
  const [type, setType] = useState<DebtType>('Bank Loan');
  const [originalAmount, setOriginalAmount] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [interestRate, setInterestRate] = useState('15');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDay, setDueDay] = useState('25');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orig = Number(originalAmount);
    const rem = Number(remainingBalance || originalAmount);
    const minPay = Number(minimumPayment);
    if (!creditor.trim() || orig <= 0) return;
    onSubmit({
      creditor: creditor.trim(),
      type,
      originalAmount: orig,
      remainingBalance: Math.max(0, rem),
      interestRate: Math.max(0, Number(interestRate) || 0),
      minimumPayment: Math.max(0, minPay || 0),
      dueDay: Math.min(31, Math.max(1, Number(dueDay) || 25)),
    });
    onClose();
  };

  return (
    <ModalShell
      title="Add Debt Account (NGN)"
      subtitle="Track bank loans, cooperative credit, BNPL, or personal liabilities"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Creditor / Lender
            </label>
            <input
              type="text"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              placeholder="e.g. Cooperative Loan"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Debt Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DebtType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="Bank Loan">Bank Loan</option>
              <option value="Cooperative">Cooperative</option>
              <option value="BNPL">BNPL</option>
              <option value="Credit Line">Credit Line</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Original Principal (₦)
            </label>
            <input
              type="number"
              min="1"
              step="500"
              value={originalAmount}
              onChange={(e) => setOriginalAmount(e.target.value)}
              placeholder="500000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Balance (₦)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={remainingBalance}
              onChange={(e) => setRemainingBalance(e.target.value)}
              placeholder="Leave blank if same"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              APR (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Min Payment (₦)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
              placeholder="50000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Due Day
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Save Debt
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 5. Record Debt Payment Modal */
interface DebtPaymentModalProps {
  debt: Debt;
  defaultDate: string;
  onClose: () => void;
  onSubmit: (debtId: string, amount: number, date: string, note?: string) => void;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  debt,
  defaultDate,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState(
    String(Math.min(debt.minimumPayment || debt.remainingBalance, debt.remainingBalance))
  );
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return;
    onSubmit(debt.id, num, date, note.trim() || undefined);
    onClose();
  };

  return (
    <ModalShell
      title={`Record Payment · ${debt.creditor}`}
      subtitle={`Remaining balance: ${formatNGN(debt.remainingBalance)}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Amount (₦)
            </label>
            <input
              type="number"
              min="1"
              max={debt.remainingBalance}
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Extra principal paydown"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Confirm Payment
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 6. Add Savings Goal Modal */
interface SavingsGoalModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<SavingsGoal, 'id'>) => void;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SavingsCategory>('Emergency');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [targetDate, setTargetDate] = useState('2027-12-01');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    if (!name.trim() || !target || target <= 0) return;
    onSubmit({
      name: name.trim(),
      category,
      targetAmount: target,
      currentAmount: Math.max(0, Number(currentAmount) || 0),
      monthlyTarget: Math.max(0, Number(monthlyTarget) || 0),
      targetDate,
    });
    onClose();
  };

  return (
    <ModalShell
      title="New Savings Vault (NGN)"
      subtitle="Create a Naira target for emergencies, rent renewal, or investments"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SavingsCategory)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="Emergency">Emergency</option>
              <option value="Rent & Housing">Rent & Housing</option>
              <option value="Investment">Investment</option>
              <option value="Travel">Travel</option>
              <option value="Asset">Asset</option>
              <option value="Education">Education</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Amount (₦)
            </label>
            <input
              type="number"
              min="1"
              step="1000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="2500000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Opening Balance (₦)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Monthly Target (₦)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
              placeholder="150000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Create Vault
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 7. Savings Deposit / Withdrawal Modal */
interface SavingsTxModalProps {
  goal: SavingsGoal;
  type: 'deposit' | 'withdrawal';
  defaultDate: string;
  onClose: () => void;
  onSubmit: (
    goalId: string,
    type: 'deposit' | 'withdrawal',
    amount: number,
    date: string,
    note?: string
  ) => void;
}

export const SavingsTxModal: React.FC<SavingsTxModalProps> = ({
  goal,
  type,
  defaultDate,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState(
    type === 'deposit' ? String(goal.monthlyTarget || 50000) : ''
  );
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return;
    onSubmit(goal.id, type, num, date, note.trim() || undefined);
    onClose();
  };

  return (
    <ModalShell
      title={`${type === 'deposit' ? 'Deposit to' : 'Withdraw from'} · ${goal.name}`}
      subtitle={`Current balance: ${formatNGN(goal.currentAmount)} / Target: ${formatNGN(goal.targetAmount)}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amount (₦)
            </label>
            <input
              type="number"
              min="1"
              max={type === 'withdrawal' ? goal.currentAmount : undefined}
              step="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paycheck savings transfer"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {type === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* 8. Backup & Data Management Modal */
interface DataModalProps {
  state: FinanceState;
  selectedMonth: string;
  summary: MonthlyBalanceSummary;
  onClose: () => void;
  onResetDemo: () => void;
  onClearAll: () => void;
  onImport: (next: FinanceState) => void;
}

export const DataModal: React.FC<DataModalProps> = ({
  state,
  selectedMonth,
  summary,
  onClose,
  onResetDemo,
  onClearAll,
  onImport,
}) => {
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);
  const [importError, setImportError] = useState('');

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nairaledger-backup-${selectedMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Month', 'Amount (NGN)'],
      ['Net Paycheck Income', formatMonthLabel(selectedMonth), String(summary.totalIncome)],
      ['Paid Bills', formatMonthLabel(selectedMonth), String(summary.paidBillsTotal)],
      ['Pending & Overdue Bills', formatMonthLabel(selectedMonth), String(summary.pendingBillsTotal + summary.overdueBillsTotal)],
      ['Expenses', formatMonthLabel(selectedMonth), String(summary.expensesTotal)],
      ['Debt Payments', formatMonthLabel(selectedMonth), String(summary.debtPaymentsTotal)],
      ['Net Savings Transfers', formatMonthLabel(selectedMonth), String(summary.savingsNetTotal)],
      ['Actual Cash Remaining', formatMonthLabel(selectedMonth), String(summary.actualRemainingBalance)],
      ['Projected Remaining After All Bills', formatMonthLabel(selectedMonth), String(summary.projectedRemainingBalance)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nairaledger-summary-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as FinanceState;
        if (
          parsed &&
          Array.isArray(parsed.paychecks) &&
          Array.isArray(parsed.bills) &&
          Array.isArray(parsed.expenses)
        ) {
          onImport(parsed);
          onClose();
        } else {
          setImportError('Invalid NairaLedger backup file structure.');
        }
      } catch {
        setImportError('Unable to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <ModalShell
      title="Backup & Data Management"
      subtitle="Export monthly reports, restore JSON backups, or reset local ledger data"
      onClose={onClose}
    >
      <div className="space-y-4">
        {importError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {importError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-emerald-700" />
            <span>Export Month CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Export Full JSON</span>
          </button>
        </div>

        <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">
          <Upload className="h-4 w-4 text-slate-500" />
          <span>Import JSON Backup</span>
          <input
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </label>

        <div className="border-t border-slate-200 pt-4 space-y-2.5">
          {confirmAction ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>
                  {confirmAction === 'reset'
                    ? 'Restore sample Nigerian Naira dataset? Current entries will be replaced.'
                    : 'Clear all ledger records to start from ₦0?'}
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmAction === 'reset') onResetDemo();
                    else onClearAll();
                    setConfirmAction(null);
                    onClose();
                  }}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction('reset')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Sample Data</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction('clear')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Entries</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
