/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import * as crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import * as db from './server-db';
import { CurrencyCode, Transaction, Budget, Category } from './src/types';

// Initialize Database
db.initDb();

const app = express();
const PORT = 3000;

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Session Signer using Node Native Crypto
const TOKEN_SECRET = process.env.JWT_SECRET || 'smart-expenses-karthik-signature-key-2026';

function signToken(payload: { id: string; email: string }): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 Days
  const data = Buffer.from(JSON.stringify({ ...payload, exp: expiry })).toString('base64url');
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
  const signature = hmac.update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
    const expectedSig = hmac.update(payloadB64).digest('base64url');
    if (signature !== expectedSig) return null;
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Authentication Middleware
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or compromised' });
  }
  
  req.user = decoded;
  next();
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, currency } = req.body;
    if (!name || !email || !password || !currency) {
      return res.status(400).json({ error: 'All fields (name, email, password, currency) are required' });
    }
    
    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Account with this email already exists' });
    }
    
    const hash = db.hashPassword(password);
    const user = db.createUser(name, email, hash, currency as CurrencyCode);
    const token = signToken({ id: user.id, email: user.email });
    
    res.json({ token, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const hash = db.hashPassword(password);
    const user = db.verifyUser(email, hash);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = signToken({ id: user.id, email: user.email });
    res.json({ token, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Session verification failed' });
  }
});

// ==========================================
// 2. TRANSACTION ROUTES
// ==========================================

app.get('/api/transactions', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const txns = db.getTransactionsByUser(userId);
    res.json(txns);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

app.post('/api/transactions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, currency, description, categoryName, type, date, source } = req.body;
    
    if (!amount || !currency || !description || !categoryName || !type || !date) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }
    
    const txn = db.addTransaction(userId, {
      amount: parseFloat(amount),
      currency: currency as CurrencyCode,
      description,
      categoryName,
      type: type as 'EXPENSE' | 'INCOME',
      date,
      source: (source || 'manual') as any
    });
    
    res.status(201).json(txn);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.put('/api/transactions/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const updated = db.updateTransaction(userId, id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    
    const deleted = db.deleteTransaction(userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }
    res.json({ success: true, message: 'Transaction track removed' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// CSV Import Bulk Route
app.post('/api/transactions/bulk', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty transaction bulk collection' });
    }
    
    const added: Transaction[] = [];
    for (const t of transactions) {
      const addedTxn = db.addTransaction(userId, {
        amount: parseFloat(t.amount),
        currency: (t.currency || 'INR') as CurrencyCode,
        description: t.description || 'Statement Import',
        categoryName: t.categoryName || 'Miscellaneous',
        type: (t.type || 'EXPENSE') as 'EXPENSE' | 'INCOME',
        date: t.date || new Date().toISOString().slice(0, 10),
        source: 'csv'
      });
      added.push(addedTxn);
    }
    
    res.json({ success: true, count: added.length, items: added });
  } catch (error: any) {
    res.status(500).json({ error: 'CSV file import process failed' });
  }
});

// ==========================================
// 3. CATEGORY ROUTES
// ==========================================

app.get('/api/categories', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cats = db.getCategoriesByUser(userId);
    res.json(cats);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

app.post('/api/categories', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type, icon, color } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Category name and type (EXPENSE/INCOME) is required' });
    }
    
    const customCat = db.addCustomCategory(
      userId,
      name,
      type as 'EXPENSE' | 'INCOME',
      icon || 'HelpCircle',
      color || 'slate'
    );
    res.status(201).json(customCat);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create custom category' });
  }
});

// ==========================================
// 4. BUDGET ROUTES
// ==========================================

app.get('/api/budgets', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const budgets = db.getBudgetsByUser(userId);
    res.json(budgets);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve budgets' });
  }
});

app.post('/api/budgets', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryName, amount, currency, period } = req.body;
    
    if (!categoryName || !amount || !currency || !period) {
      return res.status(400).json({ error: 'Missing required configuration elements for budget setting' });
    }
    
    const budget = db.setBudget(
      userId,
      categoryName,
      parseFloat(amount),
      currency as CurrencyCode,
      period as 'monthly' | 'weekly'
    );
    res.status(201).json(budget);
  } catch (error: any) {
    res.status(500).json({ error: 'Budget registration failed' });
  }
});

app.delete('/api/budgets/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const deleted = db.deleteBudget(userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found or unauthorized' });
    }
    res.json({ success: true, message: 'Budget target deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// ==========================================
// 4.5. SAVINGS GOAL ROUTES
// ==========================================

app.get('/api/goals', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const goals = db.getGoalsByUser(userId);
    res.json(goals);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve savings goals' });
  }
});

app.post('/api/goals', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, targetAmount, currency, targetDate } = req.body;
    
    if (!name || !targetAmount || !currency || !targetDate) {
      return res.status(400).json({ error: 'All fields (name, targetAmount, currency, targetDate) are required to create a savings goal' });
    }
    
    const goal = db.addGoal(
      userId,
      name,
      parseFloat(targetAmount),
      currency as CurrencyCode,
      targetDate
    );
    res.status(201).json(goal);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create savings goal' });
  }
});

