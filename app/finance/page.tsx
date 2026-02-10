'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import FinanceChat from '../../components/finance/FinanceChat';
import FinanceChatErrorBoundary from '../../components/finance/FinanceChatErrorBoundary';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaidTransaction {
  transaction_id: string;
  date: string;
  name: string;
  amount: number;
  account_id: string;
  personal_finance_category: {
    primary: string;
    detailed: string;
  };
}

interface PlaidAccount {
  account_id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  balances: {
    available: number | null;
    current: number | null;
  };
}

interface PlaidResponse {
  transactions: PlaidTransaction[];
  accounts: PlaidAccount[];
  total_transactions: number;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  LOAN_PAYMENTS:        { bg: 'bg-red-500/15',    text: 'text-red-400',    bar: 'bg-red-500' },
  ENTERTAINMENT:        { bg: 'bg-purple-500/15', text: 'text-purple-400', bar: 'bg-purple-500' },
  TRAVEL:               { bg: 'bg-blue-500/15',   text: 'text-blue-400',   bar: 'bg-blue-500' },
  FOOD_AND_DRINK:       { bg: 'bg-orange-500/15', text: 'text-orange-400', bar: 'bg-orange-500' },
  TRANSFER_IN:          { bg: 'bg-gray-500/15',   text: 'text-gray-400',   bar: 'bg-gray-500' },
  TRANSFER_OUT:         { bg: 'bg-gray-500/15',   text: 'text-gray-400',   bar: 'bg-gray-500' },
  GENERAL_MERCHANDISE:  { bg: 'bg-teal-500/15',   text: 'text-teal-400',   bar: 'bg-teal-500' },
  GENERAL_SERVICES:     { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   bar: 'bg-cyan-500' },
  RENT_AND_UTILITIES:   { bg: 'bg-yellow-500/15', text: 'text-yellow-400', bar: 'bg-yellow-500' },
  TRANSPORTATION:       { bg: 'bg-indigo-500/15', text: 'text-indigo-400', bar: 'bg-indigo-500' },
  PERSONAL_CARE:        { bg: 'bg-pink-500/15',   text: 'text-pink-400',   bar: 'bg-pink-500' },
  MEDICAL:              { bg: 'bg-rose-500/15',   text: 'text-rose-400',   bar: 'bg-rose-500' },
  INCOME:               { bg: 'bg-green-500/15',  text: 'text-green-400',  bar: 'bg-green-500' },
  GOVERNMENT_AND_NON_PROFIT: { bg: 'bg-amber-500/15', text: 'text-amber-400', bar: 'bg-amber-500' },
  HOME_IMPROVEMENT:     { bg: 'bg-lime-500/15',   text: 'text-lime-400',   bar: 'bg-lime-500' },
  BANK_FEES:            { bg: 'bg-red-600/15',    text: 'text-red-300',    bar: 'bg-red-600' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-500/15', text: 'text-slate-400', bar: 'bg-slate-500' };

const TIME_PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const ACCOUNT_NAMES: Record<string, string> = {};

const PAYOUT_RECIPIENTS = [
  { key: 'luke', label: 'Luke', email: 'lukeianestesalona@gmail.com' },
  { key: 'richard', label: 'Richard', email: 'rjosephporter@gmail.com' },
  { key: 'jerome', label: 'Jerome', email: 'jeromeabamjr@icloud.com' },
  { key: 'zoren', label: 'Zoren', email: 'zorenmangubat693@gmail.com' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

function formatCategoryName(category: string): string {
  return category
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAccountDisplayName(account: PlaidAccount): string {
  return ACCOUNT_NAMES[account.mask] || account.name;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<PlaidResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PayPal Payout state
  const [payoutRecipient, setPayoutRecipient] = useState('luke');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutResult, setPayoutResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Convex payout data
  const recentPayouts = useQuery(api.payouts.list, { limit: 10 });
  const logPayout = useMutation(api.payouts.create);

  const fetchData = useCallback(async (period: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/plaid/transactions?days=${period}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  const sendPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      setPayoutResult({ type: 'error', message: 'Enter a valid amount' });
      return;
    }

    setPayoutLoading(true);
    setPayoutResult(null);

    try {
      const res = await fetch('/api/paypal/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: payoutRecipient, amount }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      // Log to Convex
      await logPayout({
        recipient: payoutRecipient,
        email: json.email,
        amount,
        status: json.status || 'PENDING',
        paypalBatchId: json.batch_id,
      });

      setPayoutResult({
        type: 'success',
        message: `Payment of $${amount.toFixed(2)} sent to ${payoutRecipient}! Batch: ${json.batch_id}`,
      });
      setPayoutAmount('');
    } catch (err) {
      setPayoutResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send payout',
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  // ── Computed values ──

  const { totalSpent, totalIncome, net, txCount } = useMemo(() => {
    if (!data?.transactions) return { totalSpent: 0, totalIncome: 0, net: 0, txCount: 0 };
    let spent = 0;
    let income = 0;
    for (const tx of data.transactions) {
      if (tx.amount > 0) spent += tx.amount;
      else income += Math.abs(tx.amount);
    }
    return {
      totalSpent: spent,
      totalIncome: income,
      net: income - spent,
      txCount: data.transactions.length,
    };
  }, [data]);

  const categoryBreakdown = useMemo(() => {
    if (!data?.transactions) return [];
    const map = new Map<string, number>();
    for (const tx of data.transactions) {
      if (tx.amount <= 0) continue; // skip income for category breakdown
      const cat = tx.personal_finance_category?.primary || 'OTHER';
      map.set(cat, (map.get(cat) || 0) + tx.amount);
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const maxCategoryAmount = categoryBreakdown[0]?.amount || 1;

  // ── Loading state ──

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888] text-sm">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-sm w-full text-center">
          <p className="text-red-400 font-medium mb-2">Error</p>
          <p className="text-[#888] text-sm">{error}</p>
          <button
            onClick={() => fetchData(days)}
            className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[#ededed] text-sm hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#ededed] mb-1">Finance</h1>
        <p className="text-[#888] text-sm">Spending & transactions overview</p>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {TIME_PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              days === p.days
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-[#888] border border-white/10 hover:bg-white/10 hover:text-[#ededed]'
            }`}
          >
            {p.label}
          </button>
        ))}
        {loading && (
          <div className="flex items-center ml-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <SummaryCard label="Total Spent" value={formatCurrency(totalSpent)} color="text-red-400" />
        <SummaryCard label="Total Income" value={formatCurrency(totalIncome)} color="text-green-400" />
        <SummaryCard
          label="Net"
          value={formatCurrency(net)}
          color={net >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <SummaryCard label="Transactions" value={txCount.toLocaleString()} color="text-blue-400" />
      </div>

      {/* Category Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#ededed] mb-4">Spending by Category</h2>
        <div className="space-y-3">
          {categoryBreakdown.map(({ category, amount }) => {
            const color = getCategoryColor(category);
            const pct = (amount / maxCategoryAmount) * 100;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                      {formatCategoryName(category)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#ededed]">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {categoryBreakdown.length === 0 && (
            <p className="text-[#888] text-sm text-center py-4">No spending data</p>
          )}
        </div>
      </div>

      {/* Account Balances */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#ededed] mb-4">Account Balances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data?.accounts?.map((account) => (
            <div
              key={account.account_id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-[#ededed]">
                    {getAccountDisplayName(account)}
                  </p>
                  <p className="text-xs text-[#888]">
                    ••••{account.mask} · {account.subtype}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                {account.balances.available !== null && (
                  <div className="flex justify-between">
                    <span className="text-xs text-[#888]">Available</span>
                    <span className="text-sm font-medium text-green-400">
                      {formatCurrency(account.balances.available)}
                    </span>
                  </div>
                )}
                {account.balances.current !== null && (
                  <div className="flex justify-between">
                    <span className="text-xs text-[#888]">Current</span>
                    <span className="text-sm font-medium text-[#ededed]">
                      {formatCurrency(account.balances.current)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4 md:p-6">
        <h2 className="text-lg font-semibold text-[#ededed] mb-4">Recent Transactions</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data?.transactions?.map((tx) => {
            const color = getCategoryColor(tx.personal_finance_category?.primary || 'OTHER');
            const isIncome = tx.amount < 0;
            return (
              <div
                key={tx.transaction_id}
                className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                {/* Date */}
                <div className="text-xs text-[#888] w-16 shrink-0">
                  {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>

                {/* Merchant & Category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#ededed] truncate">{tx.name}</p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${color.bg} ${color.text} inline-block mt-0.5`}
                  >
                    {formatCategoryName(tx.personal_finance_category?.primary || 'Other')}
                  </span>
                </div>

                {/* Amount */}
                <div className={`text-sm font-medium shrink-0 ${isIncome ? 'text-green-400' : 'text-[#ededed]'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </div>
              </div>
            );
          })}
          {(!data?.transactions || data.transactions.length === 0) && (
            <p className="text-[#888] text-sm text-center py-4">No transactions found</p>
          )}
        </div>
      </div>

      {/* PayPal Payout Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#ededed] mb-4">💸 Send PayPal Payout</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          {/* Recipient */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-[#888] uppercase tracking-wide mb-1">Recipient</label>
            <select
              value={payoutRecipient}
              onChange={(e) => setPayoutRecipient(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#ededed] focus:outline-none focus:border-blue-500/50"
            >
              {PAYOUT_RECIPIENTS.map((r) => (
                <option key={r.key} value={r.key} className="bg-[#1a1a1a]">
                  {r.label} ({r.email})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="w-full sm:w-40">
            <label className="block text-xs text-[#888] uppercase tracking-wide mb-1">Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#ededed] focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendPayout}
            disabled={payoutLoading || !payoutAmount}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {payoutLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Payment'
            )}
          </button>
        </div>

        {/* Feedback */}
        {payoutResult && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm ${
              payoutResult.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {payoutResult.message}
          </div>
        )}
      </div>

      {/* Recent Payouts Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#ededed] mb-4">Recent Payouts</h2>
        {recentPayouts && recentPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase tracking-wide border-b border-white/10">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-left py-2 pr-4">Recipient</th>
                  <th className="text-right py-2 pr-4">Amount</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2">Batch ID</th>
                </tr>
              </thead>
              <tbody>
                {recentPayouts.map((p) => (
                  <tr key={p._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2 pr-4 text-[#888]">
                      {new Date(p.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 pr-4 text-[#ededed] capitalize">{p.recipient}</td>
                    <td className="py-2 pr-4 text-right text-green-400 font-medium">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'SUCCESS'
                            ? 'bg-green-500/15 text-green-400'
                            : p.status === 'PENDING'
                              ? 'bg-yellow-500/15 text-yellow-400'
                              : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-[#888] text-xs font-mono truncate max-w-[200px]">
                      {p.paypalBatchId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#888] text-sm text-center py-4">No payouts yet</p>
        )}
      </div>

      {/* AI Finance Chat */}
      <FinanceChatErrorBoundary>
        <FinanceChat days={days} />
      </FinanceChatErrorBoundary>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-4">
      <p className="text-xs text-[#888] uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg md:text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
