import { Home, List, BarChart3, User, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
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
  const brand = useTheme();

  const handleAdd = () => {
    try {
      if (navigator.vibrate) navigator.vibrate(10);
    } catch { /* ignore */ }
    dispatch({ type: 'OPEN_BOTTOM_SHEET' });
  };

  return (
    <div className="tab-bar flex items-center justify-around select-none h-20">
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
              style={{ color: isActive ? brand : '#8A8A8E' }}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? brand : '#8A8A8E', fontWeight: isActive ? 600 : 400 }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Center Add Button */}
      <button
        onClick={handleAdd}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg -mt-6 active:scale-95 transition-transform duration-150"
        style={{ backgroundColor: brand, boxShadow: `0 4px 16px ${brand}4D` }}
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
              style={{ color: isActive ? brand : '#8A8A8E' }}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? brand : '#8A8A8E', fontWeight: isActive ? 600 : 400 }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
