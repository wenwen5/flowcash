import { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, X, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/* ───── Types ───── */
interface KPoint {
  label: string;
  start: string;
  end: string;
  open: number;
  close: number;
  income: number;
  expense: number;
}

interface KLineChartProps {
  data: KPoint[];
  onGranularityChange?: (g: 'day' | 'week' | 'month') => void;
}

interface ViewState {
  offset: number;    // data index offset (float, for sub-pixel panning)
  count: number;     // how many data points visible
  granularity: 'day' | 'week' | 'month';
}

/* ───── Data Helpers ───── */
function formatY(v: number) {
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1) + 'w';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k';
  return v.toFixed(0);
}

function calcMA(values: number[], period: number) {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let s = 0;
    for (let j = 0; j < period; j++) s += values[i - j];
    return s / period;
  });
}

/* Smooth-interpolation helper for Y-range transitions */
function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(1, t); }

let _prevMin = 0;
let _prevMax = 100;

/* ───── Chart Renderer ───── */
function drawChart(
  ctx: CanvasRenderingContext2D,
  data: KPoint[],
  width: number,
  height: number,
  view: ViewState,
  brandColor: string,
) {
  const dpr = window.devicePixelRatio || 1;
  const padding = { top: 12, right: 12, bottom: 32, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width * dpr, height * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  // Determine visible range
  const total = data.length;
  const step = chartW / view.count;
  const startIdx = Math.max(0, Math.floor(view.offset));
  const endIdx = Math.min(total, Math.ceil(view.offset + view.count));

  // Y range — adaptive to visible data + 10% margin + smooth transition
  const visOpens  = data.slice(startIdx, endIdx).map(d => d.open);
  const visCloses = data.slice(startIdx, endIdx).map(d => d.close);
  const fullMA7  = calcMA(data.map(d => d.close), 7);
  const fullMA14 = calcMA(data.map(d => d.close), 14);
  const fullMA30 = calcMA(data.map(d => d.close), 30);
  const allY: number[] = [...visOpens, ...visCloses];
  [fullMA7, fullMA14, fullMA30].forEach(full => {
    full.slice(startIdx, endIdx).forEach(v => { if (v !== null) allY.push(v); });
  });

  const rawMin = allY.length > 0 ? Math.min(...allY) : 0;
  const rawMax = allY.length > 0 ? Math.max(...allY) : 100;
  const margin = (rawMax - rawMin) * 0.1 || Math.abs(rawMax) * 0.1;
  const targetMin = rawMin - margin;
  const targetMax = rawMax + margin;

  // Smooth transition from previous range (20% per frame)
  _prevMin = lerp(_prevMin, targetMin, 0.2);
  _prevMax = lerp(_prevMax, targetMax, 0.2);
  const minV = _prevMin;
  const maxV = _prevMax;
  const range = maxV - minV || 1;
  const yScale = (v: number) => padding.top + (1 - (v - minV) / range) * chartH;

  // Grid + Y labels
  ctx.strokeStyle = '#F2F2F7';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH * i) / 4;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + chartW, y); ctx.stroke();
    ctx.fillStyle = '#C7C7CC';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(formatY(maxV - (range * i) / 4), padding.left - 6, y);
  }

  // K bodies — color by profit/loss (close vs open)
  const barW = Math.max(2, step * 0.55);
  for (let i = startIdx; i < endIdx; i++) {
    const d = data[i];
    const x = padding.left + (i - view.offset) * step + (step - barW) / 2;
    const top = yScale(Math.max(d.open, d.close));
    const bottom = yScale(Math.min(d.open, d.close));
    const h = Math.max(1.5, bottom - top);
    // Color: green=profit, red=loss, brand=flat
    if (d.close > d.open)      ctx.fillStyle = '#34C759';
    else if (d.close < d.open) ctx.fillStyle = '#FF3B30';
    else                       ctx.fillStyle = brandColor;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.roundRect(x, top, barW, h, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // MAs (already computed above for Y-range — reuse)
  const drawMA = (full: (number | null)[], color: string) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    const sliced = full.slice(startIdx, endIdx);
    for (let i = 0; i < sliced.length; i++) {
      const v = sliced[i];
      if (v === null) continue;
      const x = padding.left + (startIdx + i - view.offset) * step + step / 2;
      const y = yScale(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawMA(fullMA7,  '#FF9500');
  drawMA(fullMA14, '#5856D6');
  drawMA(fullMA30, '#007AFF');

  // X labels
  const labelStep = Math.max(1, Math.ceil((endIdx - startIdx) / 7));
  ctx.fillStyle = '#C7C7CC';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = startIdx; i < endIdx; i += labelStep) {
    const x = padding.left + (i - view.offset) * step + step / 2;
    if (x < padding.left || x > padding.left + chartW) continue;
    ctx.fillText(data[i].label, x, padding.top + chartH + 4);
  }

  // Legend (only MAs, no profit/loss colors)
  const legendX = padding.left + chartW;
  const legends = [
    { color: '#FF9500', label: 'MA7' },
    { color: '#5856D6', label: 'MA14' },
    { color: '#007AFF', label: 'MA30' },
  ];
  legends.forEach((l, i) => {
    const x = legendX - 90 + i * 35;
    ctx.fillStyle = l.color;
    ctx.fillRect(x, 4, 10, 3);
    ctx.fillStyle = '#8A8A8E';
    ctx.font = '9px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(l.label, x + 13, 8);
  });

  ctx.restore();
}

/* ───── KLineChart Component ───── */
export function KLineChart({ data, onGranularityChange }: KLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const brand = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // View state
  const [view, setView] = useState<ViewState>(() => ({
    offset: Math.max(0, data.length - 30),
    count: Math.min(30, data.length),
    granularity: 'day',
  }));

  // Gesture state (mutable ref for performance)
  const gesture = useRef({
    active: false,
    mode: null as 'pan' | 'pinch' | null,
    panStartX: 0, panStartOffset: 0,
    pinchStartDist: 0, pinchStartCount: 0, pinchCenter: 0,
    lastTouches: [] as { clientX: number; clientY: number }[],
  });

  const rafRef = useRef<number>(0);

  // Redraw
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawChart(ctx, data, w, h, view, brand);
  }, [data, view, brand]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const onResize = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(redraw); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafRef.current); };
  }, [redraw]);

  // Gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches;
    const g = gesture.current;
    g.lastTouches = Array.from(t).map(touch => ({ clientX: touch.clientX, clientY: touch.clientY }));
    g.active = true;

    if (t.length === 1) {
      g.mode = 'pan';
      g.panStartX = t[0].clientX;
      g.panStartOffset = view.offset;
    } else if (t.length >= 2) {
      g.mode = 'pinch';
      const dx = t[1].clientX - t[0].clientX;
      const dy = t[1].clientY - t[0].clientY;
      g.pinchStartDist = Math.hypot(dx, dy);
      g.pinchStartCount = view.count;
      g.pinchCenter = (t[0].clientX + t[1].clientX) / 2;
    }
  }, [view]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const g = gesture.current;
    if (!g.active) return;
    const t = e.touches;

    if (g.mode === 'pan' && t.length === 1) {
      const dx = t[0].clientX - g.panStartX;
      const step = (wrapperRef.current?.clientWidth || 320) / view.count;
      const newOffset = g.panStartOffset - dx / step;
      setView(prev => ({
        ...prev,
        offset: Math.max(0, Math.min(data.length - prev.count, newOffset)),
      }));
    } else if (t.length >= 2) {
      // Pinch
      const dx = t[1].clientX - t[0].clientX;
      const dy = t[1].clientY - t[0].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / (g.pinchStartDist || 1);
      const newCount = Math.max(5, Math.min(data.length, Math.round(g.pinchStartCount / ratio)));
      const centerRatio = g.pinchCenter / (wrapperRef.current?.clientWidth || 320);
      const centerData = view.offset + view.count * centerRatio;
      const newOffset = centerData - newCount * centerRatio;

      setView(prev => {
        const clampedOffset = Math.max(0, Math.min(data.length - newCount, newOffset));
        // Auto granularity
        let g2 = prev.granularity;
        if (newCount <= 15 && g2 !== 'day') g2 = 'day';
        else if (newCount > 15 && newCount <= 40 && g2 !== 'week') g2 = 'week';
        else if (newCount > 40 && g2 !== 'month') g2 = 'month';
        return { offset: clampedOffset, count: newCount, granularity: g2 };
      });

      if (g.mode !== 'pinch') g.mode = 'pinch';
    }
    g.lastTouches = Array.from(t).map(touch => ({ clientX: touch.clientX, clientY: touch.clientY }));
  }, [data.length, view]);

  const handleTouchEnd = useCallback(() => {
    const g = gesture.current;
    g.active = false;
    g.mode = null;
  }, []);

  // Granularity change callback
  useEffect(() => {
    onGranularityChange?.(view.granularity);
  }, [view.granularity, onGranularityChange]);

  // Fullscreen
  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    // Try to lock landscape
    try {
      const scr = screen as any;
      if (scr.orientation && scr.orientation.lock) {
        scr.orientation.lock('landscape').catch(() => {});
      }
    } catch { /* ignore */ }
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    try {
      const scr = screen as any;
      if (scr.orientation && scr.orientation.unlock) {
        scr.orientation.unlock();
      }
    } catch { /* ignore */ }
  }, []);

  // Fullscreen resize
  useEffect(() => {
    if (isFullscreen) {
      const timer = setTimeout(() => { redraw(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, redraw]);

  return (
    <>
      <div
        ref={wrapperRef}
        className="relative rounded-xl overflow-hidden"
        style={{ backgroundColor: '#fff', height: isFullscreen ? '100%' : 220, touchAction: 'none' }}
      >
        {!isFullscreen && (
          <button
            onClick={enterFullscreen}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
          >
            <Maximize2 size={14} style={{ color: '#8A8A8E' }} />
          </button>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3">
            <button onClick={exitFullscreen} className="flex items-center gap-1">
              <ChevronLeft size={22} style={{ color: '#fff' }} />
              <span className="text-sm font-medium" style={{ color: '#fff' }}>返回</span>
            </button>
            <span className="text-sm font-semibold" style={{ color: '#fff' }}>净资产趋势</span>
            <button onClick={exitFullscreen} className="w-8 h-8 flex items-center justify-center">
              <X size={20} style={{ color: '#fff' }} />
            </button>
          </div>
          {/* Chart */}
          <div
            ref={wrapperRef}
            className="flex-1 relative"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ touchAction: 'none' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            />
          </div>
        </div>
      )}
    </>
  );
}
