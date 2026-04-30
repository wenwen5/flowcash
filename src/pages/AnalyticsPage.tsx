import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal, ChevronLeft, ChevronRight,
  TrendingDown, TrendingUp, PieChart, BarChart3
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { KLineChart } from '@/components/KLineChart';

const iconMap: Record<string, typeof Coffee> = {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse, BookOpen, MoreHorizontal,
};

/* ─────────────── Types ─────────────── */
type ReportType = 'category' | 'trend';
type Granularity = 'day' | 'week' | 'month';

interface KPoint {
  label: string;
  start: string;
  end: string;
  open: number;
  close: number;
  income: number;
  expense: number;
}

/* ─────────────── Helpers ─────────────── */
function parseDate(d: string) { return new Date(d + 'T00:00:00'); }
function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - day);
  return r;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function sameWeek(a: Date, b: Date) {
  const wa = startOfWeek(a);
  const wb = startOfWeek(b);
  return wa.getTime() === wb.getTime();
}
function shortLabel(d: Date, g: Granularity) {
  if (g === 'month') return `${d.getMonth() + 1}月`;
  if (g === 'week') return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/* ─────────────── Data preparation ─────────────── */
function buildDailyNetWorth(txs: { date: string; type: 'expense' | 'income'; amount: number }[]) {
  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of sorted) {
    const ex = map.get(t.date) || { income: 0, expense: 0 };
    if (t.type === 'income') ex.income += t.amount;
    else ex.expense += t.amount;
    map.set(t.date, ex);
  }
  const dates = Array.from(map.keys()).sort();
  const daily: { date: string; net: number; income: number; expense: number }[] = [];
  let cumIncome = 0, cumExpense = 0;
  for (const d of dates) {
    const v = map.get(d)!;
    cumIncome += v.income;
    cumExpense += v.expense;
    daily.push({ date: d, net: cumIncome - cumExpense, income: v.income, expense: v.expense });
  }
  return daily;
}

function aggregate(daily: ReturnType<typeof buildDailyNetWorth>, g: Granularity): KPoint[] {
  if (daily.length === 0) return [];
  if (g === 'day') {
    return daily.map((d, i) => ({
      label: shortLabel(parseDate(d.date), 'day'),
      start: d.date,
      end: d.date,
      open: i === 0 ? 0 : daily[i - 1].net,
      close: d.net,
      income: d.income,
      expense: d.expense,
    }));
  }
  if (g === 'week') {
    const groups: KPoint[] = [];
    let curr: KPoint | null = null;
    for (let i = 0; i < daily.length; i++) {
      const d = daily[i];
      const dd = parseDate(d.date);
      if (!curr || !sameWeek(parseDate(curr.start), dd)) {
        if (curr) groups.push(curr);
        curr = {
          label: shortLabel(startOfWeek(dd), 'week'),
          start: d.date,
          end: d.date,
          open: i === 0 ? 0 : daily[i - 1].net,
          close: d.net,
          income: d.income,
          expense: d.expense,
        };
      } else {
        curr.end = d.date;
        curr.close = d.net;
        curr.income += d.income;
        curr.expense += d.expense;
      }
    }
    if (curr) groups.push(curr);
    return groups;
  }
  // month
  const groups: KPoint[] = [];
  let curr: KPoint | null = null;
  for (let i = 0; i < daily.length; i++) {
    const d = daily[i];
    const dd = parseDate(d.date);
    if (!curr || !sameMonth(parseDate(curr.start), dd)) {
      if (curr) groups.push(curr);
      curr = {
        label: shortLabel(startOfMonth(dd), 'month'),
        start: d.date,
        end: d.date,
        open: i === 0 ? 0 : daily[i - 1].net,
        close: d.net,
        income: d.income,
        expense: d.expense,
      };
    } else {
      curr.end = d.date;
      curr.close = d.net;
      curr.income += d.income;
      curr.expense += d.expense;
    }
  }
  if (curr) groups.push(curr);
  return groups;
}

