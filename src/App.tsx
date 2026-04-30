import { useState, useEffect } from 'react';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { BottomTabBar } from '@/components/BottomTabBar';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { HomePage } from '@/pages/HomePage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import type { TabKey } from '@/types';

const PAGES: { key: TabKey; component: React.FC }[] = [
  { key: 'home', component: HomePage },
  { key: 'transactions', component: TransactionsPage },
  { key: 'analytics', component: AnalyticsPage },
  { key: 'profile', component: ProfilePage },
];

/**
 * Check whether the CSS variable already has a non-zero pixel value
 * (injected by the iOS Swift layer at startup).
 */
function getCssVarValue(name: string): number {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!val) return 0;
  const px = parseFloat(val.replace('px', ''));
  return isNaN(px) ? 0 : px;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  useEffect(() => {
    let cancelled = false;

    async function initSafeArea() {
      // Wait a tick so any Swift-injected values are already present.
      await new Promise(r => setTimeout(r, 100));
      if (cancelled) return;

      const bottom = getCssVarValue('--safe-area-bottom');

      // If Swift already injected a real value (> 0 on notched iPhones),
      // we do nothing — Swift is the source of truth.
      if (bottom > 0) {
        return;
      }

      // Otherwise fall back to the JS plugin (browser / preview environments).
      try {
        const { SafeArea } = await import('capacitor-plugin-safe-area');
        const { insets } = await SafeArea.getSafeAreaInsets();
        if (cancelled) return;

        const b = Math.round(insets.bottom);
        if (b > 0) {
          document.documentElement.style.setProperty('--safe-area-bottom', `${b}px`);
          document.documentElement.style.setProperty('--safe-area-top', `${Math.round(insets.top)}px`);
        }

        // Listen for orientation changes
        await SafeArea.addListener('safeAreaChanged', (data) => {
          if (cancelled) return;
          const ins = data.insets;
          document.documentElement.style.setProperty('--safe-area-bottom', `${Math.round(ins.bottom)}px`);
          document.documentElement.style.setProperty('--safe-area-top', `${Math.round(ins.top)}px`);
        });
      } catch {
        // Plugin unavailable — CSS env() fallback already active in :root
      }
    }

    initSafeArea();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="app-root">
      {/* Main Content Area — all pages常驻DOM，CSS切换opacity/visibility，无闪黑 */}
      <main className="app-main">
        {PAGES.map(({ key, component: Page }) => (
          <div key={key} className={`page-layer ${activeTab === key ? 'active' : ''}`}>
            <Page />
          </div>
        ))}
      </main>

      {/* Bottom Tab Bar — fixed at bottom */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Transaction Sheet — global overlay outside scroll context */}
      <AddTransactionSheet />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
