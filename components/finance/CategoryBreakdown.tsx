'use client';

// ============================================================================
// CategoryBreakdown — Horizontal bar chart of spending by category
// Pure CSS bars, no chart libraries. Sorted by amount descending.
// ============================================================================

interface Category {
  category: string;
  amount: number;
  count: number;
  color: string;
}

interface CategoryBreakdownProps {
  categories: Category[];
}

function formatCurrency(value: number): string {
  return (
    '$' +
    Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export default function CategoryBreakdown({
  categories,
}: CategoryBreakdownProps) {
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  const maxAmount = sorted.length > 0 ? sorted[0].amount : 1;

  if (sorted.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4">
        <h3 className="text-[#ededed] text-sm font-semibold mb-3">
          Spending by Category
        </h3>
        <p className="text-[#888] text-sm">No category data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4">
      <h3 className="text-[#ededed] text-sm font-semibold mb-4">
        Spending by Category
      </h3>
      <div className="flex flex-col gap-3">
        {sorted.map((cat) => {
          const widthPct = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;

          return (
            <div key={cat.category} className="flex items-center gap-3">
              {/* Category name */}
              <span className="text-[#ededed] text-sm w-28 min-w-[7rem] truncate shrink-0">
                {cat.category}
              </span>

              {/* Bar */}
              <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-500 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: cat.color,
                    opacity: 0.7,
                  }}
                />
              </div>

              {/* Amount + count */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#ededed] text-sm font-medium tabular-nums">
                  {formatCurrency(cat.amount)}
                </span>
                <span className="text-[#888] text-xs">
                  ({cat.count})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
