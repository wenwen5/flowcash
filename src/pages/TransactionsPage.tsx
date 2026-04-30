import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal, Trash2, Banknote, TrendingUp, Gift, Plus,
  Filter, Check, X
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
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Get all non-deleted categories for filter
  const allCategories = useMemo(() => {
    return state.categories.filter(c => !c.deleted);
  }, [state.categories]);

  // Toggle category selection
  const toggleCategory = (catId: string) => {
    const next = new Set(selectedCategories);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setSelectedCategories(next);
  };

  const selectAll = () => {
    const allIds = new Set(allCategories.map(c => c.id));
    setSelectedCategories(allIds);
  };

  const clearAll = () => {
    setSelectedCategories(new Set());
  };

  const isFiltering = selectedCategories.size > 0;

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let txs = [...state.transactions];
    if (filter !== 'all') {
      txs = txs.filter(t => t.type === filter);
    }
    if (isFiltering) {
      txs = txs.filter(t => selectedCategories.has(t.category));
    }
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, filter, selectedCategories, isFiltering]);

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
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yestStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) return '今天';
    if (dateStr === yestStr) return '昨天';
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

  const getDayTotal = (date: string, type: 'expense' | 'income') => {
    return state.transactions
      .filter(t => t.date === date && t.type === type)
      .reduce((s, t) => s + t.amount, 0);
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div className="shrink-0 safe-area-top px-4 pt-3 pb-0" style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold" style={{ color: '#1A1A1A' }}>流水</h1>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isFiltering ? 'var(--brand-light)' : '#F2F2F7',
            }}
          >
            <Filter size={18} style={{ color: isFiltering ? 'var(--brand)' : '#8A8A8E' }} />
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 pb-3">
          {[
            { key: 'all' as FilterType, label: '全部' },
            { key: 'expense' as FilterType, label: '支出' },
            { key: 'income' as FilterType, label: '收入' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={filter === f.key
                ? { backgroundColor: 'var(--brand)', color: '#fff' }
                : { backgroundColor: '#F2F2F7', color: '#8A8A8E' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
            style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0' }}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: '#8A8A8E' }}>按类别筛选</span>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs px-2 py-1 rounded-md" style={{ color: 'var(--brand)', backgroundColor: 'var(--brand-light)' }}>全选</button>
                  <button onClick={clearAll} className="text-xs px-2 py-1 rounded-md" style={{ color: '#8A8A8E', backgroundColor: '#F2F2F7' }}>清空</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => {
                  const Icon = iconMap[cat.icon] || MoreHorizontal;
                  const isSelected = selectedCategories.has(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={isSelected
                        ? { backgroundColor: cat.color + '20', color: cat.color, border: `1px solid ${cat.color}40` }
                        : { backgroundColor: '#F2F2F7', color: '#8A8A8E' }}
                    >
                      <Icon size={12} strokeWidth={2} />
                      {cat.name}
                      {isSelected && <Check size={12} strokeWidth={2} />}
                    </button>
                  );
                })}
              </div>
              {isFiltering && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--brand)' }}>
                    已选 {selectedCategories.size} 个类别
                  </span>
                  <button onClick={clearAll} className="flex items-center gap-0.5 text-xs" style={{ color: '#FF3B30' }}>
                    <X size={12} /> 清除筛选
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#F2F2F7' }}>
              <MoreHorizontal size={32} style={{ color: '#C7C7CC' }} />
            </div>
            <p className="font-medium" style={{ color: '#8A8A8E' }}>暂无记录</p>
            <p className="text-sm mt-1" style={{ color: '#C7C7CC' }}>开始记账后，这里会显示你的收支流水</p>
          </div>
        ) : (
          <div className="py-2 space-y-2">
            {grouped.map(([date, txs]) => {
              const dayExpense = getDayTotal(date, 'expense');
              const dayIncome = getDayTotal(date, 'income');
              return (
                <div key={date} className="mx-4">
                  <div className="flex items-center justify-between py-2 px-1">
                    <span className="text-xs font-semibold" style={{ color: '#8A8A8E' }}>{formatDate(date)}</span>
                    <div className="flex gap-3">
                      {dayIncome > 0 && (
                        <span className="text-xs" style={{ color: '#34C759' }}>+¥{formatAmount(dayIncome)}</span>
                      )}
                      {dayExpense > 0 && (
                        <span className="text-xs" style={{ color: '#FF3B30' }}>-¥{formatAmount(dayExpense)}</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
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
                            className="flex items-center gap-3 px-4 py-3 transition-colors"
                            style={{ borderBottom: '1px solid #F0F0F0', backgroundColor: isConfirming ? 'rgba(255,59,48,0.05)' : 'transparent' }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: isDeleted ? '#F2F2F7' : (cat ? `${cat.color}15` : '#F2F2F7') }}
                            >
                              <Icon size={20} style={{ color: isDeleted ? '#C7C7CC' : (cat?.color || '#8A8A8E') }} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium" style={{ color: isDeleted ? '#8A8A8E' : '#1A1A1A' }}>
                                {isDeleted ? '已删除类别' : (cat?.name || '未知')}
                              </span>
                              {tx.note && (
                                <p className="text-xs truncate" style={{ color: '#C7C7CC' }}>{tx.note}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: tx.type === 'expense' ? '#FF3B30' : '#34C759' }}>
                                {tx.type === 'expense' ? '-' : '+'}¥{formatAmount(tx.amount)}
                              </span>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                                style={{
                                  backgroundColor: isConfirming ? '#FF3B30' : 'transparent',
                                  color: isConfirming ? '#fff' : '#C7C7CC',
                                }}
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
