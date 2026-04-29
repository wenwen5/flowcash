import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal, Trash2, Banknote, TrendingUp, Gift, Plus
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Transaction } from '@/types';

const iconMap: Record<string, typeof Coffee> = {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse, BookOpen, MoreHorizontal,
  Banknote, TrendingUp, Gift, Plus,
};

type FilterType = 'all' | 'expense' | 'income';

export function TransactionsPage() {
  const { state, deleteTransaction } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    let txs = [...state.transactions];
    if (filter !== 'all') {
      txs = txs.filter(t => t.type === filter);
    }
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach(tx => {
      const date = tx.date;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(tx);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`) {
      return '今天';
    }
    if (dateStr === `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`) {
      return '昨天';
    }
    return `${d.getMonth() + 1}月${d.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]}`;
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteTransaction(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 2000);
    }
  };

  // Calculate daily totals
  const getDayTotal = (date: string, type: 'expense' | 'income') => {
    return state.transactions
      .filter(t => t.date === date && t.type === type)
      .reduce((s, t) => s + t.amount, 0);
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-[#F0F0F0] px-4 pt-3 pb-0 safe-area-top">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-3">流水</h1>
        <div className="flex gap-1 pb-3">
          {[
            { key: 'all' as FilterType, label: '全部' },
            { key: 'expense' as FilterType, label: '支出' },
            { key: 'income' as FilterType, label: '收入' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-[#34C759] text-white'
                  : 'bg-[#F2F2F7] text-[#8A8A8E]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-full bg-[#F2F2F7] flex items-center justify-center mb-4">
              <MoreHorizontal size={32} className="text-[#C7C7CC]" />
            </div>
            <p className="text-[#8A8A8E] font-medium">暂无记录</p>
            <p className="text-[#C7C7CC] text-sm mt-1">开始记账后，这里会显示你的收支流水</p>
          </div>
        ) : (
          <div className="py-2 space-y-2">
            {grouped.map(([date, txs]) => {
              const dayExpense = getDayTotal(date, 'expense');
              const dayIncome = getDayTotal(date, 'income');

              return (
                <div key={date} className="mx-4">
                  {/* Date Header */}
                  <div className="flex items-center justify-between py-2 px-1">
                    <span className="text-xs font-semibold text-[#8A8A8E]">{formatDate(date)}</span>
                    <div className="flex gap-3">
                      {dayIncome > 0 && (
                        <span className="text-xs text-[#34C759]">+¥{formatAmount(dayIncome)}</span>
                      )}
                      {dayExpense > 0 && (
                        <span className="text-xs text-[#FF3B30]">-¥{formatAmount(dayExpense)}</span>
                      )}
                    </div>
                  </div>

                  {/* Transaction Cards */}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <AnimatePresence>
                      {txs.map((tx, i) => {
                        const cat = state.categories.find(c => c.id === tx.category);
                        const isDeleted = !cat || cat.deleted;
                        const Icon = cat ? (iconMap[cat.icon] || MoreHorizontal) : MoreHorizontal;
                        const isConfirming = confirmDelete === tx.id;

                        return (
                          <motion.div
                            key={tx.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: i * 0.03 }}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-b-0 transition-colors ${
                              isConfirming ? 'bg-[#FF3B30]/5' : ''
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: isDeleted ? '#F2F2F7' : (cat ? `${cat.color}15` : '#F2F2F7') }}
                            >
                              <Icon size={20} style={{ color: isDeleted ? '#C7C7CC' : (cat?.color || '#8A8A8E') }} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium ${isDeleted ? 'text-[#8A8A8E]' : 'text-[#1A1A1A]'}`}>
                                {isDeleted ? '已删除类别' : (cat?.name || '未知')}
                              </span>
                              {tx.note && (
                                <p className="text-xs text-[#C7C7CC] truncate">{tx.note}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                                {tx.type === 'expense' ? '-' : '+'}¥{formatAmount(tx.amount)}
                              </span>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                  isConfirming ? 'bg-[#FF3B30] text-white' : 'bg-transparent text-[#C7C7CC]'
                                }`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
