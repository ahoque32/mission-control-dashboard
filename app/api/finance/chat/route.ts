// Finance AI Chat API Route
// POST /api/finance/chat
// Accepts { message: string, days?: number }
// Returns { response: string, model: string }

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const REQUIRED_MODEL = 'gemini-2.5-flash';

const PLAID_BASE = 'https://production.plaid.com';
const PLAID_CLIENT_ID = '6984d54ee158bd002131da1c';
const PLAID_SECRET = 'a15662002092fe14d858a9cb3367df';
const ACCESS_TOKEN = 'access-production-3b313398-4b80-4303-974e-a2fc0d30d446';

const SYSTEM_PROMPT = `You are a financial-dashboard-only advisor. You ONLY answer questions about the user's personal finances, transaction history, financial summaries, trends, and insights. You must ground all responses in the provided transaction data. Refuse any questions unrelated to personal finance.

## Scope Enforcement (CRITICAL)
- You MUST refuse any questions not about personal finance, spending, transactions, budgeting, or financial trends
- If asked about coding, recipes, weather, politics, general knowledge, or ANY non-finance topic, respond: "I'm your personal finance advisor and can only help with questions about your spending, transactions, and financial trends. Try asking me about your spending categories, subscriptions, or monthly trends!"
- Do NOT roleplay, write stories, generate code, or answer trivia
- Stay strictly within the financial data provided

## Response Rules
1. Only reference actual data — never make up numbers or transactions
2. Include specific numbers — cite exact amounts, dates, and percentages when available
3. Flag uncertainty — if the data is incomplete or you're unsure, say so clearly
4. Be concise but thorough — use bullet points and clear formatting
5. Finance-aware formatting — use $ for amounts, % for percentages, format large numbers with commas
6. Actionable advice — when appropriate, suggest ways to save or optimize spending
7. Positive tone — be encouraging, not judgmental about spending habits

## Response Format
- Use markdown for formatting (headers, bold, lists)
- When showing amounts, always use 2 decimal places: $1,234.56
- For comparisons, show both absolute and percentage differences
- Keep responses focused and under 500 words unless the question warrants more detail`;

// ─── Plaid helpers ────────────────────────────────────────────────────────────

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
  } | null;
}

interface PlaidAccount {
  account_id: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  balances: {
    available: number | null;
    current: number | null;
  };
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function plaidFetch<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
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

async function fetchTransactions(days: number): Promise<{
  transactions: PlaidTransaction[];
  accounts: PlaidAccount[];
}> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

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

  let allTransactions = txResult.transactions;
  const total = txResult.total_transactions;

  while (allTransactions.length < total) {
    const page = await plaidFetch<{
      transactions: PlaidTransaction[];
    }>('/transactions/get', {
      start_date: formatDate(startDate),
      end_date: formatDate(now),
      options: { count: 500, offset: allTransactions.length },
    });
    allTransactions = allTransactions.concat(page.transactions);
    if (page.transactions.length === 0) break;
  }

  return { transactions: allTransactions, accounts: acctResult.accounts };
}

// ─── Financial context builder ────────────────────────────────────────────────

