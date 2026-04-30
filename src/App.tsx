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

/** Hard-coded fallback for notched iPhones */
const FALLBACK_TOP = 47;
const FALLBACK_BOTTOM = 34;

/** Force a compositor repaint on every .tab-bar element */
function forceTabBarRepaint() {
  document.querySelectorAll('.tab-bar').forEach((el) => {
    (el as HTMLElement).style.transform = 'translateZ(0)';
  });
}

/** Apply insets to CSS variables. If the plugin reports 0 on cold start,
 *  use the hard-coded fallback so the first paint is never broken. */
function applyInsets(insets: { top: number; bottom: number; left: number; right: number }) {
  const top    = insets.top    > 0 ? insets.top    : FALLBACK_TOP;
  const bottom = insets.bottom > 0 ? insets.bottom : FALLBACK_BOTTOM;
  const left   = insets.left   > 0 ? insets.left   : 0;
  const right  = insets.right  > 0 ? insets.right  : 0;

  const r = document.documentElement;
  r.style.setProperty('--safe-area-top',    `${top}px`);
  r.style.setProperty('--safe-area-bottom', `${bottom}px`);
  r.style.setProperty('--safe-area-left',   `${left}px`);
  r.style.setProperty('--safe-area-right',  `${right}px`);

  // Force repaint so WebKit recalculates layout with the new values
  forceTabBarRepaint();
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | null = null;

    async function initSafeArea() {
      try {
        const { SafeArea } = await import('capacitor-plugin-safe-area');

        // 1. Read once immediately (DOMContentLoaded has already fired by now)
        const { insets } = await SafeArea.getSafeAreaInsets();
        if (!cancelled) {
          applyInsets(insets);
        }

        // 2. Listen for orientation / safe-area changes
        const listener = await SafeArea.addListener('safeAreaChanged', (data) => {
          if (!cancelled) {
            applyInsets(data.insets);
          }
        });
        removeListener = () => listener.remove();
      } catch {
        // Plugin unavailable — apply fallback defaults
        if (!cancelled) {
          applyInsets({ top: 0, bottom: 0, left: 0, right: 0 });
        }
      }
    }

    // 3. Re-read when returning from background
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        initSafeArea();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Kick off initial read
    initSafeArea();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (removeListener) removeListener();
    };
  }, []);

  return (
    <div className="app-root">
      <main className="app-main">
        {PAGES.map(({ key, component: Page }) => (
          <div key={key} className={`page-layer ${activeTab === key ? 'active' : ''}`}>
            <Page />
          </div>
        ))}
      </main>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
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
