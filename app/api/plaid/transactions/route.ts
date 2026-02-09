const PLAID_BASE = 'https://production.plaid.com';
const PLAID_CLIENT_ID = '6984d54ee158bd002131da1c';
const PLAID_SECRET = 'a15662002092fe14d858a9cb3367df';
const ACCESS_TOKEN = 'access-production-3b313398-4b80-4303-974e-a2fc0d30d446';

interface PlaidRequestBody {
  days?: number;
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  personal_finance_category: {
    primary: string;
    detailed: string;
    confidence_level: string;
  } | null;
  pending: boolean;
  category: string[] | null;
  authorized_date: string | null;
  logo_url: string | null;
}

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string | null;
  };
  mask: string | null;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function plaidFetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PLAID_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: ACCESS_TOKEN,
      ...body,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Plaid ${endpoint} failed: ${res.status} — ${(err as Record<string, string>).error_message || res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

const CATEGORY_COLORS: Record<string, string> = {
  LOAN_PAYMENTS: '#ef4444',
  ENTERTAINMENT: '#a855f7',
  TRAVEL: '#3b82f6',
  FOOD_AND_DRINK: '#f97316',
  GENERAL_MERCHANDISE: '#22c55e',
  GENERAL_SERVICES: '#06b6d4',
  TRANSFER_IN: '#10b981',
  TRANSFER_OUT: '#6b7280',
  INCOME: '#22c55e',
  PERSONAL_CARE: '#ec4899',
  RENT_AND_UTILITIES: '#eab308',
  TRANSPORTATION: '#8b5cf6',
};

const DEFAULT_COLOR = '#64748b';

export async function POST(request: Request) {
  try {
    const body: PlaidRequestBody = await request.json().catch(() => ({}));
    const days = body.days ?? 30;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Fetch transactions and accounts in parallel
    const [txResult, acctResult] = await Promise.all([
      plaidFetch<{
        transactions: PlaidTransaction[];
        total_transactions: number;
      }>('/transactions/get', {
        start_date: formatDate(startDate),
        end_date: formatDate(now),
        options: { count: 500, offset: 0 },
      }),
      plaidFetch<{ accounts: PlaidAccount[] }>('/accounts/get', {}),
    ]);

    // Paginate if there are more transactions
    let allTransactions = txResult.transactions;
    const total = txResult.total_transactions;

    while (allTransactions.length < total) {
      const page = await plaidFetch<{
        transactions: PlaidTransaction[];
        total_transactions: number;
      }>('/transactions/get', {
        start_date: formatDate(startDate),
        end_date: formatDate(now),
        options: { count: 500, offset: allTransactions.length },
      });
      allTransactions = allTransactions.concat(page.transactions);
      if (page.transactions.length === 0) break;
    }

    // Calculate totals
    // Plaid: positive amount = money spent (debit), negative amount = money received (credit)
    let totalSpent = 0;
    let totalIncome = 0;
    const categoryMap = new Map<string, { amount: number; count: number }>();

    for (const tx of allTransactions) {
      if (tx.amount > 0) {
        totalSpent += tx.amount;
      } else {
        totalIncome += Math.abs(tx.amount);
      }

      const category =
        tx.personal_finance_category?.primary ?? 'UNCATEGORIZED';
      const existing = categoryMap.get(category);
      if (existing) {
        existing.amount += Math.abs(tx.amount);
        existing.count += 1;
      } else {
        categoryMap.set(category, { amount: Math.abs(tx.amount), count: 1 });
      }
    }

    // Build sorted category breakdown
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
        color: CATEGORY_COLORS[category] ?? DEFAULT_COLOR,
      }))
      .sort((a, b) => b.amount - a.amount);

    return Response.json({
      transactions: allTransactions,
      accounts: acctResult.accounts,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Plaid API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
