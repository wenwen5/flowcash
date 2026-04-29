import { Home, List, BarChart3, User, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { TabKey } from '@/types';

const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: '首页', icon: Home },
  { key: 'transactions', label: '流水', icon: List },
  { key: 'analytics', label: '报表', icon: BarChart3 },
  { key: 'profile', label: '我的', icon: User },
];

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const { dispatch } = useApp();

  const handleAdd = () => {
    try {
      if (navigator.vibrate) navigator.vibrate(10);
    } catch { /* ignore */ }
    dispatch({ type: 'OPEN_BOTTOM_SHEET' });
  };

  return (
    <div className="shrink-0 h-20 bg-white/90 backdrop-blur-xl border-t border-black/5 z-50 flex items-center justify-around pb-0 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.slice(0, 2).map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 transition-all duration-200"
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.5 : 1.5}
              className={isActive ? 'text-[#34C759]' : 'text-[#8A8A8E]'}
            />
            <span className={`text-[10px] ${isActive ? 'text-[#34C759] font-semibold' : 'text-[#8A8A8E]'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Center Add Button */}
      <button
        onClick={handleAdd}
        className="w-14 h-14 rounded-full bg-[#34C759] flex items-center justify-center shadow-lg shadow-[#34C759]/30 -mt-6 active:scale-95 transition-transform duration-150"
      >
        <Plus size={28} strokeWidth={2.5} className="text-white" />
      </button>

      {tabs.slice(2).map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 transition-all duration-200"
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.5 : 1.5}
              className={isActive ? 'text-[#34C759]' : 'text-[#8A8A8E]'}
            />
            <span className={`text-[10px] ${isActive ? 'text-[#34C759] font-semibold' : 'text-[#8A8A8E]'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
