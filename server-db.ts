/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { User, Transaction, Budget, Category, CurrencyCode, SavingsGoal } from './src/types';

// Multi-currency exchange rates relative to USD (base)
export const FX_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  INR: 83.33,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.51,
  CAD: 1.37,
};

export interface DbSchema {
  users: Record<string, {
    user: User;
    passwordHash: string; // SHA256 hashed password
  }>;
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  goals: SavingsGoal[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Predefined categories
export const PREDEFINED_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food & Dining', type: 'EXPENSE', icon: 'Utensils', color: 'emerald', predefined: true },
  { id: 'cat-housing', name: 'Housing & Rent', type: 'EXPENSE', icon: 'Home', color: 'blue', predefined: true },
  { id: 'cat-transit', name: 'Transport & Fuel', type: 'EXPENSE', icon: 'Car', color: 'amber', predefined: true },
  { id: 'cat-shopping', name: 'Shopping & Entertainment', type: 'EXPENSE', icon: 'ShoppingBag', color: 'purple', predefined: true },
  { id: 'cat-bills', name: 'Bills & Utilities', type: 'EXPENSE', icon: 'Zap', color: 'red', predefined: true },
  { id: 'cat-education', name: 'Education & Learning', type: 'EXPENSE', icon: 'BookOpen', color: 'indigo', predefined: true },
  { id: 'cat-health', name: 'Health & Fitness', type: 'EXPENSE', icon: 'Heart', color: 'pink', predefined: true },
  { id: 'cat-travel', name: 'Travel & Leisure', type: 'EXPENSE', icon: 'Plane', color: 'teal', predefined: true },
  { id: 'cat-misc', name: 'Miscellaneous', type: 'EXPENSE', icon: 'HelpCircle', color: 'slate', predefined: true },
  
  { id: 'cat-salary', name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: 'green', predefined: true },
  { id: 'cat-freelance', name: 'Freelance & Consulting', type: 'INCOME', icon: 'Laptop', color: 'cyan', predefined: true },
  { id: 'cat-invest', name: 'Investments', type: 'INCOME', icon: 'TrendingUp', color: 'violet', predefined: true },
  { id: 'cat-gifts', name: 'Gifts & Grants', type: 'INCOME', icon: 'Gift', color: 'rose', predefined: true },
  { id: 'cat-other-inc', name: 'Other Income', type: 'INCOME', icon: 'Landmark', color: 'emerald', predefined: true },
];

// Memory fallback to guarantee uptime even if filesystem has locking or directory issues
let memoryDb: DbSchema = {
  users: {},
  transactions: [],
  budgets: [],
  categories: [...PREDEFINED_CATEGORIES],
  goals: []
};

// Sync database state from disk or initialize it
export function initDb(): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Clean merge with fallback DB
      memoryDb.users = parsed.users || {};
      memoryDb.transactions = parsed.transactions || [];
      memoryDb.budgets = parsed.budgets || [];
      memoryDb.goals = parsed.goals || [];
      
      // Merge predefined categories cleanly with newly added ones
      const existingCats = parsed.categories || [];
      memoryDb.categories = [
        ...PREDEFINED_CATEGORIES,
        ...existingCats.filter((c: Category) => !c.predefined)
      ];
    } else {
      saveDb();
    }
  } catch (error) {
    console.error('Database initialization failed, using high-speed in-memory database:', error);
  }
}

export function saveDb(): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (error) {
    console.error('Database save failed on disk, persisting in-memory:', error);
  }
}

// Convert from any currency to another
export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  // Convert to USD (base) then to target currency
  const amountInUSD = amount / (FX_RATES[from] || 1.0);
  return amountInUSD * (FX_RATES[to] || 1.0);
}

// SHA256 hashing helper
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// User methods
export function findUserByEmail(email: string): User | null {
  const normEmail = email.toLowerCase().trim();
  const entry = Object.values(memoryDb.users).find(item => item.user.email.toLowerCase().trim() === normEmail);
  return entry ? entry.user : null;
}

export function verifyUser(email: string, passwordHash: string): User | null {
  const normEmail = email.toLowerCase().trim();
  const entry = Object.values(memoryDb.users).find(
    item => item.user.email.toLowerCase().trim() === normEmail && item.passwordHash === passwordHash
  );
  return entry ? entry.user : null;
}

export function createUser(name: string, email: string, passwordHash: string, currency: CurrencyCode): User {
  const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const newUser: User = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    currency
  };
  
  memoryDb.users[userId] = {
    user: newUser,
    passwordHash
  };
  
  saveDb();
  return newUser;
}

export function getUserById(id: string): User | null {
  return memoryDb.users[id]?.user || null;
}