export function AnalyticsPage() {
  const { state, getMonthlyTotal, getMonthlyByCategory } = useApp();
  const [currentMonth, setCurrentMonth] = useState(state.currentMonth);
  const [reportType, setReportType] = useState<ReportType>('category');
  const [granularity, setGranularity] = useState<Granularity>('day');

  const monthExpense = getMonthlyTotal(currentMonth, 'expense');
  const monthIncome = getMonthlyTotal(currentMonth, 'income');
  const categoryData = getMonthlyByCategory(currentMonth);

  const navigateMonth = (dir: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + (dir === 'next' ? 1 : -1), 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-');
    const now = new Date();
    return `${now.getFullYear().toString() === year ? '' : year + '年'}${parseInt(month)}月`;
  }, [currentMonth]);

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Donut
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;
  const chartSegments = categoryData.map(item => {
    const percent = monthExpense > 0 ? item.amount / monthExpense : 0;
    const arcLength = percent * circumference;
    const offset = -cumulativePercent * circumference;
    cumulativePercent += percent;
    return { ...item, percent, arcLength, offset };
  });

  // K-Line data
  const klineData = useMemo(() => {
    const daily = buildDailyNetWorth(state.transactions);
    return aggregate(daily, granularity);
  }, [state.transactions, granularity]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Safe area */}
      <div className="shrink-0 safe-area-top" style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0' }} />

      {/* Report Type Toggle */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: '#F2F2F7' }}>
          <button
            onClick={() => { setReportType('category'); }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            style={reportType === 'category'
              ? { backgroundColor: '#fff', color: '#1A1A1A', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: '#8A8A8E' }}
          >
            <PieChart size={16} /> 类别构成
          </button>
          <button
            onClick={() => { setReportType('trend'); }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            style={reportType === 'trend'
              ? { backgroundColor: '#fff', color: '#1A1A1A', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: '#8A8A8E' }}
          >
            <BarChart3 size={16} /> 收支趋势
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {reportType === 'category' ? (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Month nav */}
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center justify-between rounded-2xl shadow-sm px-4 py-2" style={{ backgroundColor: '#fff' }}>
                  <button onClick={() => navigateMonth('prev')} className="w-10 h-10 flex items-center justify-center">
                    <ChevronLeft size={22} style={{ color: '#8A8A8E' }} />
                  </button>
                  <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>{monthLabel}</h2>
                  <button onClick={() => navigateMonth('next')} className="w-10 h-10 flex items-center justify-center">
                    <ChevronRight size={22} style={{ color: '#8A8A8E' }} />
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="px-4 pt-2 pb-2">
                <div className="rounded-2xl shadow-sm p-4" style={{ backgroundColor: '#fff' }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown size={14} style={{ color: '#FF3B30' }} />
                        <span className="text-xs" style={{ color: '#8A8A8E' }}>总支出</span>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: '#FF3B30' }}>¥{formatAmount(monthExpense)}</p>
                    </div>
                    <div className="text-center" style={{ borderLeft: '1px solid #F0F0F0' }}>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp size={14} style={{ color: '#34C759' }} />
                        <span className="text-xs" style={{ color: '#8A8A8E' }}>总收入</span>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: '#34C759' }}>¥{formatAmount(monthIncome)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donut */}
              {categoryData.length > 0 && (
                <div className="px-4 py-2">
                  <div className="rounded-2xl shadow-sm p-4" style={{ backgroundColor: '#fff' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>支出构成</h3>
                    <div className="flex items-center justify-center">
                      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F2F2F7" strokeWidth={strokeWidth} />
                        {chartSegments.map((seg, i) => (
                          <motion.circle
                            key={seg.category}
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none" stroke={seg.color} strokeWidth={strokeWidth}
                            strokeLinecap="butt"
                            strokeDasharray={`${seg.arcLength} ${circumference}`}
                            initial={{ strokeDashoffset: -circumference }}
                            animate={{ strokeDashoffset: seg.offset }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                          />
                        ))}
                        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="text-xs" style={{ fill: '#8A8A8E' }} transform="rotate(90 100 100)">支出</text>
                        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="text-sm" style={{ fill: '#1A1A1A' }} transform="rotate(90 100 100)">¥{formatAmount(monthExpense)}</text>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Breakdown table */}
              <div className="px-4 py-2 pb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A1A1A' }}>类别明细</h3>
                {categoryData.length === 0 ? (
                  <div className="rounded-2xl shadow-sm p-8 text-center" style={{ backgroundColor: '#fff' }}>
                    <PieChart size={32} style={{ color: '#C7C7CC' }} className="mx-auto mb-2" />
                    <p className="text-sm" style={{ color: '#C7C7CC' }}>本月暂无支出记录</p>
                  </div>
                ) : (
                  <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
                    {categoryData.map((item, i) => {
                      const cat = state.categories.find(c => c.id === item.category);
                      const Icon = cat ? (iconMap[cat.icon] || MoreHorizontal) : MoreHorizontal;
                      const percent = monthExpense > 0 ? ((item.amount / monthExpense) * 100).toFixed(1) : '0';
                      return (
                        <motion.div
                          key={item.category}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          className="flex items-center gap-3 px-4 py-3"
                          style={{ borderBottom: '1px solid #F0F0F0' }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                            <Icon size={18} style={{ color: item.color }} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{item.name}</span>
                              <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>¥{formatAmount(item.amount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F2F2F7' }}>
                                <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }}
                                  initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }} />
                              </div>
                              <span className="text-xs w-10 text-right" style={{ color: '#8A8A8E' }}>{percent}%</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="trend"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Granularity indicator */}
              <div className="px-4 pt-2 pb-1 flex items-center justify-between">
                <div className="flex gap-2">
                  {(['day', 'week', 'month'] as Granularity[]).map(g => (
                    <button
                      key={g}
                      onClick={() => { setGranularity(g); }}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={granularity === g
                        ? { backgroundColor: 'var(--brand)', color: '#fff' }
                        : { backgroundColor: '#F2F2F7', color: '#8A8A8E' }}
                    >
                      {g === 'day' && '日'}
                      {g === 'week' && '周'}
                      {g === 'month' && '月'}
                    </button>
                  ))}
                </div>
                <span className="text-[10px]" style={{ color: '#C7C7CC' }}>单指滑动平移 · 双指捏合缩放</span>
              </div>

              {/* K-Line Chart */}
              <div className="px-4 py-2">
                <div className="rounded-2xl shadow-sm p-3" style={{ backgroundColor: '#fff' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                    净资产趋势 {granularity === 'day' ? '(日)' : granularity === 'week' ? '(周)' : '(月)'}
                  </h3>
                  {klineData.length === 0 ? (
                    <div className="py-12 text-center">
                      <BarChart3 size={32} style={{ color: '#C7C7CC' }} className="mx-auto mb-2" />
                      <p className="text-sm" style={{ color: '#C7C7CC' }}>暂无数据，开始记账后查看趋势</p>
                    </div>
                  ) : (
                    <KLineChart
                      data={klineData}
                      onGranularityChange={setGranularity}
                    />
                  )}
                  {/* Legend */}
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid #F0F0F0' }}>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#FF9500' }} /> MA7</span>
                      <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#5856D6' }} /> MA14</span>
                      <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#007AFF' }} /> MA30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net worth summary */}
              <div className="px-4 py-2 pb-6">
                <div className="rounded-2xl shadow-sm p-4" style={{ backgroundColor: '#fff' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A1A1A' }}>资产概况</h3>
                  {(() => {
                    const daily = buildDailyNetWorth(state.transactions);
                    const last = daily[daily.length - 1];
                    const net = last ? last.net : 0;
                    const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                    const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-xs mb-1" style={{ color: '#8A8A8E' }}>当前净资产</p>
                          <p className="text-base font-bold" style={{ color: net >= 0 ? '#34C759' : '#FF3B30' }}>
                            {net >= 0 ? '+' : ''}¥{formatAmount(Math.abs(net))}
                          </p>
                        </div>
                        <div className="text-center" style={{ borderLeft: '1px solid #F0F0F0' }}>
                          <p className="text-xs mb-1" style={{ color: '#8A8A8E' }}>累计收入</p>
                          <p className="text-base font-bold" style={{ color: '#34C759' }}>¥{formatAmount(totalIncome)}</p>
                        </div>
                        <div className="text-center" style={{ borderLeft: '1px solid #F0F0F0' }}>
                          <p className="text-xs mb-1" style={{ color: '#8A8A8E' }}>累计支出</p>
                          <p className="text-base font-bold" style={{ color: '#FF3B30' }}>¥{formatAmount(totalExpense)}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
