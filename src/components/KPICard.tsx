/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Target, Award } from 'lucide-react';
import { KPIOverview } from '../types';

interface KPICardProps {
  kpi: KPIOverview;
}

export default function KPICard({ kpi }: KPICardProps) {
  const currencySymbol = kpi.baseCurrency === 'INR' ? '₹' : '$';
  
  // Format numbers to clean locale strings
  const formatValue = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: kpi.baseCurrency,
      maximumFractionDigits: 0
    }).format(val);
  };

  const budgetProgress = kpi.budgetCap > 0 ? (kpi.budgetSpent / kpi.budgetCap) * 100 : 0;
  const isBudgetWarning = budgetProgress >= 85;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Total Income Card */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-[126px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Monthly Inflow
            </span>
            <span className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950 block tracking-tight">
              {formatValue(kpi.totalIncome)}
            </span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100/30">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="font-sans text-xs font-medium text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md">
            +100%
          </span>
          <span className="font-sans text-[11px] text-zinc-400">Total verified incoming</span>
        </div>
      </div>

      {/* 2. Total Outgoing Expenses Card */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-[126px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Gross Outflow
            </span>
            <span className="font-sans font-bold text-2xl sm:text-3xl text-rose-650 block tracking-tight">
              {formatValue(kpi.totalExpense)}
            </span>
          </div>
          <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-650 border border-rose-100/30">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="font-sans text-xs font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md">
            {(kpi.totalIncome > 0 ? (kpi.totalExpense / kpi.totalIncome) * 100 : 0).toFixed(0)}%
          </span>
          <span className="font-sans text-[11px] text-zinc-400">of total earnings</span>
        </div>
      </div>

      {/* 3. Savings Card */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-[126px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Net Savings
            </span>
            <span className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950 block tracking-tight">
              {formatValue(kpi.netSavings)}
            </span>
          </div>
          <div className="h-10 w-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white">
            <PiggyBank className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="font-sans text-xs font-semibold text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
            <Award className="h-3 w-3 text-amber-500" />
            {kpi.savingsRate}%
          </span>
          <span className="font-sans text-[11px] text-zinc-400">Monthly savings rate</span>
        </div>
      </div>

      {/* 4. Active Budgets Card */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-[126px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Active Budget Cap
            </span>
            <span className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950 block tracking-tight">
              {kpi.budgetCap > 0 ? formatValue(kpi.budgetCap) : 'No Limit'}
            </span>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${
            isBudgetWarning
              ? 'bg-rose-50 text-rose-605 border-rose-200/50 animate-bounce'
              : 'bg-indigo-50 text-indigo-600 border-indigo-100/30'
          }`}>
            <Target className="h-5 w-5" />
          </div>
        </div>
        
        {/* Progress Bar indicator */}
        <div className="mt-2 w-full">
          <div className="flex justify-between text-[10px] font-medium text-zinc-400 mb-1">
            <span>Spent: {formatValue(kpi.budgetSpent)}</span>
            <span>{Math.round(budgetProgress)}%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              className={`h-full rounded-full transition-all duration-500 ease-out-back ${
                isBudgetWarning ? 'bg-rose-650' : 'bg-zinc-900'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
