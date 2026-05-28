/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AUD' | 'CAD';

export interface User {
  id: string;
  name: string;
  email: string;
  currency: CurrencyCode;
}

export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
  predefined?: boolean;
}

export type TransactionSource = 'manual' | 'csv' | 'receipt' | 'recurring';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: CurrencyCode;
  amountBase: number; // Converted to base currency of the user
  description: string;
  categoryName: string; // E.g. "Food", "Rent", "Salary"
  type: 'EXPENSE' | 'INCOME';
  date: string; // ISO Date String YYYY-MM-DD
  source: TransactionSource;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryName: string; // If empty or 'All', represents the overall budget
  period: 'monthly' | 'weekly';
  amount: number; // The limit set
  currency: CurrencyCode;
  startOn: string; // Current month start, e.g., '2026-05-01'
}

export interface KPIOverview {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  budgetCap: number;
  budgetSpent: number;
  baseCurrency: CurrencyCode;
}

export interface ChartCategoryData {
  category: string;
  value: number;
  color: string;
  percentage: number;
}

export interface ChartMonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  currency: CurrencyCode;
  targetDate: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

