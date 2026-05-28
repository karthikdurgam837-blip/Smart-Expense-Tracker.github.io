import { LogOut, User, Landmark, Sparkles, TrendingUp, DollarSign, Camera, Upload, Plus } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  tab: string;
  setTab: (tab: string) => void;
  onOcrScan: () => void;
  onCsvImport: () => void;
  onAddTransaction: () => void;
}

export default function Header({ 
  user, 
  onLogout, 
  tab, 
  setTab,
  onOcrScan,
  onCsvImport,
  onAddTransaction
}: HeaderProps) {
  return (
    <>
      {/* ==========================================
          DESKTOP SIDEBAR NAVIGATION (md:flex)
          ========================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-zinc-150 h-screen sticky top-0 shrink-0 z-40 justify-between p-6">
        
        {/* Top: Branding & Identity */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-md shadow-zinc-900/10 animate-fade-in">
              <Landmark className="h-5.5 w-5.5 text-zinc-105" />
            </div>
            <div>
              <span className="font-sans font-black text-base tracking-tight text-zinc-950 block leading-none">
                SmartSpend
              </span>
              <span className="font-sans text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                Finance Lab
              </span>
            </div>
          </div>

          {/* User Profile Quick Banner */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-100/70 rounded-2xl flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-900 text-white font-sans text-xs font-black flex items-center justify-center border border-zinc-900 shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-sans font-extrabold text-xs text-zinc-900 block truncate leading-tight">
                {user.name}
              </span>
              <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase leading-none">
                Index: <strong className="text-zinc-650 font-extrabold">{user.currency}</strong>
              </span>
            </div>
          </div>

          {/* Core Sidebar Links */}
          <nav className="space-y-1.5 pt-2">
            {[
              { id: 'dashboard', label: 'Financial Core', icon: TrendingUp },
              { id: 'transactions', label: 'Ledger Registry', icon: DollarSign },
              { id: 'budgets', label: 'Threshold Limits', icon: Landmark },
            ].map((t) => {
              const IconComp = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 font-sans text-xs font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 shadow-xs border border-zinc-150'
                      : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 border border-transparent'
                  }`}
                >
                  <IconComp className={`h-4.5 w-4.5 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}

            {/* Premium AI Advisor Hub Link */}
            <button
              onClick={() => setTab('ai-coach')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 font-sans text-xs font-black rounded-xl transition-all duration-200 ${
                tab === 'ai-coach'
                  ? 'bg-zinc-950 text-white shadow-md border border-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-905 hover:bg-zinc-50 border border-transparent'
              }`}
            >
              <Sparkles className={`h-4.5 w-4.5 text-amber-400 ${tab === 'ai-coach' ? 'animate-pulse' : ''}`} />
              <span>AI Strategic Mentor</span>
            </button>
          </nav>
        </div>

        {/* Action utility cluster */}
        <div className="space-y-4">
          <div className="border-t border-zinc-100 pt-5 space-y-2">
            <span className="block text-[9px] font-mono font-extrabold text-zinc-400 uppercase tracking-widest mb-2.5 px-3">
              Action Desk
            </span>

            {/* Action button: Log transaction */}
            <button
              onClick={onAddTransaction}
              className="w-full py-2.5 font-sans text-xs font-bold rounded-xl bg-zinc-950 text-white hover:bg-zinc-805 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transaction</span>
            </button>

            {/* Action button: Scan slip */}
            <button
              onClick={onOcrScan}
              className="w-full py-2.5 font-sans text-xs font-bold rounded-xl bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50/50 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Camera className="h-3.5 w-3.5 text-zinc-500" />
              <span>OCR Scan Receipt</span>
            </button>

            {/* Action button: Import CSV */}
            <button
              onClick={onCsvImport}
              className="w-full py-2.5 font-sans text-xs font-bold rounded-xl bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50/50 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Upload className="h-3.5 w-3.5 text-zinc-500" />
              <span>CSV Paste Import</span>
            </button>
          </div>

          {/* Bottom user logout option */}
          <div className="border-t border-zinc-100 pt-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 font-sans text-xs font-bold text-zinc-400 hover:text-rose-500 hover:bg-rose-50/40 rounded-xl transition-all"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              <span>Disconnect Ledger</span>
            </button>
          </div>
        </div>

      </aside>

      {/* ==========================================
          MOBILE VIEWPORT TOP BAR HEADER (md:hidden)
          ========================================== */}
      <header className="md:hidden border-b border-zinc-150 bg-white sticky top-0 z-40 shadow-xs px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-sans font-black text-xs tracking-tight text-zinc-950 block leading-tight">
              SmartSpend
            </span>
            <span className="font-sans text-[8px] font-bold text-zinc-400 tracking-wider">
              {user.name} ({user.currency})
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-950 transition-colors"
          title="Disconnect Ledger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* ==========================================
          MOBILE VIEWPORT BOTTOM FIXED NAVIGATION BAR
          ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-150 bg-white py-1.5 px-3 flex justify-around items-center shadow-lg">
        {[
          { id: 'dashboard', label: 'Dash', icon: TrendingUp },
          { id: 'transactions', label: 'Ledger', icon: DollarSign },
          { id: 'budgets', label: 'Limits', icon: Landmark },
        ].map((t) => {
          const IconComp = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-bold font-sans transition-colors ${
                isActive ? 'text-zinc-950' : 'text-zinc-400'
              }`}
            >
              <IconComp className="h-4.5 w-4.5 mb-0.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setTab('ai-coach')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-extrabold font-sans transition-colors ${
            tab === 'ai-coach' ? 'text-zinc-950' : 'text-zinc-400'
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse mb-0.5" />
          <span>AI Coach</span>
        </button>
      </nav>
    </>
  );
}
