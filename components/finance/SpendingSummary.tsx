'use client';

// ============================================================================
// SpendingSummary — 4 summary cards: Total Spent, Total Income, Net, Count
// Mobile: 2x2 grid. Desktop: 4 across.
// ============================================================================

interface SpendingSummaryProps {
  totalSpent: number;
  totalIncome: number;
  net: number;
  count: number;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  return (
    (value < 0 ? '-' : '') +
    '$' +
    abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

interface CardProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}

function SummaryCard({ label, value, color, icon }: CardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[#888] text-sm font-medium">{label}</span>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${color}`}>
        {value}
      </span>
    </div>
  );
}

export default function SpendingSummary({
  totalSpent,
  totalIncome,
  net,
  count,
}: SpendingSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <SummaryCard
        label="Total Spent"
        value={formatCurrency(totalSpent)}
        color="text-red-400"
        icon="💸"
      />
      <SummaryCard
        label="Total Income"
        value={formatCurrency(totalIncome)}
        color="text-green-400"
        icon="💰"
      />
      <SummaryCard
        label="Net"
        value={formatCurrency(net)}
        color={net >= 0 ? 'text-blue-400' : 'text-red-400'}
        icon={net >= 0 ? '📈' : '📉'}
      />
      <SummaryCard
        label="Transactions"
        value={count.toLocaleString()}
        color="text-[#888]"
        icon="🔢"
      />
    </div>
  );
}
