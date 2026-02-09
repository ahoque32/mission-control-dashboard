'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Category Color Map ──────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
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

export const DEFAULT_CATEGORY_COLOR = '#64748b';

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface Transaction {
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

export interface Account {
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

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  count: number;
  color: string;
}

export interface FinanceSummary {
  totalSpent: number;
  totalIncome: number;
  net: number;
  transactionCount: number;
}

export interface UseFinanceReturn {
  transactions: Transaction[];
  accounts: Account[];
  categoryBreakdown: CategoryBreakdownItem[];
  summary: FinanceSummary;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface ApiResponse {
  transactions: Transaction[];
  accounts: Account[];
  totalSpent: number;
  totalIncome: number;
  categoryBreakdown: CategoryBreakdownItem[];
  error?: string;
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useFinance(days: number = 30): UseFinanceReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalSpent: 0,
    totalIncome: 0,
    net: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error ?? `API error: ${res.status}`
        );
      }

      const data: ApiResponse = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTransactions(data.transactions);
      setAccounts(data.accounts);
      setCategoryBreakdown(data.categoryBreakdown);
      setSummary({
        totalSpent: data.totalSpent,
        totalIncome: data.totalIncome,
        net: Math.round((data.totalIncome - data.totalSpent) * 100) / 100,
        transactionCount: data.transactions.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    transactions,
    accounts,
    categoryBreakdown,
    summary,
    loading,
    error,
    refetch: fetchData,
  };
}
