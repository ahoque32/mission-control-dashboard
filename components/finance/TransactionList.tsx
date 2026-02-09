'use client';

// ============================================================================
// TransactionList — Scrollable list of transactions
// Green for income, red for spending. Category badge as colored pill.
// Max height with overflow scroll, latest first.
// ============================================================================

interface Transaction {
  date: string;
  name: string;
  amount: number;
  category: string;
  categoryColor: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  return (
    (value < 0 ? '-' : value > 0 ? '+' : '') +
    '$' +
    abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TransactionList({
  transactions,
}: TransactionListProps) {
  // Sort latest first by date
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4">
        <h3 className="text-[#ededed] text-sm font-semibold mb-3">
          Transactions
        </h3>
        <p className="text-[#888] text-sm">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4">
      <h3 className="text-[#ededed] text-sm font-semibold mb-3">
        Transactions
      </h3>
      <div className="max-h-[400px] overflow-y-auto -mx-1 px-1 scrollbar-thin">
        <div className="flex flex-col gap-1">
          {sorted.map((tx, i) => {
            const isIncome = tx.amount > 0;

            return (
              <div
                key={`${tx.date}-${tx.name}-${i}`}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {/* Date */}
                <span className="text-[#888] text-xs w-14 min-w-[3.5rem] shrink-0 tabular-nums">
                  {formatDate(tx.date)}
                </span>

                {/* Merchant name — truncated */}
                <span className="text-[#ededed] text-sm flex-1 truncate min-w-0">
                  {tx.name}
                </span>

                {/* Category badge */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                  style={{
                    backgroundColor: `${tx.categoryColor}33`, // ~20% opacity
                    color: tx.categoryColor,
                  }}
                >
                  {tx.category}
                </span>

                {/* Amount */}
                <span
                  className={`text-sm font-semibold tabular-nums shrink-0 ${
                    isIncome ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