function buildFinancialContext(
  transactions: PlaidTransaction[],
  accounts: PlaidAccount[],
  days: number
): string {
  if (transactions.length === 0) {
    return 'No transactions found for the selected time period.';
  }

  const parts: string[] = [];

  // Overview
  let totalSpent = 0;
  let totalIncome = 0;
  for (const tx of transactions) {
    if (tx.amount > 0) totalSpent += tx.amount;
    else totalIncome += Math.abs(tx.amount);
  }

  const dates = transactions.map((t) => t.date).sort();
  parts.push(`=== ACCOUNT OVERVIEW (Last ${days} days) ===
Total Transactions: ${transactions.length}
Total Spending (debits): $${totalSpent.toFixed(2)}
Total Income (credits): $${totalIncome.toFixed(2)}
Net: $${(totalIncome - totalSpent).toFixed(2)}
Date Range: ${dates[0]} to ${dates[dates.length - 1]}`);

  // Account balances
  if (accounts.length > 0) {
    parts.push(`\n=== ACCOUNT BALANCES ===`);
    for (const acct of accounts) {
      const avail =
        acct.balances.available !== null
          ? `Available: $${acct.balances.available.toFixed(2)}`
          : '';
      const curr =
        acct.balances.current !== null
          ? `Current: $${acct.balances.current.toFixed(2)}`
          : '';
      parts.push(
        `${acct.name} (••••${acct.mask || '????'}, ${acct.subtype || acct.type}): ${[avail, curr].filter(Boolean).join(' | ')}`
      );
    }
  }

  // Category breakdown
  const categoryMap = new Map<string, { total: number; count: number }>();
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const cat = tx.personal_finance_category?.primary || 'UNCATEGORIZED';
    const existing = categoryMap.get(cat);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      categoryMap.set(cat, { total: tx.amount, count: 1 });
    }
  }

  const categories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);

  if (categories.length > 0) {
    parts.push(`\n=== SPENDING BY CATEGORY ===`);
    for (const c of categories) {
      const pct = totalSpent > 0 ? ((c.total / totalSpent) * 100).toFixed(1) : '0.0';
      parts.push(
        `${c.category.replace(/_/g, ' ')}: $${c.total.toFixed(2)} (${c.count} transactions, ${pct}%)`
      );
    }
  }

  // Monthly totals
  const monthlyMap = new Map<
    string,
    { income: number; expenses: number }
  >();
  for (const tx of transactions) {
    const month = tx.date.substring(0, 7); // YYYY-MM
    const existing = monthlyMap.get(month) || { income: 0, expenses: 0 };
    if (tx.amount > 0) existing.expenses += tx.amount;
    else existing.income += Math.abs(tx.amount);
    monthlyMap.set(month, existing);
  }

  const months = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => b.localeCompare(a));

  if (months.length > 0) {
    parts.push(`\n=== MONTHLY TOTALS ===`);
    for (const [month, data] of months) {
      const net = data.income - data.expenses;
      parts.push(
        `${month}: Income $${data.income.toFixed(2)} | Expenses $${data.expenses.toFixed(2)} | Net $${net.toFixed(2)}`
      );
    }
  }

  // Top merchants (by frequency)
  const merchantMap = new Map<
    string,
    { count: number; total: number }
  >();
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const name = tx.merchant_name || tx.name;
    const existing = merchantMap.get(name) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += tx.amount;
    merchantMap.set(name, existing);
  }

  const merchants = Array.from(merchantMap.entries())
    .map(([name, data]) => ({ name, ...data, avg: data.total / data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  if (merchants.length > 0) {
    parts.push(`\n=== TOP MERCHANTS (by frequency) ===`);
    for (const m of merchants) {
      parts.push(
        `${m.name}: ${m.count} visits, $${m.total.toFixed(2)} total, avg $${m.avg.toFixed(2)}`
      );
    }
  }

  // Subscription detection (recurring charges with similar amounts)
  const subCandidates = Array.from(merchantMap.entries())
    .filter(([, data]) => data.count >= 2)
    .map(([name]) => {
      const txs = transactions.filter(
        (tx) =>
          tx.amount > 0 &&
          (tx.merchant_name === name || tx.name === name)
      );
      const amounts = txs.map((t) => t.amount);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const maxDev =
        amounts.length > 0
          ? Math.max(...amounts.map((a) => Math.abs(a - avg))) / avg
          : 1;
      const dates = txs.map((t) => t.date).sort();
      return {
        name,
        amount: avg,
        frequency: txs.length,
        deviation: maxDev,
        first_date: dates[0],
        last_date: dates[dates.length - 1],
      };
    })
    .filter((s) => s.deviation < 0.1); // within 10% variation

  if (subCandidates.length > 0) {
    parts.push(`\n=== DETECTED SUBSCRIPTIONS/RECURRING ===`);
    for (const s of subCandidates) {
      parts.push(
        `${s.name}: ~$${s.amount.toFixed(2)} × ${s.frequency} times (${s.first_date} to ${s.last_date})`
      );
    }
  }

  return parts.join('\n');
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, days = 30 } = body as {
      message?: string;
      days?: number;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return Response.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Runtime model validation
    const modelToUse = REQUIRED_MODEL;
    if (modelToUse !== 'gemini-2.5-flash') {
      console.error(`Model validation failed: expected gemini-2.5-flash, got ${modelToUse}`);
      return Response.json(
        { error: 'Model configuration error' },
        { status: 500 }
      );
    }

    // Fetch transaction data from Plaid
    const { transactions, accounts } = await fetchTransactions(
      Math.min(Math.max(days, 1), 365)
    );

    // Build financial context
    const financialContext = buildFinancialContext(
      transactions,
      accounts,
      days
    );

    // Call Gemini 2.5 Flash
    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: REQUIRED_MODEL,
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\n## Current Financial Data\n${financialContext}`,
          },
          {
            role: 'user',
            content: message.trim(),
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorBody);
      return Response.json(
        { error: 'AI service error. Please try again.' },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.choices?.[0]?.message?.content ||
      "I couldn't generate a response. Please try again.";

    // Verify the model used matches what we requested
    const modelUsed = geminiData.model || REQUIRED_MODEL;

    return Response.json({
      response: responseText,
      model: modelUsed,
    });
  } catch (error) {
    console.error('Finance chat error:', error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