app.post('/api/goals/:id/deposit', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount } = req.body;
    
    if (amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Valid deposit/withdrawal amount is required' });
    }
    
    const goal = db.depositToGoal(userId, id, parseFloat(amount));
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found or unauthorized' });
    }
    res.json(goal);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to adjust savings goal' });
  }
});

app.delete('/api/goals/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const deleted = db.deleteGoal(userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Savings goal not found or unauthorized' });
    }
    res.json({ success: true, message: 'Savings goal deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete savings goal' });
  }
});

// ==========================================
// 5. ANALYTICS & STATS DASHBOARD
// ==========================================

app.get('/api/dashboard/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile missing' });
    }
    const baseCurrency = user.currency;
    
    const txns = db.getTransactionsByUser(userId);
    const budgets = db.getBudgetsByUser(userId);
    const categories = db.getCategoriesByUser(userId);
    const goals = db.getGoalsByUser(userId);
    
    // Calculate totals in Base Currency
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Group categories for charts & totals
    const categorySums: Record<string, number> = {};
    
    txns.forEach(t => {
      if (t.type === 'INCOME') {
        totalIncome += t.amountBase;
      } else {
        totalExpense += t.amountBase;
        categorySums[t.categoryName] = (categorySums[t.categoryName] || 0) + Math.abs(t.amountBase);
      }
    });
    
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    // Budget Calculations
    const allCategoryBudget = budgets.find(b => b.categoryName === 'All');
    const budgetCap = allCategoryBudget 
      ? db.convertCurrency(allCategoryBudget.amount, allCategoryBudget.currency, baseCurrency)
      : budgets.reduce((sum, b) => b.categoryName !== 'All' ? sum + db.convertCurrency(b.amount, b.currency, baseCurrency) : sum, 0);
      
    // Total spent for budgeted items
    const budgetSpent = totalExpense; // Default base is comparing to gross expenses
    
    // Category Breakdown Chart list
    const chartCategories = Object.entries(categorySums).map(([name, val]) => {
      const matchCat = categories.find(c => c.name === name);
      return {
        category: name,
        value: Math.round(val),
        color: matchCat ? matchCat.color : 'slate',
        percentage: totalExpense > 0 ? parseFloat(((val / totalExpense) * 100).toFixed(1)) : 0
      };
    }).sort((a,b) => b.value - a.value);
    
    // Monthly trend calculation (Last 6 Months)
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize past 6 calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthsName[d.getMonth()]} ${d.getFullYear()}`;
      monthlyData[key] = { income: 0, expense: 0 };
    }
    
    txns.forEach(t => {
      const tDate = new Date(t.date);
      const key = `${monthsName[tDate.getMonth()]} ${tDate.getFullYear()}`;
      if (monthlyData[key]) {
        if (t.type === 'INCOME') {
          monthlyData[key].income += t.amountBase;
        } else {
          monthlyData[key].expense += t.amountBase;
        }
      }
    });
    
    const chartMonthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: Math.round(data.income),
      expense: Math.round(data.expense)
    }));
    
    const kpis = {
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      netSavings: Math.round(netSavings),
      savingsRate: parseFloat(savingsRate.toFixed(1)),
      budgetCap: Math.round(budgetCap),
      budgetSpent: Math.round(budgetSpent),
      baseCurrency
    };
    
    res.json({
      kpis,
      chartCategories,
      chartMonthlyTrend,
      budgets,
      goals
    });
    
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to balance analytics summary' });
  }
});

// ==========================================
// 6. GEMINI ADVANCED SERVICES
// ==========================================

// Server-Side Lazy-Loaded Gemini Client Helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined in Secrets panel');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Route to auto-analyze receipt (Image Upload, OCR base64 or Text parser)
app.post('/api/gemini/scan-receipt', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Base64 image string is required' });
    }
    
    const ai = getGeminiClient();
    
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
      }
    };
    
    const promptPart = `Analyze this purchase receipt image and extract structured billing information.
Identify the merchant/vendor name, transaction date, invoice total, transaction curreny choice, and individual items.
Map the receipt into one of these categories: "Food & Dining", "Housing & Rent", "Transport & Fuel", "Shopping & Entertainment", "Bills & Utilities", "Education & Learning", "Health & Fitness", "Travel & Leisure", or "Miscellaneous".

