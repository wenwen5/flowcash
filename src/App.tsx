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

/** Force a compositor repaint on every .tab-bar element */
function forceTabBarRepaint() {
  document.querySelectorAll('.tab-bar').forEach((el) => {
    (el as HTMLElement).style.transform = 'translateZ(0)';
  });
}

/** Apply safe-area insets to CSS variables */
function applyInsets(insets: { top: number; bottom: number; left: number; right: number }) {
  const r = document.documentElement;
  r.style.setProperty('--safe-area-top',    `${insets.top}px`);
  r.style.setProperty('--safe-area-bottom', `${insets.bottom}px`);
  r.style.setProperty('--safe-area-left',    `${insets.left}px`);
  r.style.setProperty('--safe-area-right',   `${insets.right}px`);
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
        // Plugin unavailable — browser / preview environment
      }
    }

    // 3. Re-read when returning from background (cold-start equivalent on iOS)
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
