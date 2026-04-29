import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal, Banknote, TrendingUp, Gift, Plus, ChevronLeft
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { defaultCategories, incomeCategories } from '@/data/defaultCategories';
import type { Transaction } from '@/types';

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
  const [step, setStep] = useState<'category' | 'amount' | 'detail'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(state.selectedDate);
  const [note, setNote] = useState('');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = (txType === 'expense' ? defaultCategories : incomeCategories)
    .concat(state.categories.filter(c => c.type === txType && !c.deleted))
    .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  const selectedCat = categories.find(c => c.id === selectedCategory);

  // Reset on close
  useEffect(() => {
    if (!state.bottomSheetOpen) {
      setTimeout(() => {
        setStep('category');
        setSelectedCategory('');
        setAmount('');
        setNote('');
        setTxType('expense');
        setShowSuccess(false);
      }, 300);
    }
  }, [state.bottomSheetOpen]);

  const handleNumpad = (key: string) => {
    try {
      if (navigator.vibrate) navigator.vibrate(8);
    } catch { /* ignore */ }

    if (key === 'del') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + '.');
      }
    } else {
      if (amount.length < 10) {
        setAmount(prev => prev + key);
      }
    }
  };

  const handleCategorySelect = (catId: string) => {
    try {
      if (navigator.vibrate) navigator.vibrate(10);
    } catch { /* ignore */ }
    setSelectedCategory(catId);
    setStep('amount');
  };

  const handleBack = () => {
    if (step === 'amount') {
      setStep('category');
      setAmount('');
    } else if (step === 'detail') {
      setStep('amount');
    }
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!selectedCategory || isNaN(numAmount) || numAmount <= 0) return;

    const tx: Omit<Transaction, 'id' | 'createdAt'> = {
      amount: numAmount,
      category: selectedCategory,
      date: selectedDate,
      note: note.trim() || undefined,
      type: txType,
    };

    addTransaction(tx);
    setShowSuccess(true);

    try {
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    } catch { /* ignore */ }

    setTimeout(() => {
      dispatch({ type: 'CLOSE_BOTTOM_SHEET' });
    }, 800);
  };

  const canSubmit = parseFloat(amount) > 0;

  return (
    <AnimatePresence>
      {state.bottomSheetOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch({ type: 'CLOSE_BOTTOM_SHEET' })}
          />

          {/* Sheet */}
          <motion.div
            className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '92vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 z-50 flex items-center justify-center rounded-t-3xl"
                  style={{ backgroundColor: selectedCat?.color || '#34C759' }}
                  initial={{ clipPath: 'circle(0% at 50% 80%)' }}
                  animate={{ clipPath: 'circle(150% at 50% 80%)' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                    className="text-center text-white"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                      className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4"
                    >
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.5, duration: 0.4 }}
                        />
                      </svg>
                    </motion.div>
                    <p className="text-xl font-semibold">记账成功</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              {step !== 'category' ? (
                <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center -ml-1">
                  <ChevronLeft size={24} className="text-[#1A1A1A]" />
                </button>
              ) : (
                <div className="w-10" />
              )}
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {step === 'category' && '新建记账'}
                {step === 'amount' && selectedCat?.name}
                {step === 'detail' && '详细信息'}
              </h2>
              <button
                onClick={() => dispatch({ type: 'CLOSE_BOTTOM_SHEET' })}
                className="w-10 h-10 flex items-center justify-center -mr-1"
              >
                <X size={22} className="text-[#8A8A8E]" />
              </button>
            </div>

            {/* Type Toggle */}
            {step === 'category' && (
              <div className="flex justify-center gap-1 p-2 mx-4 mb-2 bg-[#F2F2F7] rounded-xl">
                <button
                  onClick={() => setTxType('expense')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    txType === 'expense'
                      ? 'bg-white text-[#FF3B30] shadow-sm'
                      : 'text-[#8A8A8E]'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setTxType('income')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    txType === 'income'
                      ? 'bg-white text-[#34C759] shadow-sm'
                      : 'text-[#8A8A8E]'
                  }`}
                >
                  收入
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Step 1: Category Selection */}
              <AnimatePresence mode="wait">
                {step === 'category' && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4"
                  >
                    <div className="grid grid-cols-4 gap-3">
                      {categories.map((cat, i) => {
                        const Icon = iconMap[cat.icon] || MoreHorizontal;
                        return (
                          <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => handleCategorySelect(cat.id)}
                            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-[#F9FAFB] active:bg-[#F2F2F7] transition-colors"
                          >
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: `${cat.color}15` }}
                            >
                              <Icon size={24} style={{ color: cat.color }} strokeWidth={1.5} />
                            </div>
                            <span className="text-xs font-medium text-[#1A1A1A]">{cat.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Amount Input */}
                {step === 'amount' && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col"
                  >
                    {/* Amount Display */}
                    <div className="px-6 py-6 text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl text-[#8A8A8E] font-medium">¥</span>
                        <span className={`font-bold text-[#1A1A1A] ${amount.length > 7 ? 'text-4xl' : 'text-5xl'}`}>
                          {amount || '0'}
                        </span>
                      </div>
                    </div>

                    {/* Numpad */}
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-2">
                        {numpadKeys.flat().map((key) => {
                          if (key === 'del') {
                            return (
                              <button
                                key={key}
                                onClick={() => handleNumpad(key)}
                                className="h-14 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#1A1A1A] active:bg-[#E5E5EA] transition-colors text-sm font-medium"
                              >
                                删除
                              </button>
                            );
                          }
                          return (
                            <button
                              key={key}
                              onClick={() => handleNumpad(key)}
                              className="h-14 rounded-xl bg-white border border-[#F0F0F0] flex items-center justify-center text-2xl font-medium text-[#1A1A1A] active:bg-[#F2F2F7] active:scale-[0.97] transition-all"
                            >
                              {key}
                            </button>
                          );
                        })}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => setStep('detail')}
                          className="flex-1 h-14 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-sm font-medium text-[#1A1A1A] active:bg-[#E5E5EA] transition-colors"
                        >
                          添加备注
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={!canSubmit}
                          className="flex-1 h-14 rounded-xl font-semibold text-white active:scale-[0.97] transition-all disabled:opacity-40"
                          style={{ backgroundColor: selectedCat?.color || '#34C759' }}
                        >
                          完成
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Detail */}
                {step === 'detail' && (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 space-y-4"
                  >
                    {/* Date */}
                    <div>
                      <label className="text-sm font-medium text-[#8A8A8E] mb-2 block">日期</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-[#F9FAFB] text-[#1A1A1A] font-medium text-base outline-none focus:ring-2 focus:ring-[#34C759]/30 transition-shadow"
                      />
                    </div>

                    {/* Note */}
                    <div>
                      <label className="text-sm font-medium text-[#8A8A8E] mb-2 block">备注</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="添加备注信息..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] text-[#1A1A1A] font-medium text-base outline-none focus:ring-2 focus:ring-[#34C759]/30 transition-shadow resize-none placeholder:text-[#C7C7CC]"
                      />
                    </div>

                    <button
                      onClick={() => setStep('amount')}
                      className="w-full h-12 rounded-xl font-semibold text-white active:scale-[0.97] transition-all"
                      style={{ backgroundColor: selectedCat?.color || '#34C759' }}
                    >
                      确认
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
