/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Trash2, 
  Upload, 
  Camera, 
  ArrowRight, 
  X, 
  HelpCircle, 
  Filter, 
  Calendar, 
  Tag, 
  DollarSign, 
  Activity, 
  ChevronRight, 
  PieChart, 
  Target, 
  Info,
  Loader2,
  Lock,
  Mail,
  UserCheck,
  RefreshCw,
  FileCode,
  Send,
  Coins
} from 'lucide-react';
import Header from './components/Header';
import KPICard from './components/KPICard';
import { 
  User, 
  Transaction, 
  Budget, 
  Category, 
  KPIOverview, 
  CurrencyCode, 
  TransactionSource,
  SavingsGoal,
  ChatMessage
} from './types';

export default function App() {
  // Session States
  const [token, setToken] = useState<string>(localStorage.getItem('smart_spend_token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // App Navigation state
  const [tab, setTab] = useState<string>('dashboard');
  
  // Form input states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBaseCurrency, setRegBaseCurrency] = useState<CurrencyCode>('INR');
  
  // Dashboard & analytics statistics from server
  const [kpis, setKpis] = useState<KPIOverview | null>(null);
  const [chartCategories, setChartCategories] = useState<any[]>([]);
  const [chartMonthlyTrend, setChartMonthlyTrend] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  
  // Savings goals input states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState(new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 10)); // Default 1 year from now
  const [goalDepositAmount, setGoalDepositAmount] = useState('');
  const [activeDepositGoalId, setActiveDepositGoalId] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  // Adviced compound growth matrix calculator
  const [calcMonthlyInvestment, setCalcMonthlyInvestment] = useState(2500); 
  const [calcReturnRate, setCalcReturnRate] = useState(12); // e.g., 12% Compound
  const [calcPeriodYears, setCalcPeriodYears] = useState(10); // 10 Years

  // Conversational interactive chat workspace
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: 'model',
      text: "Hello! I am your AI wealth coach & certified personal finance mentor. Ask me any details about your monthly budget thresholds, recent restaurant spends, tax saving triggers, or ask me to calculate a dynamic compounding SIP growth track for you depending on your cash flow profile!",
      createdAt: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  
  // Operational helpers
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  
  // Active Action Overlays
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  
  // Individual transaction build form
  const [amount, setAmount] = useState('');
  const [txnCurrency, setTxnCurrency] = useState<CurrencyCode>('INR');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('Food & Dining');
  const [txnType, setTxnType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Quick Custom category setup state
  const [customCatName, setCustomCatName] = useState('');
  const [customCatType, setCustomCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [customCatColor, setCustomCatColor] = useState('emerald');
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  
  // Budget creation form
  const [budgetCategory, setBudgetCategory] = useState('All');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'weekly'>('monthly');

  // CSV paste/import state
  const [csvText, setCsvText] = useState('');
  
  // OCR / Receipt state
  const [ocrImageBase64, setOcrImageBase64] = useState<string>('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Coach advice text cache
  const [aiCoachAdvice, setAiCoachAdvice] = useState<string>('');
  const [isAiAdviceLoading, setIsAiAdviceLoading] = useState(false);

  // Filters for Main Transactions List
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto pre-fill base values
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setTxnCurrency(user.currency);
      setRegBaseCurrency(user.currency);
      loadDashboardStats();
    }
  }, [user]);

  // Automatic categorizer rules (client side support for high speed tagging)
  useEffect(() => {
    const descLower = description.toLowerCase().trim();
    if (txnType === 'EXPENSE') {
      if (descLower.includes('uber') || descLower.includes('ola') || descLower.includes('cab') || descLower.includes('travel') || descLower.includes('flight') || descLower.includes('train')) {
        setCategoryName('Transport & Fuel');
      } else if (descLower.includes('zomato') || descLower.includes('swiggy') || descLower.includes('cafe') || descLower.includes('restaurant') || descLower.includes('food') || descLower.includes('subway') || descLower.includes('coffee') || descLower.includes('starbucks')) {
        setCategoryName('Food & Dining');
      } else if (descLower.includes('amazon') || descLower.includes('flipkart') || descLower.includes('shopping') || descLower.includes('clothes') || descLower.includes('myntra') || descLower.includes('mall') || descLower.includes('gift')) {
        setCategoryName('Shopping & Entertainment');
      } else if (descLower.includes('rent') || descLower.includes('pg') || descLower.includes('landlord') || descLower.includes('hostel')) {
        setCategoryName('Housing & Rent');
      } else if (descLower.includes('electricity') || descLower.includes('zap') || descLower.includes('water') || descLower.includes('wifi') || descLower.includes('invoice') || descLower.includes('bill') || descLower.includes('recharge') || descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('broadband')) {
        setCategoryName('Bills & Utilities');
      } else if (descLower.includes('course') || descLower.includes('education') || descLower.includes('book') || descLower.includes('college') || descLower.includes('tuition') || descLower.includes('udemy') || descLower.includes('exam')) {
        setCategoryName('Education & Learning');
      } else if (descLower.includes('hospital') || descLower.includes('pharmacy') || descLower.includes('clinic') || descLower.includes('gym') || descLower.includes('health') || descLower.includes('medicine') || descLower.includes('dentist')) {
        setCategoryName('Health & Fitness');
      }
    } else {
      if (descLower.includes('salary') || descLower.includes('wage') || descLower.includes('payroll') || descLower.includes('stipend')) {
        setCategoryName('Salary');
      } else if (descLower.includes('freelance') || descLower.includes('project') || descLower.includes('upwork') || descLower.includes('fiverr') || descLower.includes('consult')) {
        setCategoryName('Freelance & Consulting');
      } else if (descLower.includes('div') || descLower.includes('crypto') || descLower.includes('stocks') || descLower.includes('invest') || descLower.includes('returns')) {
        setCategoryName('Investments');
      }
    }
  }, [description, txnType]);

  const showToast = (message: string) => {
    setActionSuccessMessage(message);
    setTimeout(() => {
      setActionSuccessMessage('');
    }, 4000);
  };

  // API Call helper
  async function apiCall(endpoint: string, options: RequestInit = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };
      
      const res = await fetch(endpoint, {
        ...options,
        headers
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server operation failed');
      }
      return data;
    } catch (error: any) {
      console.error(`API Call error at ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth operations
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      localStorage.setItem('smart_spend_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setLoginEmail('');
      setLoginPassword('');
      showToast('Welcome back, session authorized!');
    } catch (err: any) {
      setAuthError(err.message || 'Login details are incorrect');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          currency: regBaseCurrency
        })
      });
      localStorage.setItem('smart_spend_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      showToast('Profile registered successfully! Happy Tracking!');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserProfile() {
    try {
      const data = await apiCall('/api/auth/me');
      setUser(data);
    } catch (err) {
      // Token is stale or compromised, log out
      handleLogout();
    }
  }

  function handleLogout() {
    localStorage.removeItem('smart_spend_token');
    setToken('');
    setUser(null);
    setTab('dashboard');
    setTransactions([]);
    setBudgets([]);
  }

  // Dashboard Stats load
  async function loadDashboardStats() {
    if (!token) return;
    setIsStatsLoading(true);
    try {
      // Load Analytics
      const stats = await apiCall('/api/dashboard/stats');
      setKpis(stats.kpis);
      setChartCategories(stats.chartCategories);
      setChartMonthlyTrend(stats.chartMonthlyTrend);
      setBudgets(stats.budgets);
      setGoals(stats.goals || []);

      // Load transactions
      const txns = await apiCall('/api/transactions');
      setTransactions(txns);

      // Load Categories
      const cats = await apiCall('/api/categories');
      setCategories(cats);
    } catch (error: any) {
      console.error('Failed to reload dashboard:', error);
    } finally {
      setIsStatsLoading(false);
    }
  }

  // Operations for Savings Goals
  async function submitSavingsGoal(e: React.FormEvent) {
    if (e) e.preventDefault();
    if (!goalName.trim() || !goalTargetAmount || parseFloat(goalTargetAmount) <= 0) {
      alert('Please specify a valid savings target amount');
      return;
    }
    setIsLoading(true);
    try {
      await apiCall('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          name: goalName,
          targetAmount: parseFloat(goalTargetAmount),
          currency: user?.currency || 'INR',
          targetDate: goalTargetDate
        })
      });
      showToast(`Savings target "${goalName}" initialized!`);
      setIsAddGoalOpen(false);
      setGoalName('');
      setGoalTargetAmount('');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Goal creation failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDepositSubmit(e: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activeDepositGoalId || !goalDepositAmount || parseFloat(goalDepositAmount) === 0) {
      alert('Please specify a non-zero deposit or withdrawal sum');
      return;
    }
    setIsLoading(true);
    try {
      await apiCall(`/api/goals/${activeDepositGoalId}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(goalDepositAmount) })
      });
      showToast('Goal savings allocation successfully adjusted!');
      setIsDepositOpen(false);
      setGoalDepositAmount('');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Failed to apply allocations');
    } finally {
      setIsLoading(false);
    }
  }

  async function removeGoal(goalId: string) {
    if (!confirm('Are you certain you want to remove this savings goal tracking target?')) return;
    try {
      await apiCall(`/api/goals/${goalId}`, { method: 'DELETE' });
      showToast('Savings goal deleted.');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Failed to remove goal target');
    }
  }

  // Operations for AI advisory conversational chat
  async function handleSendChatMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = {
      id: 'msg-' + Math.random().toString(),
      role: 'user',
      text: chatInput,
      createdAt: new Date().toISOString()
    };
    
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    const textToSend = chatInput;
    setChatInput('');
    setIsChatSending(true);
    
    try {
      // Map history elements excluding current userMsg
      const formattedHistory = chatMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));
        
      const response = await apiCall('/api/gemini/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory
        })
      });
      
      const assistantMsg: ChatMessage = {
        id: 'msg-' + Math.random().toString(),
        role: 'model',
        text: response.text,
        createdAt: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: 'msg-' + Math.random().toString(),
        role: 'model',
        text: `Consultation error: ${error.message || 'Check GEMINI_API_KEY inside secrets panel'}. I'm offline at the moment.`,
        createdAt: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatSending(false);
    }
  }

  // Add Transaction Form submit
  async function submitTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('Please input a valid amount quantity');
      return;
    }
    
    setIsLoading(true);
    try {
      await apiCall('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: txnCurrency,
          description: description.trim() || 'Manual Entry',
          categoryName,
          type: txnType,
          date: txnDate,
          source: 'manual'
        })
      });
      
      showToast('Expense record posted securely!');
      setIsAddTxnOpen(false);
      
      // Reset
      setAmount('');
      setDescription('');
      
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Record creation failed');
    } finally {
      setIsLoading(false);
    }
  }

  // Trash Transaction
  async function deleteTxn(id: string) {
    if (!confirm('Are you certain you want to remove this record? This action is permanent.')) return;
    try {
      await apiCall(`/api/transactions/${id}`, { method: 'DELETE' });
      showToast('Transaction track removed.');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Failed to delete transaction');
    }
  }

  // Set Budget limit
  async function submitBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!budgetAmount || isNaN(parseFloat(budgetAmount)) || parseFloat(budgetAmount) <= 0) {
      alert('Please specify a positive budget limit amount');
      return;
    }
    
    setIsLoading(true);
    try {
      await apiCall('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          categoryName: budgetCategory,
          amount: parseFloat(budgetAmount),
          currency: user?.currency || 'INR',
          period: budgetPeriod
        })
      });
      
      showToast(`Budget limit configured for ${budgetCategory}!`);
      setIsAddBudgetOpen(false);
      setBudgetAmount('');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Budget registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  // Delete budget limit
  async function removeBudget(id: string) {
    if (!confirm('Remove this budget track target?')) return;
    try {
      await apiCall(`/api/budgets/${id}`, { method: 'DELETE' });
      showToast('Budget tracker deleted successfully.');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Failed to delete budget limit');
    }
  }

  // Add Custom category
  async function submitCustomCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!customCatName) {
      alert('Please specify a descriptive label name');
      return;
    }
    setIsLoading(true);
    try {
      await apiCall('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: customCatName,
          type: customCatType,
          color: customCatColor,
          icon: customCatType === 'EXPENSE' ? 'Tag' : 'TrendingUp'
        })
      });
      
      showToast('Custom spending item category added successfully!');
      setIsAddCatOpen(false);
      setCustomCatName('');
      loadDashboardStats();
    } catch (error: any) {
      alert(error.message || 'Failed to append custom category');
    } finally {
      setIsLoading(false);
    }
  }

  // Advanced Gemini Advisors: Dynamic Coaching Advice
  async function fetchAICoachAdvice() {
    setIsAiAdviceLoading(true);
    setAiCoachAdvice('');
    try {
      const result = await apiCall('/api/gemini/insights', { method: 'POST' });
      setAiCoachAdvice(result.advice);
    } catch (error: any) {
      setAiCoachAdvice(`Coaching offline at the moment. Reason: ${error.message}. Please configure your GEMINI_API_KEY inside the Secrets panel first!`);
    } finally {
      setIsAiAdviceLoading(false);
    }
  }

  // CSV Statement pasting import process
  function handleCSVImport(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText.trim()) {
      alert('Please paste some raw statement text content first');
      return;
    }

    setIsLoading(true);
    try {
      // Client-Side CSV Line interpreter with basic parsing logic
      const lines = csvText.trim().split('\n');
      const parsedTransactions = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Match comma-separated fields, ignoring comma within quotes
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        if (match.length < 2) continue; // Not enough fields
        
        // Format columns: Date, Amount, Description, CategoryName, Type (EXPENSE/INCOME)
        // CSV Format suggestion: Date (YYYY-MM-DD), Amount, Description, Category (Optional), Type (Optional)
        const rawDate = match[0]?.replace(/"/g, '').trim() || new Date().toISOString().slice(0, 10);
        const rawAmount = parseFloat(match[1]?.replace(/"/g, '').trim() || '0');
        const rawDesc = match[2]?.replace(/"/g, '').trim() || 'Statement Entry';
        const rawCat = match[3]?.replace(/"/g, '').trim() || 'Miscellaneous';
        const rawType = (match[4]?.replace(/"/g, '').trim().toUpperCase() === 'INCOME') ? 'INCOME' : 'EXPENSE';
        
        if (!isNaN(rawAmount) && rawAmount > 0) {
          parsedTransactions.push({
            date: rawDate,
            amount: rawAmount,
            description: rawDesc,
            categoryName: rawCat,
            type: rawType,
            currency: user?.currency || 'INR'
          });
        }
      }

      if (parsedTransactions.length === 0) {
        throw new Error('Could not parse any structured financial transactions. Verify field columns.');
      }

      // Upload parsed transactions list
      apiCall('/api/transactions/bulk', {
        method: 'POST',
        body: JSON.stringify({ transactions: parsedTransactions })
      }).then(() => {
        showToast(`Successfully processed and loaded ${parsedTransactions.length} statements!`);
        setIsCSVImportOpen(false);
        setCsvText('');
        loadDashboardStats();
      }).catch(err => {
        alert(err.message || 'Import failed on API server');
      }).finally(() => {
        setIsLoading(false);
      });
      
    } catch (err: any) {
      alert(err.message);
      setIsLoading(false);
    }
  }

  // Receipt Scanner File uploaded
  function processReceiptImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setOcrImageBase64(base64String);
      scanReceiptWithGemini(base64String, file.type);
    };
    reader.readAsDataURL(file);
  }

  async function scanReceiptWithGemini(base64Str: string, mimeType: string) {
    setIsOcrProcessing(true);
    setOcrResult(null);
    try {
      const data = await apiCall('/api/gemini/scan-receipt', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: base64Str,
          mimeType
        })
      });
      
      setOcrResult(data);
      
      // Auto prefill manual input form values
      setAmount(data.amount?.toString() || '');
      setTxnCurrency(data.currency as CurrencyCode || 'INR');
      setDescription(`${data.merchant || ''} - ${data.description || 'Receipt scan'}`);
      setCategoryName(data.categoryName || 'Food & Dining');
      setTxnType('EXPENSE');
      if (data.date) {
        setTxnDate(data.date);
      }
      
      showToast('Receipt parsed with Gemini Flash AI successfully!');
    } catch (error: any) {
      alert(`Receipt OCR Scan failed: ${error.message || 'Confirm API key is configured'}`);
    } finally {
      setIsOcrProcessing(false);
    }
  }

  // Sync state filters
  const filteredTransactions = transactions.filter(t => {
    // 1. Text Search matching description or categoryName
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
                          
    // 2. Type Match
    const matchesType = filterType === 'ALL' || t.type === filterType;
    
    // 3. Category match
    const matchesCategory = filterCategory === 'ALL' || t.categoryName === filterCategory;
    
    // 4. Source match
    const matchesSource = filterSource === 'ALL' || t.source === filterSource;
    
    return matchesSearch && matchesType && matchesCategory && matchesSource;
  });

  // Calculate high quality color values for category UI nodes
  const getCategoryColorClass = (colorName: string) => {
    const colorMap: Record<string, string> = {
      emerald: 'bg-emerald-500 text-emerald-100',
      blue: 'bg-blue-500 text-blue-100',
      amber: 'bg-amber-500 text-amber-900',
      purple: 'bg-purple-500 text-purple-100',
      red: 'bg-red-500 text-red-100',
      indigo: 'bg-indigo-500 text-indigo-100',
      pink: 'bg-pink-500 text-pink-100',
      teal: 'bg-teal-500 text-teal-100',
      slate: 'bg-slate-500 text-slate-100',
      green: 'bg-green-500 text-green-100',
      cyan: 'bg-cyan-500 text-cyan-900',
      violet: 'bg-violet-500 text-violet-100',
      rose: 'bg-rose-500 text-rose-100',
    };
    return colorMap[colorName] || 'bg-zinc-500 text-white';
  };

  const getBorderColorClass = (colorName: string) => {
    const borderMap: Record<string, string> = {
      emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50/40',
      blue: 'border-blue-200 text-blue-700 bg-blue-50/40',
      amber: 'border-amber-200 text-amber-700 bg-amber-50/40',
      purple: 'border-purple-200 text-purple-700 bg-purple-50/40',
      red: 'border-red-200 text-red-700 bg-red-50/40',
      indigo: 'border-indigo-200 text-indigo-700 bg-indigo-50/40',
      pink: 'border-pink-200 text-pink-700 bg-pink-50/40',
      teal: 'border-teal-200 text-teal-700 bg-teal-50/40',
      slate: 'border-slate-200 text-slate-705 bg-slate-50/40',
      green: 'border-green-200 text-green-700 bg-green-50/40',
      cyan: 'border-cyan-200 text-cyan-705 bg-cyan-50/40',
      violet: 'border-violet-200 text-violet-700 bg-violet-50/40',
      rose: 'border-rose-200 text-rose-700 bg-rose-50/40',
    };
    return borderMap[colorName] || 'border-zinc-200 text-zinc-700';
  };

  // Run initial AI adviser fetch if tab changes to ai-coach
  useEffect(() => {
    if (tab === 'ai-coach' && token && !aiCoachAdvice) {
      fetchAICoachAdvice();
    }
  }, [tab]);

  // If user is not logged in / auth token missing
  if (!token) {
    return (
      <main className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo brand */}
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-white shadow-md">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-center text-3xl font-sans font-bold tracking-tight text-zinc-900">
            SmartSpend Hub
          </h2>
          <p className="mt-2 text-center text-sm font-sans font-medium text-zinc-500">
            Professional Full-Stack Wealth Management by <strong className="text-zinc-900 font-semibold">D.karthik</strong>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xs border border-zinc-100 rounded-3xl sm:px-10">
            
            {/* Header switcher tabs */}
            <div className="flex border-b border-zinc-100 pb-3 mb-6">
              <button
                id="btn-auth-login"
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
                className={`flex-1 text-center font-sans text-sm font-bold pb-2 border-b-2 transition-colors ${
                  authTab === 'login' ? 'border-zinc-900 text-zinc-950' : 'border-transparent text-zinc-400'
                }`}
              >
                Sign In
              </button>
              <button
                id="btn-auth-register"
                onClick={() => { setAuthTab('register'); setAuthError(''); }}
                className={`flex-1 text-center font-sans text-sm font-bold pb-2 border-b-2 transition-colors ${
                  authTab === 'register' ? 'border-zinc-900 text-zinc-950' : 'border-transparent text-zinc-400'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error state alert banner */}
            {authError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-750 text-xs px-4 py-3 rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form Login */}
            {authTab === 'login' ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Email address
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="input-login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="karthik@example.com"
                      className="block w-full pl-10 pr-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Security Password
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="input-login-password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-805 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-zinc-950 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white mr-2" /> : 'Sign In securely'}
                  </button>
                </div>
              </form>
            ) : (
              /* Registration form */
              <form className="space-y-4" onSubmit={handleRegister}>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="D.karthik"
                    className="block w-full px-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Email address
                  </label>
                  <input
                    id="input-reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="karthik@example.com"
                    className="block w-full px-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Security Password
                  </label>
                  <input
                    id="input-reg-password"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="block w-full px-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Reporting Base Currency Set
                  </label>
                  <select
                    id="input-reg-currency"
                    value={regBaseCurrency}
                    onChange={(e) => setRegBaseCurrency(e.target.value as CurrencyCode)}
                    className="block w-full px-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 sm:text-sm"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - United States Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="AUD">AUD (A$) - Australian Dollar</option>
                    <option value="CAD">CAD (C$) - Canadian Dollar</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-reg-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-805 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-zinc-950 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white mr-2" /> : 'Create Account & start'}
                  </button>
                </div>
              </form>
            )}

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white px-2 text-zinc-400 font-sans font-semibold">Demo Sandbox Rules</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[11px] font-sans text-zinc-400">
                This project saves transactions securely on-container. Set your secrets using the builder Secrets panel.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Session loaded but user profile is currently loading asynchronously
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-10 w-10 text-zinc-950 animate-spin" />
          <span className="font-sans text-xs font-semibold text-zinc-500">Retrieving wealth security session...</span>
        </div>
      </div>
    );
  }

  // Active Main dashboard page
  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col md:flex-row">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        tab={tab} 
        setTab={setTab} 
        onOcrScan={() => setIsReceiptScannerOpen(true)}
        onCsvImport={() => setIsCSVImportOpen(true)}
        onAddTransaction={() => setIsAddTxnOpen(true)}
      />

      {/* Floating Global Activity Alerts & Notifications */}
      {actionSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-zinc-800 text-white shadow-xl rounded-xl px-4 py-3 flex items-center gap-2.5 animate-slide-in-right">
          <Check className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-sans text-xs font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 min-w-0 max-h-screen overflow-y-auto pb-16 md:pb-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          
          {/* Header summary panel */}
          <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/50 pb-5">
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950 leading-tight">
                {tab === 'dashboard' && 'Financial Intelligence Hub'}
                {tab === 'transactions' && 'Vault Transaction Ledger'}
                {tab === 'budgets' && 'Limits & Core Budgets'}
                {tab === 'ai-coach' && 'Wealth Intelligence Advisor'}
              </h1>
              <p className="font-sans text-xs sm:text-sm font-medium text-zinc-500 mt-0.5">
                Welcome back, <strong className="text-zinc-900">{user.name}</strong>. Real-time bookkeeping ledger active.
              </p>
            </div>

            {/* Core Command Buttons - Visible ONLY on mobile since desktop gets them on the elegant Sidebar */}
            <div className="flex items-center gap-2 flex-wrap md:hidden">
              <button
                id="header-btn-ocr"
                onClick={() => setIsReceiptScannerOpen(true)}
                className="px-3 py-1.5 font-sans text-[10px] font-bold rounded-xl bg-white text-zinc-850 border border-zinc-200 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Camera className="h-3.5 w-3.5 text-zinc-500" />
                <span>Scan Receipt</span>
              </button>
              <button
                id="header-btn-csv"
                onClick={() => setIsCSVImportOpen(true)}
                className="px-3 py-1.5 font-sans text-[10px] font-bold rounded-xl bg-white text-zinc-850 border border-zinc-200 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Upload className="h-3.5 w-3.5 text-zinc-500" />
                <span>CSV</span>
              </button>
              <button
                id="header-btn-add-txn"
                onClick={() => setIsAddTxnOpen(true)}
                className="px-4 py-1.5 font-sans text-[10px] font-bold rounded-xl bg-zinc-950 text-white hover:bg-zinc-805 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </section>

        {/* 1. KPIs Block */}
        {kpis ? (
          <KPICard kpi={kpis} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-zinc-100 rounded-2xl h-[126px] p-5" />
            ))}
          </div>
        )}

        {/* 2. TAB DIRECTIVE PANELS */}

        {/* ==========================================
            TAB: DASHBOARD
            ========================================== */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Main Visual charts & insights - COL: 8 */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* SVG Charts visualizers */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-zinc-100">
                  <div>
                    <h3 className="font-sans font-bold text-base text-zinc-900">
                      Spends & Earnings Trends
                    </h3>
                    <p className="text-[11px] font-sans text-zinc-400">
                      Calculated relative to your profile base currency: <strong>{user.currency}</strong>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-zinc-500 font-semibold">
                      <span className="h-3 w-3 bg-emerald-500 rounded-full block shadow-xs" />
                      Inflows
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-500 font-semibold">
                      <span className="h-3 w-3 bg-rose-500 rounded-full block shadow-xs" />
                      Outflows
                    </span>
                  </div>
                </div>

                {/* Inline High-Contrast Chart Trend with Scaled Grid lines */}
                {chartMonthlyTrend.length > 0 ? (
                  (() => {
                    const maxValue = Math.max(...chartMonthlyTrend.map(d => Math.max(d.income, d.expense, 100)));
                    return (
                      <div className="relative mt-6 pt-2 pb-6">
                        {/* Background Grid Lines & Y-Axis Labels */}
                        <div className="absolute top-2 bottom-8 left-0 right-0 flex flex-col justify-between pointer-events-none">
                          {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => {
                            const gridVal = maxValue * ratio;
                            return (
                              <div key={idx} className="w-full flex items-center h-0 relative">
                                <span className="absolute -left-1 font-mono text-[9px] text-zinc-400 font-extrabold w-14 text-right pr-2">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(gridVal)}
                                </span>
                                <div className="w-full ml-14 border-b border-dashed border-zinc-200" />
                              </div>
                            );
                          })}
                        </div>

                        {/* Bars Content Wrapper */}
                        <div className="h-48 flex items-end justify-between gap-3 ml-14 pr-2 relative z-10">
                          {chartMonthlyTrend.map((data, index) => {
                            // Make maxHeight cover up to 160px
                            const incHeight = (data.income / maxValue) * 160;
                            const expHeight = (data.expense / maxValue) * 160;
                            
                            return (
                              <div key={index} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                                {/* Hover data indicator */}
                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-zinc-950 text-white text-[10px] py-1.5 px-2.5 rounded-xl pointer-events-none transition-all duration-200 shadow-xl z-20 whitespace-nowrap text-center border border-zinc-800">
                                  <span className="block font-bold text-zinc-400 mb-0.5">{data.month}</span>
                                  <span className="block text-emerald-400 font-bold font-mono">Inflow: +{new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(data.income)}</span>
                                  <span className="block text-rose-400 font-bold font-mono">Outflow: -{new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(data.expense)}</span>
                                </div>

                                {/* Two Side-By-Side bars with highly vibrant, high-contrast colors */}
                                <div className="flex gap-1.5 w-full justify-center items-end h-[160px]">
                                  <div 
                                    style={{ height: `${Math.max(incHeight, 4)}px` }}
                                    className="w-4 sm:w-7 bg-emerald-500 rounded-t-lg hover:bg-emerald-400 transition-all duration-300 shadow-sm hover:shadow-emerald-500/25 cursor-pointer" 
                                  />
                                  <div 
                                    style={{ height: `${Math.max(expHeight, 4)}px` }}
                                    className="w-4 sm:w-7 bg-rose-500 rounded-t-lg hover:bg-rose-400 transition-all duration-300 shadow-sm hover:shadow-rose-500/25 cursor-pointer" 
                                  />
                                </div>
                                
                                <span className="font-sans text-[11px] font-black text-zinc-500 mt-2 block shrink-0">
                                  {data.month}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-400">
                    <Activity className="h-8 w-8 mb-2 animate-pulse" />
                    <span className="font-sans text-xs font-semibold">Inflows & Outflows stats empty</span>
                    <span className="font-sans text-[10px] text-zinc-400">Generate cash transactions to load trending charts</span>
                  </div>
                )}
              </div>

              {/* Sub grid: Recent Transactions & Category Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Category Spends distribution list */}
                <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-sans font-bold text-base text-zinc-900">
                      Liquidity Spends by Category
                    </h3>
                    <p className="text-[11px] font-sans text-zinc-400 mb-4">
                      Allocation breakdown of current month costs.
                    </p>
                  </div>

                  {chartCategories.length > 0 ? (
                    <div className="space-y-3.5">
                      {chartCategories.slice(0, 5).map((item, idx) => {
                        const styleClass = getBorderColorClass(item.color);
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-sans font-bold text-zinc-800 flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full inline-block ${getCategoryColorClass(item.color)}`} />
                                {item.category}
                              </span>
                              <span className="font-mono font-semibold text-zinc-900">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(item.value)} ({item.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                style={{ width: `${item.percentage}%` }}
                                className={`h-full rounded-full ${getCategoryColorClass(item.color)}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                      <PieChart className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                      <span className="font-sans text-xs">No current category details found</span>
                    </div>
                  )}
                </div>

                {/* Target Budgets warnings */}
                <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-sans font-bold text-base text-zinc-900">
                      Budget Target Limits
                    </h3>
                    <p className="text-[11px] font-sans text-zinc-400 mb-4">
                      Monitor limits on high-spend categories.
                    </p>
                  </div>

                  {budgets.length > 0 ? (
                    <div className="space-y-4">
                      {budgets.slice(0, 4).map((b, idx) => {
                        // Compute spending against this category
                        const relevantTxns = transactions.filter(t => t.type === 'EXPENSE' && (b.categoryName === 'All' || t.categoryName === b.categoryName));
                        const spent = relevantTxns.reduce((sum, t) => sum + t.amountBase, 0);
                        const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                        const isOver = progress >= 100;
                        const isWarn = progress >= 85 && !isOver;

                        return (
                          <div key={b.id} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-sans font-extrabold text-zinc-850">
                                {b.categoryName === 'All' ? 'Overall Budget' : b.categoryName}
                              </span>
                              <span className="font-sans text-[11px] text-zinc-500">
                                <strong className="text-zinc-900 font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(spent)}</strong> of {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(b.amount)}
                              </span>
                            </div>
                            
                            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(progress, 100)}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-zinc-950'
                                }`}
                              />
                            </div>

                            {isOver && (
                              <span className="text-[10px] font-sans font-bold text-rose-600 block flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                Limit surpassed! Avoid more spends here.
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                      <Target className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                      <span className="font-sans text-xs">No active budgets are configured</span>
                      <button 
                        onClick={() => setIsAddBudgetOpen(true)}
                        className="mt-2 text-xs font-bold text-zinc-900 hover:underline block mx-auto"
                      >
                        Set Budget target
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Side column: Real-Time AI Advisor & Quick Actions ledger - COL: 4 */}
            <div className="lg:col-span-4 space-y-6">

              {/* Gemini Advisor Widget Panel */}
              <div className="bg-zinc-900 text-white border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-zinc-800 rounded-full opacity-20 -mr-12 -mt-12 blur-xl" />
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 bg-zinc-800 rounded-lg flex items-center justify-center text-amber-400 border border-zinc-700">
                    <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-zinc-100">AI Wealth Coach</h3>
                    <span className="text-[10px] font-mono text-zinc-400">Personal Advisor for D.karthik</span>
                  </div>
                </div>

                {isAiAdviceLoading ? (
                  <div className="space-y-3 py-4">
                    <div className="h-3 bg-zinc-800 rounded-full w-3/4 animate-pulse" />
                    <div className="h-3 bg-zinc-800 rounded-full animate-pulse" />
                    <div className="h-3 bg-zinc-800 rounded-full w-5/6 animate-pulse" />
                  </div>
                ) : aiCoachAdvice ? (
                  <div className="font-sans text-xs text-zinc-300 leading-relaxed space-y-2.5 whitespace-pre-wrap">
                    {aiCoachAdvice}
                  </div>
                ) : (
                  <p className="font-sans text-xs text-zinc-400 mb-4 leading-relaxed">
                    Have Gemini scan your latest transactions list to construct structured insights on saving margins, recurring costs, and budget forecasts.
                  </p>
                )}

                <button
                  id="btn-trigger-ai-insights"
                  onClick={fetchAICoachAdvice}
                  disabled={isAiAdviceLoading}
                  className="mt-4 w-full py-2 bg-white text-zinc-950 rounded-xl font-sans text-xs font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1"
                >
                  {isAiAdviceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh Wealth Insights</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Transaction Log overview */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-sans font-bold text-sm text-zinc-900">
                    Quick Cash-flow Journal
                  </h3>
                  <button
                    onClick={() => setTab('transactions')}
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {transactions.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {transactions.slice(0, 5).map(t => (
                      <div key={t.id} className="py-2.5 flex justify-between items-center group">
                        <div className="min-w-0 pr-2">
                          <span className="font-sans font-bold text-xs text-zinc-900 block truncate">
                            {t.description}
                          </span>
                          <span className="font-sans text-[10px] text-zinc-400 flex items-center gap-1.5">
                            <span>{new Date(t.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="font-semibold text-zinc-500">{t.categoryName}</span>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-mono text-xs font-bold block ${
                            t.type === 'INCOME' ? 'text-emerald-600' : 'text-zinc-900'
                          }`}>
                            {t.type === 'INCOME' ? '+' : '-'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: t.currency, maximumFractionDigits: 0 }).format(t.amount)}
                          </span>
                          {t.currency !== user.currency && (
                            <span className="font-mono text-[9px] text-zinc-400 block">
                              Base: {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(t.amountBase)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border border-dashed border-zinc-100 rounded-xl text-zinc-400 text-xs">
                    <span>No transactions. Log a manual or OCR transaction to track balance.</span>
                  </div>
                )}
              </div>

              {/* Savings Targets Deck */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-zinc-900">
                      Savings Goals
                    </h3>
                    <p className="text-[10px] font-sans text-zinc-400 font-medium">
                      Fund individual targets dynamically
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddGoalOpen(true)}
                    className="p-1 px-2.5 rounded-xl text-zinc-850 hover:bg-zinc-50 border border-zinc-200 bg-white font-sans text-xs font-bold inline-flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Create Target</span>
                  </button>
                </div>

                {goals.length > 0 ? (
                  <div className="space-y-4 pt-1">
                    {goals.map(g => {
                      const percentage = g.targetAmount > 0 ? Math.min(100, (g.currentSaved / g.targetAmount) * 100) : 0;
                      return (
                        <div key={g.id} className="border border-zinc-100 p-3.5 rounded-2xl relative space-y-2 group overflow-hidden bg-zinc-50/25">
                          {percentage >= 100 && (
                            <div className="absolute top-0 right-0 bg-emerald-550 text-emerald-800 text-[8px] font-bold uppercase px-2 py-0.5 rounded-bl-lg">
                              Acquired!
                            </div>
                          )}
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 pr-1">
                              <span className="font-sans font-extrabold text-xs text-zinc-950 block truncate">
                                {g.name}
                              </span>
                              <span className="font-mono text-[9px] text-zinc-405 block font-semibold">
                                Target: {new Intl.NumberFormat('en-US', { style: 'currency', currency: g.currency, maximumFractionDigits: 0 }).format(g.targetAmount)} (by {g.targetDate})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setActiveDepositGoalId(g.id);
                                  setIsDepositOpen(true);
                                }}
                                className="p-1 px-2 hover:bg-zinc-900 hover:text-white rounded-lg text-zinc-550 border border-zinc-150 transition-all font-sans text-[10px] font-bold bg-white"
                              >
                                Allocate
                              </button>
                              <button
                                onClick={() => removeGoal(g.id)}
                                className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-105 shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[10px] font-bold text-zinc-500">
                              <span>Saved: {new Intl.NumberFormat('en-US', { style: 'currency', currency: g.currency, maximumFractionDigits: 0 }).format(g.currentSaved)}</span>
                              <span>{Math.round(percentage)}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                style={{ width: `${percentage}%` }}
                                className="h-full bg-zinc-950 rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center border border-dashed border-zinc-150 rounded-2xl text-zinc-400">
                    <Coins className="h-8 w-8 mx-auto mb-2 text-zinc-350 animate-pulse" />
                    <p className="font-sans text-xs">No micro-savings goals created</p>
                    <button
                      onClick={() => setIsAddGoalOpen(true)}
                      className="mt-2 text-[11px] font-bold text-zinc-950 hover:underline block mx-auto"
                    >
                      Configure savings targets
                    </button>
                  </div>
                )}
              </div>

              {/* Wealth Compound Estimator Slider Block */}
              <div className="bg-zinc-950 text-white border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="font-sans font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Compound Wealth Estimator</span>
                  </h3>
                  <p className="text-[10px] font-sans text-zinc-400 leading-normal">
                    Estimate assets accumulation using custom monthly investment contributions
                  </p>
                </div>

                <div className="space-y-3.5 pt-1">
                  {/* Slider 1: Monthly Saving contribution */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-sans text-xs font-semibold">
                      <span className="text-zinc-400">Monthly Deposit Rate</span>
                      <span className="text-zinc-100 font-bold font-mono">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(calcMonthlyInvestment)}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min={100} 
                      max={50000} 
                      step={100}
                      value={calcMonthlyInvestment} 
                      onChange={(e) => setCalcMonthlyInvestment(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  {/* Slider 2: Annual return rate */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-sans text-xs font-semibold">
                      <span className="text-zinc-400">ROI Rate (Annual compounding)</span>
                      <span className="text-lime-400 font-bold font-mono">
                        {calcReturnRate}%
                      </span>
                    </div>
                    <input 
                      type="range"
                      min={1} 
                      max={30} 
                      step={1}
                      value={calcReturnRate} 
                      onChange={(e) => setCalcReturnRate(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                    />
                  </div>

                  {/* Slider 3: Timeline in years */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-sans text-xs font-semibold">
                      <span className="text-zinc-400">Time Horizon Duration</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {calcPeriodYears} Years
                      </span>
                    </div>
                    <input 
                      type="range"
                      min={1} 
                      max={45} 
                      step={1}
                      value={calcPeriodYears} 
                      onChange={(e) => setCalcPeriodYears(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  {/* Calculations Math block */}
                  {(() => {
                    const P = calcMonthlyInvestment;
                    const r = (calcReturnRate / 100) / 12;
                    const n = calcPeriodYears * 12;
                    // Formula for SIP future value: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
                    const futureValue = r > 0 ? P * (((Math.pow(1 + r, n) - 1) / r) * (1 + r)) : P * n;
                    const totalInvested = P * n;
                    const cumulativeEarnings = Math.max(0, futureValue - totalInvested);

                    return (
                      <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-850 space-y-2 pt-4">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-805">
                          <span className="font-sans text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Accumulated Balance</span>
                          <span className="font-mono text-emerald-400 text-sm font-black">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(futureValue)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-zinc-400">Total Invested Principal</span>
                          <span className="text-zinc-300 font-bold font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(totalInvested)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-zinc-400 font-sans">Compounded Yield Gain</span>
                          <span className="font-bold text-lime-400 font-mono">+{new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency, maximumFractionDigits: 0 }).format(cumulativeEarnings)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB: TRANSACTIONS (LIST & ADVANCED FILTERS & ANALYZER)
            ========================================== */}
        {tab === 'transactions' && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs max-w-7xl mx-auto space-y-6">
            
            {/* Filter and Command header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              
              {/* Search input query */}
              <div className="w-full md:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search description, category..."
                  className="w-full px-3.5 py-2 text-xs font-medium font-sans border border-zinc-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              {/* Selection options filters row */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* 1. Type */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-white font-sans text-xs font-semibold text-zinc-600"
                >
                  <option value="ALL">All Types</option>
                  <option value="EXPENSE">Expense Outflows</option>
                  <option value="INCOME">Income Inflows</option>
                </select>

                {/* 2. Category list matching */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-white font-sans text-xs font-semibold text-zinc-600"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {/* 3. Source */}
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-white font-sans text-xs font-semibold text-zinc-600"
                >
                  <option value="ALL">All Sources</option>
                  <option value="manual">Manual Entry</option>
                  <option value="receipt">Image Scan (OCR)</option>
                  <option value="csv">CSV Statement</option>
                </select>

                <button
                  onClick={() => setIsAddCatOpen(true)}
                  className="px-3.5 py-1.5 font-sans text-xs font-semibold text-zinc-805 hover:bg-zinc-100 rounded-xl border border-zinc-200 bg-white transition-colors"
                >
                  Add Custom Category
                </button>
              </div>

            </div>

            {/* Table layout displaying active items */}
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-zinc-100">
                <table className="min-w-full divide-y divide-zinc-100 text-left">
                  <thead className="bg-zinc-50/75">
                    <tr>
                      <th className="px-4 py-3 font-sans text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 font-sans text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 font-sans text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 font-sans text-xs font-bold text-zinc-500 uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 font-sans text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Raw Amt</th>
                      <th className="px-4 py-3 font-sans text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Base Currency Value ({user.currency})</th>
                      <th className="px-4 py-3 font-sans text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredTransactions.map((t) => {
                      const matchCat = categories.find(c => c.name === t.categoryName);
                      const catColor = matchCat ? matchCat.color : 'slate';
                      
                      return (
                        <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-zinc-500">
                            {t.date}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-zinc-900">
                            {t.description}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${getBorderColorClass(catColor)}`}>
                              {t.categoryName}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              t.source === 'receipt' ? 'bg-amber-100 text-amber-800' :
                              t.source === 'csv' ? 'bg-blue-105 text-blue-800' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {t.source}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-right">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: t.currency }).format(t.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-right text-zinc-950">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency }).format(t.amountBase)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-xs">
                            <button
                              onClick={() => deleteTxn(t.id)}
                              className="p-1 px-2 hover:bg-rose-50 rounded-lg text-rose-500 border border-transparent hover:border-rose-100 transition-all inline-flex items-center gap-1 font-sans text-xs font-bold"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Trash</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
                <Filter className="h-10 w-10 mx-auto text-zinc-300 mb-3 animate-pulse" />
                <h3 className="font-sans font-bold text-sm text-zinc-700">No transactions match filters</h3>
                <p className="font-sans text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Expand your filter categories or record new financial entries to fill this audit logger list context.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ==========================================
            TAB: BUDGETS (LIMIT CONFIG & MANAGEMENT)
            ========================================== */}
        {tab === 'budgets' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Limit configuration form */}
            <div className="lg:col-span-4 bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-sans font-bold text-base text-zinc-900 border-b border-zinc-100 pb-3">
                Configure Budget track Limit
              </h3>
              
              <form onSubmit={submitBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Applicable Scope
                  </label>
                  <select
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold"
                  >
                    <option value="All">All Categories (Overall Limit)</option>
                    {categories.filter(c => c.type === 'EXPENSE').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Threshold Limit Amount ({user.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="E.g. 15000"
                    className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold placeholder-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Budget Cycle Period
                  </label>
                  <select
                    value={budgetPeriod}
                    onChange={(e) => setBudgetPeriod(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold"
                  >
                    <option value="monthly">Monthly Allocation</option>
                    <option value="weekly">Weekly Allocation</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-805 text-white rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Target className="h-4 w-4" />
                  <span>{isLoading ? 'Registering...' : 'Register Budget target limit'}</span>
                </button>
              </form>
            </div>

            {/* List and progress breakdown of active budgets */}
            <div className="lg:col-span-8 bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-sans font-bold text-base text-zinc-900 border-b border-zinc-100 pb-3">
                Live Budget Performance Metrics
              </h3>

              {budgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgets.map((b) => {
                    const relevantTxns = transactions.filter(t => t.type === 'EXPENSE' && (b.categoryName === 'All' || t.categoryName === b.categoryName));
                    const spent = relevantTxns.reduce((sum, t) => sum + t.amountBase, 0);
                    const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                    const isOver = progress >= 100;
                    
                    return (
                      <div key={b.id} className="border border-zinc-150 rounded-2xl p-4 space-y-3 shadow-xs relative overflow-hidden">
                        {isOver && (
                          <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-bl-lg">
                            Over-Limit
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-sans font-extrabold text-sm text-zinc-900 block truncate">
                              {b.categoryName === 'All' ? 'Overall Budget Track' : b.categoryName}
                            </span>
                            <span className="font-sans text-[10px] text-zinc-400 capitalize block font-medium">
                              Period: {b.period}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => removeBudget(b.id)}
                            className="p-1 hover:bg-zinc-100 text-zinc-400 hover:text-rose-500 rounded-lg shrink-0 transition-colors"
                            title="Remove tracking"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-xs font-bold">
                            <span className="text-zinc-500">Spent: {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency }).format(spent)}</span>
                            <span className="text-zinc-900">{Math.round(progress)}%</span>
                          </div>

                          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                            <div
                              style={{ width: `${Math.min(progress, 100)}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOver ? 'bg-rose-500' : progress >= 85 ? 'bg-amber-400' : 'bg-zinc-900'
                              }`}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-zinc-400 font-medium pt-1">
                            <span>Limit Threshold: {new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency }).format(b.amount)}</span>
                            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: user.currency }).format(Math.max(b.amount - spent, 0))} left</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center border-2 border-dashed border-zinc-100 rounded-2xl">
                  <Target className="h-10 w-10 mx-auto text-zinc-300 mb-2 animate-pulse" />
                  <span className="font-sans text-xs">No active budgets tags have been declared</span>
                  <p className="font-sans text-[10px] text-zinc-400 max-w-sm mx-auto mt-1">
                    Declare and monitor custom limits across standard and personalized expense clusters.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: AI WEALTH COACH (DETAILED PORTFOLIO ADVICE)
            ========================================== */}
        {tab === 'ai-coach' && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-xs max-w-4xl mx-auto space-y-6 flex flex-col h-[650px]">
            
            {/* Header section inside the chat board */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b border-zinc-100 pb-4 justify-between shrink-0">
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-amber-400 shadow-md">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-sans font-extrabold text-base text-zinc-900">
                    Active AI Wealth Advisor Workspace
                  </h3>
                  <p className="font-sans text-[11px] text-zinc-400 font-medium">
                    Stateful session powered by <span className="font-bold text-zinc-700">Gemini 3.5 Flash Model</span>
                  </p>
                </div>
              </div>

              {/* Quick statistics reload helper */}
              <button
                onClick={fetchAICoachAdvice}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold font-sans bg-zinc-50 hover:bg-zinc-100 text-zinc-850 transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Fresh Ledger</span>
              </button>
            </div>

            {/* Scrollable Chat messages queue */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth" id="chat-scroller-container">
              {chatMessages.map((msg, index) => (
                <div 
                  key={msg.id || index}
                  className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    msg.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-850 border border-zinc-200'
                  }`}>
                    {msg.role === 'user' ? 'DK' : 'AI'}
                  </div>
                  
                  <div className={`p-4 rounded-2xl text-xs font-sans leading-relaxed space-y-2 whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-zinc-900 text-white rounded-tr-none' 
                      : 'bg-zinc-50 border border-zinc-200 rounded-tl-none text-zinc-850'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isChatSending && (
                <div className="flex items-start gap-3 max-w-[85%] mr-auto">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-850 border border-zinc-200 flex items-center justify-center text-[10px] font-bold shrink-0 animate-pulse">
                    AI
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 rounded-tl-none font-sans text-xs flex items-center gap-2 text-zinc-500 font-semibold animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                    <span>Coach compiling financial strategies...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Prompts Suggestion Chips */}
            <div className="shrink-0 space-y-2 pb-0.5 border-t border-zinc-100 pt-3">
              <span className="block text-[10px] uppercase font-mono font-bold text-zinc-400">
                Suggested Consultation Queries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "How is my Restaurant vs Grocery spending balance?",
                  "Suggest 5 simple strategies to expand my monthly savings rate",
                  "Explain compounding SIP projections in plain terms",
                  "What tax efficiency formulas should I remember?"
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    disabled={isChatSending}
                    onClick={() => {
                      setChatInput(txt);
                    }}
                    className="p-1.5 py-1 px-2.5 border border-zinc-250 hover:border-zinc-950 rounded-xl bg-white hover:bg-zinc-50 text-[10px] font-bold text-zinc-500 hover:text-zinc-950 transition-all font-sans"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input fields form interface */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 items-center shrink-0 border-t border-zinc-100 pt-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me about investments, SIP compounding targets, budget limits..."
                disabled={isChatSending}
                className="flex-1 px-4 py-2.5 sm:text-xs font-medium font-sans border border-zinc-200 bg-zinc-50 focus:bg-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-zinc-950 transition-colors"
              />
              <button
                type="submit"
                disabled={isChatSending || !chatInput.trim()}
                className="p-2.5 px-4 rounded-xl bg-zinc-950 text-white font-sans text-xs font-bold hover:bg-zinc-805 disabled:opacity-40 transition-all flex items-center gap-1 shrink-0"
              >
                <span>Consult</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        )}

      </main>
      </div>

      {/* ==========================================
          ACTION OVERLAYS / DIALOGS
          ========================================== */}

      {/* 1. DIALOG: Add Transaction */}
      {isAddTxnOpen && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-100 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsAddTxnOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-sans font-extrabold text-base text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-1.5">
              <Plus className="h-5 w-5" />
              <span>Log Financial Transaction</span>
            </h3>

            <form onSubmit={submitTransaction} className="space-y-4">
              
              <div className="flex border border-zinc-200 p-1 bg-zinc-50/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxnType('EXPENSE')}
                  className={`flex-1 text-center font-sans text-xs font-bold py-1.5 rounded-lg transition-colors ${
                    txnType === 'EXPENSE' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-400'
                  }`}
                >
                  Expense Outflow
                </button>
                <button
                  type="button"
                  onClick={() => setTxnType('INCOME')}
                  className={`flex-1 text-center font-sans text-xs font-bold py-1.5 rounded-lg transition-colors ${
                    txnType === 'INCOME' ? 'bg-white text-emerald-600 shadow-xs' : 'text-zinc-400'
                  }`}
                >
                  Income Inflow
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                  Description label
                </label>
                <input
                  id="input-txn-desc"
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g Zomato online dining"
                  className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold placeholder-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                    Value Quantity
                  </label>
                  <input
                    id="input-txn-amount"
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="E.g 450.50"
                    className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-bold placeholder-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                    Currency denomination
                  </label>
                  <select
                    id="input-txn-currency"
                    value={txnCurrency}
                    onChange={(e) => setTxnCurrency(e.target.value as CurrencyCode)}
                    className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-905 sm:text-xs font-bold"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <select
                    id="input-txn-category"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-905 sm:text-xs font-semibold"
                  >
                    {categories.filter(c => c.type === txnType).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                    Date of Expense
                  </label>
                  <input
                    id="input-txn-date"
                    type="date"
                    required
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-905 sm:text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                id="btn-txn-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-805 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Save Securely</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 2. DIALOG: CSV Paste Statement */}
      {isCSVImportOpen && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-lg p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsCSVImportOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-sans font-extrabold text-base text-zinc-900 border-b border-zinc-100 pb-3 mb-2 flex items-center gap-1.5">
              <Upload className="h-5 w-5 text-blue-500" />
              <span>Import Statements via CSV</span>
            </h3>
            
            <p className="font-sans text-xs text-zinc-400 mb-4">
              Upload bank statements cleanly. Use one line per transaction following columns: <strong className="text-zinc-700">Date, Amount, Description, Category, Type (EXPENSE/INCOME)</strong>.
            </p>

            <form onSubmit={handleCSVImport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-zinc-440 uppercase tracking-wider mb-1">
                  Format Outline: Date, Amount, Description, Category(Optional), Type(Optional)
                </label>
                <textarea
                  required
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="2026-05-10, 1500.00, Landlord PG Housing Rent, Housing & Rent, EXPENSE&#10;2026-05-12, 45000.00, Freelance Consulting Payment, Salary, INCOME"
                  className="block w-full p-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-zinc-950 hover:bg-zinc-805 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bulk parse and commit statement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. DIALOG: Receipt Scanner with Gemini Vision */}
      {isReceiptScannerOpen && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-100 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-lg p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => {
                setIsReceiptScannerOpen(false);
                setOcrResult(null);
                setOcrImageBase64('');
              }}
              className="absolute top-4 right-4 p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-sans font-extrabold text-base text-zinc-900 border-b border-zinc-100 pb-3 mb-2 flex items-center gap-1.5">
              <Camera className="h-5 w-5 text-amber-500 animate-pulse" />
              <span>Gemini Receipt Scanner (OCR)</span>
            </h3>

            <p className="font-sans text-xs text-zinc-400 mb-4">
              Select or snap an expense receipt billing slip image. Gemini 3.5 Flash automatically indexes the vendor name, values, categorizing logic.
            </p>

            <div className="space-y-4">
              
              {/* Image Input Selection Block */}
              {!ocrImageBase64 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl py-12 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-50/50"
                >
                  <Camera className="h-8 w-8 text-zinc-400 mb-2" />
                  <span className="font-sans text-xs font-bold text-zinc-800">Choose Receipt slip image</span>
                  <span className="font-sans text-[10px] text-zinc-400">JPG, PNG standard files supported</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={processReceiptImageFile}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-medium text-zinc-500">Selected file snapshot:</span>
                    <button
                      onClick={() => setOcrImageBase64('')}
                      className="text-[10px] font-bold text-rose-500 hover:underline"
                    >
                      Reset File
                    </button>
                  </div>
                  <div className="h-40 w-full border border-zinc-200 rounded-xl overflow-hidden bg-zinc-100 relative flex items-center justify-center">
                    <img
                      src={ocrImageBase64}
                      alt="Uploaded slip"
                      className="h-full object-contain"
                    />
                    {isOcrProcessing && (
                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center text-zinc-950 text-xs font-semibold gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Gemini parsing receipts bill details...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Parsed results list layout */}
              {ocrResult && (
                <div className="space-y-3 bg-zinc-50/75 border border-zinc-150 p-4 rounded-2xl">
                  <span className="font-sans text-[10px] uppercase font-extrabold text-zinc-400 block border-b border-zinc-200/50 pb-1">
                    AI Parsed Elements:
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Merchant/Vendor</span>
                      <strong className="text-zinc-900 font-bold block">{ocrResult.merchant}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Scope Category</span>
                      <strong className="text-zinc-900 font-bold block">{ocrResult.categoryName}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Date</span>
                      <strong className="text-zinc-900 font-bold block">{ocrResult.date}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Parsed Amount</span>
                      <strong className="text-zinc-900 font-bold block">{ocrResult.amount} {ocrResult.currency}</strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsReceiptScannerOpen(false);
                        setIsAddTxnOpen(true);
                      }}
                      className="w-full py-1.5 bg-zinc-950 text-white rounded-lg font-sans text-xs font-semibold flex items-center justify-center gap-1 hover:bg-zinc-805"
                    >
                      <span>Adjust & Verify values</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 4. DIALOG: Custom Category Register */}
      {isAddCatOpen && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-sm p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsAddCatOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-xl border border-zinc-105 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-sans font-extrabold text-base text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
              Declare Custom Category
            </h3>

            <form onSubmit={submitCustomCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Name Label
                </label>
                <input
                  type="text"
                  required
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  placeholder="E.g. Online Subscriptions"
                  className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Cluster Type
                </label>
                <select
                  value={customCatType}
                  onChange={(e) => setCustomCatType(e.target.value as any)}
                  className="block w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold"
                >
                  <option value="EXPENSE">Expense Category</option>
                  <option value="INCOME">Income Category</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Visual Accent Color
                </label>
                <select
                  value={customCatColor}
                  onChange={(e) => setCustomCatColor(e.target.value)}
                  className="block w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold"
                >
                  <option value="emerald">Emerald Green</option>
                  <option value="blue">Deep Blue</option>
                  <option value="amber">Amber Yellow</option>
                  <option value="purple">Royal Purple</option>
                  <option value="red">Alert Red</option>
                  <option value="indigo">Indigo Blue</option>
                  <option value="pink">Blush Pink</option>
                  <option value="teal">Teal Green</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-805 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Save custom category</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. DIALOG: Create Savings Goal Target */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-sm p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsAddGoalOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-sans font-extrabold text-base text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
              Create Savings Target
            </h3>

            <form onSubmit={submitSavingsGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Target Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="E.g. Brand New Macbook Pro 16"
                  className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold placeholder-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Savings Target Goal Sum ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="1"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(e.target.value)}
                  placeholder="E.g. 180000"
                  className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold placeholder-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Expected Timeline Target Date
                </label>
                <input
                  type="date"
                  required
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-805 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white mr-1" /> : <Coins className="h-4 w-4" />}
                <span>{isLoading ? 'Creating...' : 'Register Goal'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. DIALOG: Goal deposit allocation / withdrawal form */}
      {isDepositOpen && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-sm p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => {
                setIsDepositOpen(false);
                setGoalDepositAmount('');
              }}
              className="absolute top-4 right-4 p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-sans font-extrabold text-base text-zinc-900 border-b border-zinc-100 pb-3 mb-2">
              Allocate Goal Core Capital
            </h3>

            <p className="font-sans text-xs text-zinc-400 mb-4">
              Enter positive value to add capital, or negative value to withdraw/re-route capital resources from this savings pool.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Adjustment Amount ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={goalDepositAmount}
                  onChange={(e) => setGoalDepositAmount(e.target.value)}
                  placeholder="E.g. +5000 or -2000"
                  className="block w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-900 sm:text-xs font-semibold placeholder-zinc-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-805 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white mr-1" /> : <Coins className="h-4 w-4" />}
                <span>{isLoading ? 'Processing...' : 'Submit Allocation shift'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
