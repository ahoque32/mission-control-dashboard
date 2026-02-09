'use client';

// ============================================================================
// AccountBalances — Cards showing each linked account with balances
// ============================================================================

interface Account {
  name: string;
  mask: string;
  available: number;
  current: number;
  type: string;
}

interface AccountBalancesProps {
  accounts: Account[];
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

/** Map account type to a friendly icon */
function accountIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'checking':
      return '🏦';
    case 'savings':
      return '🐷';
    case 'credit':
    case 'credit card':
      return '💳';
    case 'investment':
    case 'brokerage':
      return '📊';
    default:
      return '🏛️';
  }
}

export default function AccountBalances({ accounts }: AccountBalancesProps) {
  if (accounts.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4">
        <h3 className="text-[#ededed] text-sm font-semibold mb-3">
          Accounts
        </h3>
        <p className="text-[#888] text-sm">No linked accounts.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[#ededed] text-sm font-semibold mb-3">Accounts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acct) => (
          <div
            key={`${acct.name}-${acct.mask}`}
            className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4 flex flex-col gap-2"
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{accountIcon(acct.type)}</span>
                <div>
                  <span className="text-[#ededed] text-sm font-medium">
                    {acct.name}
                  </span>
                  <span className="text-[#888] text-xs ml-2">
                    ••••{acct.mask}
                  </span>
                </div>
              </div>
              <span className="text-[#888] text-xs capitalize">
                {acct.type}
              </span>
            </div>

            {/* Balances */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-col">
                <span className="text-[#888] text-xs">Available</span>
                <span className="text-[#ededed] text-lg font-bold tabular-nums">
                  {formatCurrency(acct.available)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[#888] text-xs">Current</span>
                <span className="text-[#888] text-sm font-medium tabular-nums">
                  {formatCurrency(acct.current)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
