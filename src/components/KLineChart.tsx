import { useRef, useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';

/* ───── Types ───── */
interface KPoint {
  label: string;
  start: string;
  end: string;
  open: number;
  close: number;
}

interface KLineChartProps {
  data: KPoint[];   // daily data only
}

interface ViewState {
  offset: number;   // data index offset
  count: number;    // how many data points visible
}

/* ───── Smooth-interp helper for Y-range ───── */
function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(1, t); }
let _prevMin = 0, _prevMax = 100;

function calcMA(values: number[], period: number) {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let s = 0;
    for (let j = 0; j < period; j++) s += values[i - j];
    return s / period;
  });
}

function formatY(v: number) {
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1) + 'w';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k';
  return v.toFixed(0);
}

/* ───── Internal aggregation: group N days into 1 bar ───── */
function aggregate(data: KPoint[], groupSize: number): KPoint[] {
  if (groupSize <= 1) return data;
  const out: KPoint[] = [];
  for (let i = 0; i < data.length; i += groupSize) {
    const slice = data.slice(i, i + groupSize);
    const open = slice[0].open;
    const close = slice[slice.length - 1].close;
    const startLabel = slice[0].label;
    const endLabel   = slice[slice.length - 1].label;
    const label = startLabel === endLabel ? startLabel : `${startLabel}-${endLabel}`;
    out.push({ label, start: slice[0].start, end: slice[slice.length - 1].end, open, close });
  }
  return out;
}