// Transaction methods
export function getTransactionsByUser(userId: string): Transaction[] {
  return memoryDb.transactions
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addTransaction(userId: string, data: Omit<Transaction, 'id' | 'userId' | 'amountBase' | 'createdAt'>): Transaction {
  const id = 'tx_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const user = getUserById(userId);
  const userBaseCurrency = user?.currency || 'INR';
  
  const amountBase = convertCurrency(data.amount, data.currency, userBaseCurrency);
  
  const newTxn: Transaction = {
    ...data,
    id,
    userId,
    amountBase,
    createdAt: new Date().toISOString()
  };
  
  memoryDb.transactions.push(newTxn);
  saveDb();
  return newTxn;
}

export function updateTransaction(userId: string, id: string, data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>): Transaction | null {
  const idx = memoryDb.transactions.findIndex(t => t.id === id && t.userId === userId);
  if (idx === -1) return null;
  
  const current = memoryDb.transactions[idx];
  const updated = { ...current, ...data } as Transaction;
  
  // Re-calculate base currency if amount or currency changes
  if (data.amount !== undefined || data.currency !== undefined) {
    const user = getUserById(userId);
    const userBaseCurrency = user?.currency || 'INR';
    updated.amountBase = convertCurrency(updated.amount, updated.currency, userBaseCurrency);
  }
  
  memoryDb.transactions[idx] = updated;
  saveDb();
  return updated;
}

export function deleteTransaction(userId: string, id: string): boolean {
  const initialLen = memoryDb.transactions.length;
  memoryDb.transactions = memoryDb.transactions.filter(t => !(t.id === id && t.userId === userId));
  const changed = memoryDb.transactions.length !== initialLen;
  if (changed) {
    saveDb();
  }
  return changed;
}

// Category methods
export function getCategoriesByUser(userId: string): Category[] {
  return memoryDb.categories.filter(c => c.predefined || c.id.startsWith(`u-${userId}-`));
}

export function addCustomCategory(userId: string, name: string, type: 'EXPENSE' | 'INCOME', icon: string, color: string): Category {
  const catId = `u-${userId}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  const newCat: Category = {
    id: catId,
    name: name.trim(),
    type,
    icon,
    color,
    predefined: false
  };
  
  memoryDb.categories.push(newCat);
  saveDb();
  return newCat;
}

// Budget methods
export function getBudgetsByUser(userId: string): Budget[] {
  return memoryDb.budgets.filter(b => b.userId === userId);
}

export function setBudget(userId: string, categoryName: string, amount: number, currency: CurrencyCode, period: 'monthly' | 'weekly'): Budget {
  const startOn = new Date().toISOString().slice(0, 7) + '-01'; // Beginning of the month
  
  // Check if a budget already exists for this category/period pairing
  const idx = memoryDb.budgets.findIndex(b => b.userId === userId && b.categoryName === categoryName && b.period === period);
  
  if (idx !== -1) {
    // Update existing budget
    memoryDb.budgets[idx].amount = amount;
    memoryDb.budgets[idx].currency = currency;
    memoryDb.budgets[idx].startOn = startOn;
    saveDb();
    return memoryDb.budgets[idx];
  } else {
    // Create new budget entry
    const id = 'bg_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const newBudget: Budget = {
      id,
      userId,
      categoryName,
      period,
      amount,
      currency,
      startOn
    };
    memoryDb.budgets.push(newBudget);
    saveDb();
    return newBudget;
  }
}

export function deleteBudget(userId: string, id: string): boolean {
  const initialLen = memoryDb.budgets.length;
  memoryDb.budgets = memoryDb.budgets.filter(b => !(b.id === id && b.userId === userId));
  const changed = memoryDb.budgets.length !== initialLen;
  if (changed) {
    saveDb();
  }
  return changed;
}

// Savings Goal Methods
export function getGoalsByUser(userId: string): SavingsGoal[] {
  return (memoryDb.goals || []).filter(g => g.userId === userId);
}

export function addGoal(
  userId: string,
  name: string,
  targetAmount: number,
  currency: CurrencyCode,
  targetDate: string
): SavingsGoal {
  const id = 'gl_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const newGoal: SavingsGoal = {
    id,
    userId,
    name: name.trim(),
    targetAmount,
    currentSaved: 0,
    currency,
    targetDate,
    createdAt: new Date().toISOString()
  };
  
  if (!memoryDb.goals) memoryDb.goals = [];
  memoryDb.goals.push(newGoal);
  saveDb();
  return newGoal;
}

export function depositToGoal(userId: string, id: string, amount: number): SavingsGoal | null {
  const idx = (memoryDb.goals || []).findIndex(g => g.id === id && g.userId === userId);
  if (idx === -1) return null;
  
  memoryDb.goals[idx].currentSaved = Math.max(0, memoryDb.goals[idx].currentSaved + amount);
  saveDb();
  return memoryDb.goals[idx];
}

export function deleteGoal(userId: string, id: string): boolean {
  if (!memoryDb.goals) return false;
  const initialLen = memoryDb.goals.length;
  memoryDb.goals = memoryDb.goals.filter(g => !(g.id === id && g.userId === userId));
  const changed = memoryDb.goals.length !== initialLen;
  if (changed) {
    saveDb();
  }
  return changed;
}

