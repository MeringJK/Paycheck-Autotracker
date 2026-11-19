export function formatNGN(amount: number, showDecimals = false): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(abs);
  return `${isNegative ? '-' : ''}₦${formatted}`;
}

export function formatNGNCompact(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `₦${(abs / 1_000_000).toFixed(2)}M`;
  } else if (abs >= 1_000) {
    formatted = `₦${(abs / 1_000).toFixed(1)}K`;
  } else {
    formatted = `₦${abs.toFixed(0)}`;
  }
  return isNegative ? `-${formatted}` : formatted;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatShortMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Estimates Nigerian statutory monthly payroll deductions (Pension 8%, NHF 2.5%, and simplified PITA PAYE)
 * given a monthly gross salary in NGN. Used as an optional helper when logging gross salary.
 */
export function estimateNigerianDeductions(monthlyGross: number): {
  pension: number;
  nhf: number;
  paye: number;
  totalDeductions: number;
  netPay: number;
} {
  if (monthlyGross <= 0) {
    return { pension: 0, nhf: 0, paye: 0, totalDeductions: 0, netPay: 0 };
  }

  const annualGross = monthlyGross * 12;
  const annualPension = annualGross * 0.08;
  const annualNhf = annualGross * 0.025;
  const consolidatedRelief =
    Math.max(200_000, annualGross * 0.01) + annualGross * 0.2;
  const taxableIncome = Math.max(
    0,
    annualGross - annualPension - annualNhf - consolidatedRelief
  );

  // Nigerian Finance Act / PITA annual progressive tax bands
  const bands: Array<[number, number]> = [
    [300_000, 0.07],
    [300_000, 0.11],
    [500_000, 0.15],
    [500_000, 0.19],
    [1_600_000, 0.21],
    [Infinity, 0.24],
  ];

  let remaining = taxableIncome;
  let annualTax = 0;
  for (const [limit, rate] of bands) {
    if (remaining <= 0) break;
    const chunk = Math.min(remaining, limit);
    annualTax += chunk * rate;
    remaining -= chunk;
  }

  // Minimum tax 1% of gross if taxable income is zero/low
  const minTax = annualGross * 0.01;
  annualTax = Math.max(annualTax, annualGross > 360_000 ? minTax : 0);

  const pension = Math.round(annualPension / 12);
  const nhf = Math.round(annualNhf / 12);
  const paye = Math.round(annualTax / 12);
  const totalDeductions = pension + nhf + paye;
  const netPay = Math.max(0, Math.round(monthlyGross - totalDeductions));

  return { pension, nhf, paye, totalDeductions, netPay };
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
