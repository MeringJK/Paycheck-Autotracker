import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react';
import { Bill, BillStatus } from '../types/finance';
import { formatDateShort, formatMonthLabel, formatNGN } from '../utils/currency';

interface BillsViewProps {
  bills: Bill[];
  selectedMonth: string;
  onToggleBillStatus: (id: string, status?: BillStatus) => void;
  onDeleteBill: (id: string) => void;
  onCarryForwardRecurring: (targetMonthKey: string) => number;
  onOpenAddBill: () => void;
}

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  selectedMonth,
  onToggleBillStatus,
  onDeleteBill,
  onCarryForwardRecurring,
  onOpenAddBill,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | BillStatus>('all');
  const [search, setSearch] = useState('');
  const [carryMessage, setCarryMessage] = useState('');

  const monthBills = useMemo(
    () =>
      bills
        .filter((b) => b.monthKey === selectedMonth)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [bills, selectedMonth]
  );

  const filteredBills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monthBills.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (
        q &&
        !b.name.toLowerCase().includes(q) &&
        !b.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [monthBills, statusFilter, search]);

  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    for (const b of monthBills) {
      total += b.amount;
      if (b.status === 'paid') paid += b.amount;
      else if (b.status === 'overdue') overdue += b.amount;
      else pending += b.amount;
    }
    return { total, paid, pending, overdue };
  }, [monthBills]);

  const handleCarryForward = () => {
    const count = onCarryForwardRecurring(selectedMonth);
    setCarryMessage(
      count > 0
        ? `Copied ${count} recurring bill${count > 1 ? 's' : ''} from prior month.`
        : 'No new recurring bills found to carry forward from prior month.'
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Scheduled Bills
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatNGN(totals.total)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {monthBills.length} bills in {formatMonthLabel(selectedMonth)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Paid</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {formatNGN(totals.paid)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {monthBills.filter((b) => b.status === 'paid').length} settled
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Pending</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-600">
            {formatNGN(totals.pending)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {monthBills.filter((b) => b.status === 'pending').length} upcoming
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Overdue</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-red-600">
            {formatNGN(totals.overdue)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {monthBills.filter((b) => b.status === 'overdue').length} overdue
          </div>
        </div>
      </section>

      {/* Filter Toolbar & Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
            {(['all', 'pending', 'paid', 'overdue'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
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
                placeholder="Search bills..."
                className="w-48 sm:w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleCarryForward}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Copy Prior Recurring</span>
            </button>
          </div>
        </div>

        {carryMessage && (
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5 flex items-center justify-between text-xs text-slate-700">
            <span>{carryMessage}</span>
            <button
              type="button"
              onClick={() => setCarryMessage('')}
              className="font-medium text-emerald-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {filteredBills.length === 0 ? (
          <div className="p-10 text-center">
            <ReceiptText className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No bills match this view
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add a bill for {formatMonthLabel(selectedMonth)} or copy recurring
              bills from the previous month.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onOpenAddBill}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Add Bill
              </button>
              <button
                type="button"
                onClick={handleCarryForward}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Copy Prior Month Bills
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-6 pr-3">Bill</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Amount (₦)</th>
                  <th className="py-3 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pl-6 pr-3">
                      <div className="font-medium text-slate-900">{b.name}</div>
                      <div className="text-xs text-slate-500">
                        {b.category}
                        {b.recurring ? ' · Recurring' : ''}
                        {b.autoPay ? ' · Auto-pay' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDateShort(b.dueDate)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {b.status === 'paid' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            Paid{b.paidDate ? ` · ${formatDateShort(b.paidDate)}` : ''}
                          </span>
                        </span>
                      )}
                      {b.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Pending</span>
                        </span>
                      )}
                      {b.status === 'overdue' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Overdue</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                      {formatNGN(b.amount)}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleBillStatus(b.id)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            b.status === 'paid'
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          {b.status === 'paid' ? 'Reopen' : 'Mark Paid'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBill(b.id)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete bill ${b.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
