import { useState, useEffect, useCallback } from 'react';
import {
  X, Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal, Banknote, TrendingUp, Gift, Plus, ChevronLeft
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { defaultCategories, incomeCategories } from '@/data/defaultCategories';

const iconMap: Record<string, typeof Coffee> = {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal, Banknote, TrendingUp, Gift, Plus,
};

const numpadKeys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
];

export function AddTransactionSheet() {
  const { state, dispatch, addTransaction } = useApp();
  const brand = useTheme();
  const [step, setStep] = useState<'category' | 'amount' | 'detail'>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(state.selectedDate);
  const [note, setNote] = useState('');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isOpen = state.bottomSheetOpen;

  const categories = (txType === 'expense' ? defaultCategories : incomeCategories)
    .concat(state.categories.filter(c => c.type === txType && !c.deleted))
    .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  const selectedCat = categories.find(c => c.id === selectedCategory);

  // Lazy mount inner content when sheet first opens
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const t = setTimeout(() => {
        setMounted(false);
        setStep('category');
        setSelectedCategory('');
        setAmount('');
        setNote('');
        setTxType('expense');
        setShowSuccess(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleNumpad = useCallback((key: string) => {
    try { if (navigator.vibrate) navigator.vibrate(8); } catch { /* ignore */ }
    if (key === 'del') { setAmount(prev => prev.slice(0, -1)); }
    else if (key === '.') { if (!amount.includes('.')) setAmount(prev => prev + '.'); }
    else { if (amount.length < 10) setAmount(prev => prev + key); }
  }, [amount]);

  const handleCategorySelect = (catId: string) => {
    try { if (navigator.vibrate) navigator.vibrate(10); } catch { /* ignore */ }
    setSelectedCategory(catId);
    setStep('amount');
  };

  const handleBack = () => {
    if (step === 'amount') { setStep('category'); setAmount(''); }
    else if (step === 'detail') { setStep('amount'); }
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!selectedCategory || isNaN(numAmount) || numAmount <= 0) return;
    addTransaction({
      amount: numAmount,
      category: selectedCategory,
      date: selectedDate,
      note: note.trim() || undefined,
      type: txType,
    });
    setShowSuccess(true);
    try { if (navigator.vibrate) navigator.vibrate([30, 50, 30]); } catch { /* ignore */ }
    setTimeout(() => dispatch({ type: 'CLOSE_BOTTOM_SHEET' }), 800);
  };

  const canSubmit = parseFloat(amount) > 0;

  return (
    <div className={`bottom-sheet ${isOpen ? 'open' : ''}`}>
      {/* Backdrop */}
      <div className="bottom-sheet-backdrop" onClick={() => dispatch({ type: 'CLOSE_BOTTOM_SHEET' })} />

      {/* Panel */}
      <div className="bottom-sheet-panel">
        {/* Success burst overlay */}
        <div
          className={`success-burst ${showSuccess ? 'show' : ''}`}
          style={{ backgroundColor: selectedCat?.color || brand }}
        >
          <div className="success-burst-inner text-center text-white">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-semibold">记账成功</p>
          </div>
        </div>

        {/* Only render inner content after mount to reduce initial paint */}
        {mounted && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              {step !== 'category' ? (
                <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center -ml-1">
                  <ChevronLeft size={24} style={{ color: '#1A1A1A' }} />
                </button>
              ) : (
                <div className="w-10" />
              )}
              <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>
                {step === 'category' && '新建记账'}
                {step === 'amount' && selectedCat?.name}
                {step === 'detail' && '详细信息'}
              </h2>
              <button
                onClick={() => dispatch({ type: 'CLOSE_BOTTOM_SHEET' })}
                className="w-10 h-10 flex items-center justify-center -mr-1"
              >
                <X size={22} style={{ color: '#8A8A8E' }} />
              </button>
            </div>

            {/* Type Toggle */}
            {step === 'category' && (
              <div className="flex justify-center gap-1 p-2 mx-4 mb-2 rounded-xl" style={{ backgroundColor: '#F2F2F7' }}>
                <button
                  onClick={() => setTxType('expense')}
                  className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                  style={txType === 'expense'
                    ? { backgroundColor: '#fff', color: '#FF3B30', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: '#8A8A8E' }}
                >
                  支出
                </button>
                <button
                  onClick={() => setTxType('income')}
                  className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                  style={txType === 'income'
                    ? { backgroundColor: '#fff', color: '#34C759', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: '#8A8A8E' }}
                >
                  收入
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
              {step === 'category' && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => {
                      const Icon = iconMap[cat.icon] || MoreHorizontal;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors active:opacity-80"
                          style={{ backgroundColor: `${cat.color}15` }}
                        >
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
                            <Icon size={24} style={{ color: cat.color }} strokeWidth={1.5} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 'amount' && (
                <div className="flex flex-col">
                  <div className="px-6 py-6 text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-medium" style={{ color: '#8A8A8E' }}>¥</span>
                      <span
                        className="font-bold"
                        style={{ color: '#1A1A1A', fontSize: amount.length > 7 ? '2.25rem' : '3rem' }}
                      >
                        {amount || '0'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {numpadKeys.flat().map((key) => (
                        <button
                          key={key}
                          onClick={() => handleNumpad(key)}
                          className="h-14 rounded-xl flex items-center justify-center font-medium transition-all active:scale-[0.97]"
                          style={key === 'del'
                            ? { backgroundColor: '#F2F2F7', color: '#1A1A1A', fontSize: '0.875rem' }
                            : { backgroundColor: '#fff', color: '#1A1A1A', fontSize: '1.5rem', border: '1px solid #F0F0F0' }}
                        >
                          {key === 'del' ? '删除' : key}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => setStep('detail')}
                        className="flex-1 h-14 rounded-xl text-sm font-medium transition-colors"
                        style={{ backgroundColor: '#F2F2F7', color: '#1A1A1A' }}
                      >
                        添加备注
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex-1 h-14 rounded-xl font-semibold text-white active:scale-[0.97] transition-all disabled:opacity-40"
                        style={{ backgroundColor: selectedCat?.color || brand }}
                      >
                        完成
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'detail' && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: '#8A8A8E' }}>日期</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl font-medium text-base outline-none"
                      style={{ backgroundColor: '#F9FAFB', color: '#1A1A1A' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: '#8A8A8E' }}>备注</label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="添加备注信息..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl font-medium text-base outline-none resize-none"
                      style={{ backgroundColor: '#F9FAFB', color: '#1A1A1A' }}
                    />
                  </div>
                  <button
                    onClick={() => setStep('amount')}
                    className="w-full h-12 rounded-xl font-semibold text-white active:scale-[0.97] transition-all"
                    style={{ backgroundColor: selectedCat?.color || brand }}
                  >
                    确认
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