/* ───── Chart Renderer ───── */
function drawChart(
  ctx: CanvasRenderingContext2D,
  rawData: KPoint[],
  width: number,
  height: number,
  view: ViewState,
  opts?: {
    noSmooth?: boolean;
    minBarPx?: number;
    dpr?: number;
  },
) {
  const { noSmooth = false, minBarPx = 8, dpr = window.devicePixelRatio || 1 } = opts || {};
  const padding = { top: 12, right: 12, bottom: 32, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width * dpr, height * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  // Decide internal grouping based on canvas width
  const maxFitBars = Math.max(5, Math.floor(chartW / minBarPx));
  const groupSize = view.count > maxFitBars ? Math.ceil(view.count / maxFitBars) : 1;

  // Aggregate raw data
  const data = aggregate(rawData, groupSize);
  const total = data.length;
  const logicalCount = view.count / groupSize;
  const step = chartW / Math.max(1, logicalCount);

  // Visible range
  const logicalOffset = view.offset / groupSize;
  const startIdx = Math.max(0, Math.floor(logicalOffset));
  const endIdx = Math.min(total, Math.ceil(logicalOffset + logicalCount));

  if (total === 0 || startIdx >= endIdx) { ctx.restore(); return; }

  // Y range — adaptive to visible data + 10% margin + smooth transition
  const closes  = data.slice(startIdx, endIdx).map(d => d.close);
  const opens   = data.slice(startIdx, endIdx).map(d => d.open);
  const fullMA7  = calcMA(data.map(d => d.close), 7);
  const fullMA14 = calcMA(data.map(d => d.close), 14);
  const fullMA30 = calcMA(data.map(d => d.close), 30);
  const allY: number[] = [...opens, ...closes];
  [fullMA7, fullMA14, fullMA30].forEach(full => {
    full.slice(startIdx, endIdx).forEach(v => { if (v !== null) allY.push(v); });
  });

  const rawMin = allY.length > 0 ? Math.min(...allY) : 0;
  const rawMax = allY.length > 0 ? Math.max(...allY) : 100;
  const margin = (rawMax - rawMin) * 0.1 || Math.abs(rawMax) * 0.1;
  const targetMin = rawMin - margin;
  const targetMax = rawMax + margin;

  if (noSmooth) {
    _prevMin = targetMin;
    _prevMax = targetMax;
  } else {
    _prevMin = lerp(_prevMin, targetMin, 0.2);
    _prevMax = lerp(_prevMax, targetMax, 0.2);
  }
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

  // K bodies — color by profit/loss
  const barW = Math.max(2, Math.min(step * 0.55, chartW / maxFitBars * 0.55));
  for (let i = startIdx; i < endIdx; i++) {
    const d = data[i];
    const x = padding.left + (i - logicalOffset) * step + (step - barW) / 2;
    const top = yScale(Math.max(d.open, d.close));
    const bottom = yScale(Math.min(d.open, d.close));
    const h = Math.max(1.5, bottom - top);
    if (d.close > d.open)      ctx.fillStyle = '#34C759';
    else if (d.close < d.open) ctx.fillStyle = '#FF3B30';
    else                       ctx.fillStyle = '#8A8A8E';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.roundRect(x, top, barW, h, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // MAs
  const drawMA = (full: (number | null)[], color: string) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    const sliced = full.slice(startIdx, endIdx);
    for (let i = 0; i < sliced.length; i++) {
      const v = sliced[i];
      if (v === null) continue;
      const x = padding.left + (startIdx + i - logicalOffset) * step + step / 2;
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
    const x = padding.left + (i - logicalOffset) * step + step / 2;
    if (x < padding.left || x > padding.left + chartW) continue;
    ctx.fillText(data[i].label, x, padding.top + chartH + 4);
  }

  // Legend (only MAs)
  const legendItems = [
    { color: '#FF9500', label: 'MA7' },
    { color: '#5856D6', label: 'MA14' },
    { color: '#007AFF', label: 'MA30' },
  ];
  legendItems.forEach((l, i) => {
    const x = padding.left + chartW - 95 + i * 35;
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
export function KLineChart({ data }: KLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [exportStatus, setExportStatus] = useState('');

  const [view, setView] = useState<ViewState>(() => ({
    offset: Math.max(0, data.length - 30),
    count: Math.min(30, data.length),
  }));

  // Gesture state
  const gesture = useRef({
    active: false,
    mode: null as 'pan' | 'pinch' | null,
    panStartX: 0, panStartOffset: 0,
    pinchStartDist: 0, pinchStartCount: 0, pinchCenter: 0,
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
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawChart(ctx, data, w, h, view);
  }, [data, view]);

  useEffect(() => { redraw(); }, [redraw]);

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
      const dx = t[1].clientX - t[0].clientX;
      const dy = t[1].clientY - t[0].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / (g.pinchStartDist || 1);
      const newCount = Math.max(5, Math.min(data.length, Math.round(g.pinchStartCount / ratio)));
      const centerRatio = g.pinchCenter / (wrapperRef.current?.clientWidth || 320);
      const centerData = view.offset + view.count * centerRatio;
      const newOffset = centerData - newCount * centerRatio;
      setView({
        offset: Math.max(0, Math.min(data.length - newCount, newOffset)),
        count: newCount,
      });
      if (g.mode !== 'pinch') g.mode = 'pinch';
    }
  }, [data.length, view]);

  const handleTouchEnd = useCallback(() => {
    gesture.current.active = false;
    gesture.current.mode = null;
  }, []);

  // Export chart as PNG — renders full data on a temporary canvas
  const handleExport = useCallback(async () => {
    if (!data.length) return;

    // Pause main canvas animation to avoid state collision
    cancelAnimationFrame(rafRef.current);
    const savedMin = _prevMin;
    const savedMax = _prevMax;

    try {
      // High-DPR export: use device DPR (up to 3×) for crisp lines/text.
      // iOS Safari canvas width limit ~8192 physical px, so clamp logical width accordingly.
      const PAD = { left: 56, right: 12 };
      const targetHeight = 480;                  // taller for sharper text & curves
      const minBarPx = 3;                        // logical px per K-bar
      const actualDpr = Math.min(3, window.devicePixelRatio || 1);
      const MAX_PHYS_W = 8192;                   // conservative iOS canvas width limit

      let targetWidth = data.length * minBarPx + PAD.left + PAD.right;
      if (targetWidth * actualDpr > MAX_PHYS_W) {
        targetWidth = Math.floor(MAX_PHYS_W / actualDpr);
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth * actualDpr;
      tempCanvas.height = targetHeight * actualDpr;

      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      const fullView: ViewState = { offset: 0, count: data.length };
      drawChart(ctx, data, targetWidth, targetHeight, fullView, {
        noSmooth: true,
        minBarPx,
        dpr: actualDpr,
      });

      // Export PNG
      const dataUrl = tempCanvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      const byteString = atob(base64);
      const buffer = new ArrayBuffer(byteString.length);
      const viewArr = new Uint8Array(buffer);
      for (let i = 0; i < byteString.length; i++) viewArr[i] = byteString.charCodeAt(i);
      const blob = new Blob([buffer], { type: 'image/png' });

      const fileName = `flowcash_chart_${new Date().toISOString().slice(0, 10)}.png`;

      // Try Capacitor first
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        const b64data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });

        await Filesystem.writeFile({
          path: fileName,
          data: b64data,
          directory: Directory.Cache,
        });

        const fileUri = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'FlowCash 图表',
          text: `净资产趋势图 (${data.length}天)`,
          url: fileUri.uri,
          dialogTitle: '保存图表',
        });

        setExportStatus('导出成功');
      } catch {
        // Browser fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportStatus('已下载');
      }
    } catch {
      setExportStatus('导出失败');
    } finally {
      // Restore Y-range state and resume main canvas
      _prevMin = savedMin;
      _prevMax = savedMax;
      rafRef.current = requestAnimationFrame(redraw);
    }
    setTimeout(() => setExportStatus(''), 2000);
  }, [data, redraw]);

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-xl overflow-hidden"
      style={{ backgroundColor: '#fff', height: 220, touchAction: 'none' }}
    >
      <button
        onClick={handleExport}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
      >
        <Download size={14} style={{ color: '#8A8A8E' }} />
      </button>

      {exportStatus && (
        <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-[10px] text-white" style={{ backgroundColor: '#1A1A1A' }}>
          {exportStatus}
        </div>
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
  );
}
