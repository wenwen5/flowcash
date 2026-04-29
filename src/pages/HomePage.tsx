import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal,
  TrendingDown, TrendingUp
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const iconMap: Record<string, typeof Coffee> = {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse, BookOpen, MoreHorizontal,
};

export function HomePage() {
  const { state, getMonthlyTotal, getMonthlyByCategory } = useApp();
  const [currentMonth] = useState(state.currentMonth);

  const monthExpense = getMonthlyTotal(currentMonth, 'expense');
  const monthIncome = getMonthlyTotal(currentMonth, 'income');
  const categoryData = getMonthlyByCategory(currentMonth);

  // Generate recent transactions for this month
  const recentTransactions = useMemo(() => {
    return state.transactions
      .filter(t => t.date.startsWith(currentMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [state.transactions, currentMonth]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] overflow-hidden">
      {/* Safe area spacer only */}
      <div className="shrink-0 safe-area-top" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Summary Cards */}
        <div className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center">
                  <TrendingDown size={16} className="text-[#FF3B30]" />
                </div>
                <span className="text-xs text-[#8A8A8E] font-medium">支出</span>
              </div>
              <p className="text-xl font-bold text-[#1A1A1A]">¥{formatAmount(monthExpense)}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#34C759]" />
                </div>
                <span className="text-xs text-[#8A8A8E] font-medium">收入</span>
              </div>
              <p className="text-xl font-bold text-[#1A1A1A]">¥{formatAmount(monthIncome)}</p>
            </motion.div>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-4 py-2"
          >
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">支出类别</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {categoryData.map((item, i) => {
                const cat = state.categories.find(c => c.id === item.category);
                const Icon = cat ? (iconMap[cat.icon] || MoreHorizontal) : MoreHorizontal;
                const maxAmount = categoryData[0].amount;
                const pct = (item.amount / maxAmount) * 100;

                return (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-b-0"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Icon size={20} style={{ color: item.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#1A1A1A]">{item.name}</span>
                        <span className="text-sm font-semibold text-[#1A1A1A]">¥{formatAmount(item.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent Transactions */}
        <div className="px-4 py-2 pb-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">最近记账</h3>
          {recentTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-sm p-8 text-center"
            >
              <p className="text-[#C7C7CC] text-sm">本月暂无记账记录</p>
              <p className="text-[#C7C7CC] text-xs mt-1">点击下方 + 按钮开始记账</p>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {recentTransactions.map((tx, i) => {
                const cat = state.categories.find(c => c.id === tx.category);
                const isDeleted = !cat || cat.deleted;
                const Icon = cat ? (iconMap[cat.icon] || MoreHorizontal) : MoreHorizontal;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-b-0"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isDeleted ? '#F2F2F7' : (cat ? `${cat.color}15` : '#F2F2F7') }}
                    >
                      <Icon size={20} style={{ color: isDeleted ? '#C7C7CC' : (cat?.color || '#8A8A8E') }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isDeleted ? 'text-[#8A8A8E]' : 'text-[#1A1A1A]'}`}>
                          {isDeleted ? '已删除类别' : (cat?.name || '未知')}
                        </span>
                        <span className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                          {tx.type === 'expense' ? '-' : '+'}¥{formatAmount(tx.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-[#C7C7CC]">{tx.note || '无备注'}</span>
                        <span className="text-xs text-[#C7C7CC]">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
