import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse,
  BookOpen, MoreHorizontal, ChevronLeft, ChevronRight,
  TrendingDown, TrendingUp, PieChart, BarChart3
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const iconMap: Record<string, typeof Coffee> = {
  Coffee, ShoppingBag, Bus, Film, Home, HeartPulse, BookOpen, MoreHorizontal,
};

type ReportType = 'category' | 'trend';
type TrendView = 'day' | 'week' | 'month';

interface TrendData {
  label: string;
  dateKey: string;
  income: number;
  expense: number;
}

export function AnalyticsPage() {
  const { state, getMonthlyTotal, getMonthlyByCategory } = useApp();
  const [currentMonth, setCurrentMonth] = useState(state.currentMonth);
  const [reportType, setReportType] = useState<ReportType>('category');
  const [trendView, setTrendView] = useState<TrendView>('day');

  // ===== SVG Gesture State =====
  const svgRef = useRef<SVGSVGElement>(null);
  const gestureRef = useRef<{
    active: boolean;
    mode: 'pan' | 'pinch' | null;
    startX: number;
    startDist: number;
    startScale: number;
    startTx: number;
    lastX: number;
    pointers: Map<number, { x: number; y: number }>;
  }>({
    active: false, mode: null, startX: 0, startDist: 0,
    startScale: 1, startTx: 0, lastX: 0, pointers: new Map(),
  });
  const [transform, setTransform] = useState({ scale: 1, tx: 0 });

  const monthExpense = getMonthlyTotal(currentMonth, 'expense');
  const monthIncome = getMonthlyTotal(currentMonth, 'income');
  const categoryData = getMonthlyByCategory(currentMonth);

  const navigateMonth = (dir: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + (dir === 'next' ? 1 : -1), 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-');
    const now = new Date();
    const thisYear = now.getFullYear().toString();
    return `${thisYear === year ? '' : year + '年'}${parseInt(month)}月`;
  }, [currentMonth]);

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ========== Donut Chart Fix ==========
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

  // ========== Trend Data ==========
  const trendData: TrendData[] = useMemo(() => {
    if (state.transactions.length === 0) return [];
    const now = new Date();
    const txs = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));

    if (trendView === 'day') {
      const days: TrendData[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayTxs = txs.filter(t => t.date === dateKey);
        days.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          dateKey,
          income: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return days;
    }

    if (trendView === 'week') {
      const weeks: TrendData[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        const weekTxs = txs.filter(t => {
          const td = new Date(t.date);
          return td >= weekStart && td <= weekEnd;
        });
        weeks.push({
          label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          dateKey: `${weekStart.toISOString().slice(0, 10)}_${weekEnd.toISOString().slice(0, 10)}`,
          income: weekTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: weekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return weeks;
    }

    const months: TrendData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxs = txs.filter(t => t.date.startsWith(monthKey));
      months.push({
        label: `${d.getMonth() + 1}月`,
        dateKey: monthKey,
        income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [state.transactions, trendView]);

  // K-line chart metrics
  const chartHeight = 220;
  const chartPadding = { top: 10, right: 10, bottom: 30, left: 50 };
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const baseBarWidth = trendData.length > 0 ? Math.min(20, Math.max(4, 300 / trendData.length)) : 0;
  const barGap = trendData.length > 0 ? (300 - baseBarWidth * trendData.length) / (trendData.length + 1) : 0;

  const maxValue = useMemo(() => {
    if (trendData.length === 0) return 100;
    const max = Math.max(...trendData.map(d => Math.max(d.income, d.expense)));
    return max > 0 ? max * 1.15 : 100;
  }, [trendData]);

  const yScale = (val: number) => plotHeight - (val / maxValue) * plotHeight + chartPadding.top;

  // ===== Gesture handlers =====
  const getDist = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const g = gestureRef.current;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size === 1) {
      g.mode = 'pan';
      g.startX = e.clientX;
      g.startTx = transform.tx;
    } else if (g.pointers.size === 2) {
      g.mode = 'pinch';
      const pts = Array.from(g.pointers.values());
      g.startDist = getDist(pts[0], pts[1]);
      g.startScale = transform.scale;
    }
    g.active = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [transform, getDist]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const g = gestureRef.current;
    if (!g.active) return;
    if (!g.pointers.has(e.pointerId)) return;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.mode === 'pan' && g.pointers.size === 1) {
      const dx = e.clientX - g.startX;
      setTransform(prev => ({ ...prev, tx: g.startTx + dx }));
    } else if (g.mode === 'pinch' && g.pointers.size === 2) {
      const pts = Array.from(g.pointers.values());
      const dist = getDist(pts[0], pts[1]);
      const ratio = dist / (g.startDist || 1);
      const newScale = Math.min(4, Math.max(0.5, g.startScale * ratio));
      setTransform(prev => ({ ...prev, scale: newScale }));
    }
  }, [getDist]);

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const g = gestureRef.current;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size === 0) {
      g.active = false;
      g.mode = null;
    } else if (g.pointers.size === 1) {
      g.mode = 'pan';
      const remaining = Array.from(g.pointers.values())[0];
      g.startX = remaining.x;
      g.startTx = transform.tx;
    }
  }, [transform]);

  const resetTransform = () => setTransform({ scale: 1, tx: 0 });

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] overflow-hidden">
      {/* Safe area spacer only */}
      <div className="shrink-0 safe-area-top bg-white border-b border-[#F0F0F0]" />

      {/* Report Type Toggle */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex gap-1 bg-[#F2F2F7] rounded-xl p-1">
          <button
            onClick={() => { setReportType('category'); resetTransform(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              reportType === 'category' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8A8A8E]'
            }`}
          >
            <PieChart size={16} />
            类别构成
          </button>
          <button
            onClick={() => { setReportType('trend'); resetTransform(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              reportType === 'trend' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8A8A8E]'
            }`}
          >
            <BarChart3 size={16} />
            收支趋势
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {reportType === 'category' ? (
            <motion.div
              key="category"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Month Navigation */}
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-2">
                  <button onClick={() => navigateMonth('prev')} className="w-10 h-10 flex items-center justify-center">
                    <ChevronLeft size={22} className="text-[#8A8A8E]" />
                  </button>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">{monthLabel}</h2>
                  <button onClick={() => navigateMonth('next')} className="w-10 h-10 flex items-center justify-center">
                    <ChevronRight size={22} className="text-[#8A8A8E]" />
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="px-4 pt-2 pb-2">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown size={14} className="text-[#FF3B30]" />
                        <span className="text-xs text-[#8A8A8E]">总支出</span>
                      </div>
                      <p className="text-2xl font-bold text-[#FF3B30]">¥{formatAmount(monthExpense)}</p>
                    </div>
                    <div className="text-center border-l border-[#F0F0F0]">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp size={14} className="text-[#34C759]" />
                        <span className="text-xs text-[#8A8A8E]">总收入</span>
                      </div>
                      <p className="text-2xl font-bold text-[#34C759]">¥{formatAmount(monthIncome)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donut Chart */}
              {categoryData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="px-4 py-2"
                >
                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">支出构成</h3>
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
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                          />
                        ))}
                        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="text-xs fill-[#8A8A8E]" transform="rotate(90 100 100)">支出</text>
                        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="text-sm fill-[#1A1A1A]" transform="rotate(90 100 100)">¥{formatAmount(monthExpense)}</text>
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Category Breakdown Table */}
              <div className="px-4 py-2 pb-6">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">类别明细</h3>
                {categoryData.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                    <PieChart size={32} className="text-[#C7C7CC] mx-auto mb-2" />
                    <p className="text-[#C7C7CC] text-sm">本月暂无支出记录</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
                          className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F0] last:border-b-0"
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                            <Icon size={18} style={{ color: item.color }} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-medium text-[#1A1A1A]">{item.name}</span>
                              <span className="text-sm font-semibold text-[#1A1A1A]">¥{formatAmount(item.amount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                                <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }}
                                  initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }} />
                              </div>
                              <span className="text-xs text-[#8A8A8E] w-10 text-right">{percent}%</span>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Trend View Toggle */}
              <div className="px-4 pt-2 pb-2">
                <div className="flex gap-2">
                  {([
                    { key: 'day' as TrendView, label: '日' },
                    { key: 'week' as TrendView, label: '周' },
                    { key: 'month' as TrendView, label: '月' },
                  ]).map(v => (
                    <button
                      key={v.key}
                      onClick={() => { setTrendView(v.key); resetTransform(); }}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        trendView === v.key ? 'bg-[#34C759] text-white' : 'bg-[#F2F2F7] text-[#8A8A8E]'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gesture hint */}
              <div className="px-4 py-1">
                <p className="text-[10px] text-[#C7C7CC] text-center">
                  双指捏合缩放，单指左右滑动平移
                </p>
              </div>

              {/* K-Line Chart with Gesture */}
              <div className="px-4 py-2">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                    {trendView === 'day' && '近30天收支'}
                    {trendView === 'week' && '近12周收支'}
                    {trendView === 'month' && '近12个月收支'}
                  </h3>

                  {trendData.length === 0 || trendData.every(d => d.income === 0 && d.expense === 0) ? (
                    <div className="py-12 text-center">
                      <BarChart3 size={32} className="text-[#C7C7CC] mx-auto mb-2" />
                      <p className="text-[#C7C7CC] text-sm">暂无数据</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <svg
                        ref={svgRef}
                        width="100%"
                        height={chartHeight}
                        viewBox={`0 0 350 ${chartHeight}`}
                        className="touch-none select-none"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onPointerLeave={onPointerUp}
                      >
                        <g transform={`translate(${transform.tx}, 0) scale(${transform.scale}, 1)`}>
                          {/* Y Axis Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                            const y = chartPadding.top + plotHeight * (1 - pct);
                            const val = maxValue * pct;
                            return (
                              <g key={pct}>
                                <line x1={chartPadding.left} y1={y} x2={chartPadding.left + 300} y2={y} stroke="#F2F2F7" strokeWidth={1} />
                                <text x={chartPadding.left - 6} y={y + 3} textAnchor="end" className="text-[10px] fill-[#C7C7CC]">
                                  {val >= 10000 ? `${(val / 10000).toFixed(1)}w` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                                </text>
                              </g>
                            );
                          })}

                          {/* K-line Bodies */}
                          {trendData.map((d, i) => {
                            const x = chartPadding.left + barGap + i * (baseBarWidth + barGap);
                            if (d.income === 0 && d.expense === 0) return null;
                            const top = Math.max(d.income, d.expense);
                            const bottom = Math.min(d.income, d.expense);
                            const isRed = d.expense > d.income;
                            const yTop = yScale(top);
                            const yBottom = yScale(bottom);
                            const bodyHeight = Math.max(2, yBottom - yTop);
                            return (
                              <g key={d.dateKey}>
                                <rect x={x} y={yTop} width={baseBarWidth} height={bodyHeight} rx={2} fill={isRed ? '#FF3B30' : '#34C759'} opacity={0.85} />
                                {bottom === 0 && (
                                  <line x1={x - 2} y1={yScale(0)} x2={x + baseBarWidth + 2} y2={yScale(0)} stroke={isRed ? '#FF3B30' : '#34C759'} strokeWidth={1.5} opacity={0.5} />
                                )}
                              </g>
                            );
                          })}

                          {/* X Axis Labels */}
                          {trendData.map((d, i) => {
                            const x = chartPadding.left + barGap + i * (baseBarWidth + barGap) + baseBarWidth / 2;
                            const showLabel = trendData.length <= 12 || i % Math.ceil(trendData.length / 8) === 0 || i === trendData.length - 1;
                            if (!showLabel) return null;
                            return (
                              <text key={`label-${d.dateKey}`} x={x} y={chartHeight - 6} textAnchor="middle" className="text-[10px] fill-[#C7C7CC]">{d.label}</text>
                            );
                          })}
                        </g>
                      </svg>
                    </div>
                  )}

                  {/* Legend + Reset */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0F0F0]">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#34C759]" />
                        <span className="text-xs text-[#8A8A8E]">收入 {'>'} 支出</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#FF3B30]" />
                        <span className="text-xs text-[#8A8A8E]">支出 {'>'} 收入</span>
                      </div>
                    </div>
                    {(transform.scale !== 1 || transform.tx !== 0) && (
                      <button onClick={resetTransform} className="text-xs text-[#007AFF] font-medium">重置</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Trend Summary */}
              <div className="px-4 py-2 pb-6">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">区间统计</h3>
                  {(() => {
                    const totalIncome = trendData.reduce((s, d) => s + d.income, 0);
                    const totalExpense = trendData.reduce((s, d) => s + d.expense, 0);
                    const net = totalIncome - totalExpense;
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-[#8A8A8E] mb-1">总收入</p>
                          <p className="text-base font-bold text-[#34C759]">¥{formatAmount(totalIncome)}</p>
                        </div>
                        <div className="text-center border-l border-[#F0F0F0]">
                          <p className="text-xs text-[#8A8A8E] mb-1">总支出</p>
                          <p className="text-base font-bold text-[#FF3B30]">¥{formatAmount(totalExpense)}</p>
                        </div>
                        <div className="text-center border-l border-[#F0F0F0]">
                          <p className="text-xs text-[#8A8A8E] mb-1">净收支</p>
                          <p className={`text-base font-bold ${net >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                            {net >= 0 ? '+' : '-'}¥{formatAmount(Math.abs(net))}
                          </p>
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