You MUST reply with JSON data adhering to this exact schema:
{
  "merchant": "string name",
  "date": "YYYY-MM-DD format as best guessed",
  "amount": number,
  "currency": "USD" or "INR" or "EUR" or "GBP" or "AUD" or "CAD" (ISO Currency letters),
  "categoryName": "matching one of the predefined categories from list",
  "items": [{"name": "item title", "price": number}],
  "description": "brief itemized summaries"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, { text: promptPart }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            date: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            categoryName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                },
                required: ['name', 'price']
              }
            },
            description: { type: Type.STRING }
          },
          required: ['merchant', 'date', 'amount', 'currency', 'categoryName', 'items', 'description']
        }
      }
    });
    
    const rawText = response.text;
    if (!rawText) {
      return res.status(500).json({ error: 'Receipt Scan returned empty parsing context.' });
    }
    
    const result = JSON.parse(rawText.trim());
    res.json(result);
  } catch (error: any) {
    console.error('OCR scanning fail:', error);
    res.status(500).json({ error: `Gemini Scanner Error: ${error.message || 'Check API Secret configured'}` });
  }
});

// Route to generate AI Coach financial recommendations dynamically
app.post('/api/gemini/insights', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const txns = db.getTransactionsByUser(userId);
    const budgets = db.getBudgetsByUser(userId);
    const user = db.getUserById(userId);
    const currency = user?.currency || 'INR';
    
    if (txns.length === 0) {
      return res.json({
        advice: "You don't have enough transactions tracked yet. Add more manual transactions or parse a receipt for your Smart Financial Advisor to generate personalized wealth coaching insights!"
      });
    }
    
    const ai = getGeminiClient();
    
    // Provide light-weight context to the model to optimize tokens and speed
    const mappedTxns = txns.slice(0, 30).map(t => ({
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      category: t.categoryName,
      type: t.type,
      date: t.date
    }));
    
    const systemPrompt = `You are a professional wealth manager, CFA certified financial planner, and a smart personal finance mentor assigned to help user D.karthik optimize budgets, increase savings, and warning of spending anomalies.
Review the following past transactions list and budget constraints.
Provide 3 concise, extremely customized, high-yield actionable bullet insights describing where they are overspending, budget target tracks, and actual wealth recommendations. Be direct, compassionate, and precise with currency quantities (e.g. INR or USD).`;
    
    const prompt = `User Account Base Currency: ${currency}
    User Budgets: ${JSON.stringify(budgets)}
    Recent Transactions: ${JSON.stringify(mappedTxns)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt
      }
    });
    
    res.json({ advice: response.text || 'Unable to balance financial coaching advices.' });
  } catch (error: any) {
    console.error('Gemini Insights error:', error);
    res.status(500).json({ error: `AI Coach Offline: ${error.message || 'Ensure GEMINI_API_KEY is defined in secrets'}` });
  }
});

// Route to chat interactively with Gemini Flash AI Wealth Coach
app.post('/api/gemini/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const txns = db.getTransactionsByUser(userId);
    const budgets = db.getBudgetsByUser(userId);
    const goals = db.getGoalsByUser(userId);
    const user = db.getUserById(userId);
    const currency = user?.currency || 'INR';
    
    const ai = getGeminiClient();
    
    // Build context about user's financial profile
    const mappedTxns = txns.slice(0, 40).map(t => ({
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      category: t.categoryName,
      type: t.type,
      date: t.date
    }));
    
    const systemPrompt = `You are a certified Financial Advisor (CFA) and a friendly personal finance mentor for a user named ${user?.name || 'D.karthik'}.
Your goal is to answer questions, analyze transactions, offer budgeting warnings, suggest investment formulas or tax/saving hacks, and guide them towards positive savings rates.

User Profile:
- Name: ${user?.name || 'D.karthik'}
- Base Report Currency: ${currency}
- Total Transactions Logged: ${txns.length}
- Budgets Configured: ${JSON.stringify(budgets)}
- Savings Goals: ${JSON.stringify(goals)}
- Recent 40 transactions context: ${JSON.stringify(mappedTxns)}

Guidelines:
1. Speak in a friendly, supportive, yet professional and analytical manner. Avoid vague generalizations, giving specific, realistic numbers, compound math, or category trends.
2. Be brief, scannable, and structure outputs using bold terms and clean Markdown bullet lists.
3. If they ask how to grow their wealth, describe specific habits (emergency fund, SIP, mutual funds). Focus on sound mathematical principles.
4. Keep currency tags aligned with their base report currency (${currency}) or convert accurately if they request conversion.
5. Answer questions directly using the transaction history context. If asked e.g. "how much did I spend on Food", look up the actual Food category in the transactions.`;

    const formattedContents = [];
    if (Array.isArray(history)) {
      history.forEach(h => {
        formattedContents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt
      }
    });
    
    res.json({ text: response.text || 'My apologies, I was unable to compile an analytical answer at the moment.' });
  } catch (error: any) {
    console.error('Gemini advisor chat error:', error);
    res.status(500).json({ error: `AI Coach Chat Offline: ${error.message || 'Ensure GEMINI_API_KEY is defined in Secrets'}` });
  }
});


// ==========================================
// 7. DEV SERVER / STATIC ASSET SERVING & PORT INGRESS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Expense Tracker: Express custom server running at URL http://localhost:${PORT}`);
  });
}

startServer();
