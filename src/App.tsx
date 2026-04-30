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

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  useEffect(() => {
    let cancelled = false;

    async function initSafeArea() {
      try {
        const { SafeArea } = await import('capacitor-plugin-safe-area');
        const { insets } = await SafeArea.getSafeAreaInsets();
        if (cancelled) return;

        // Write to our custom CSS variables (used by the app's CSS)
        document.documentElement.style.setProperty('--safe-area-bottom', `${insets.bottom}px`);
        document.documentElement.style.setProperty('--safe-area-top', `${insets.top}px`);
        document.documentElement.style.setProperty('--safe-area-left', `${insets.left}px`);
        document.documentElement.style.setProperty('--safe-area-right', `${insets.right}px`);

        // Also write to plugin's native variable names for consistency
        document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
        document.documentElement.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
        document.documentElement.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
        document.documentElement.style.setProperty('--safe-area-inset-right', `${insets.right}px`);

        // Listen for changes (rotation, etc.)
        await SafeArea.addListener('safeAreaChanged', (data) => {
          const ins = data.insets;
          document.documentElement.style.setProperty('--safe-area-bottom', `${ins.bottom}px`);
          document.documentElement.style.setProperty('--safe-area-top', `${ins.top}px`);
          document.documentElement.style.setProperty('--safe-area-left', `${ins.left}px`);
          document.documentElement.style.setProperty('--safe-area-right', `${ins.right}px`);
          document.documentElement.style.setProperty('--safe-area-inset-bottom', `${ins.bottom}px`);
          document.documentElement.style.setProperty('--safe-area-inset-top', `${ins.top}px`);
          document.documentElement.style.setProperty('--safe-area-inset-left', `${ins.left}px`);
          document.documentElement.style.setProperty('--safe-area-inset-right', `${ins.right}px`);
        });
      } catch {
        // Plugin not available (browser) — fallback to CSS env()
        if (cancelled) return;
        document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
        document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
        document.documentElement.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
        document.documentElement.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
      }
    }

    initSafeArea();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="app-root">
      {/* Main Content Area - all pages常驻DOM，CSS切换opacity/visibility，无闪黑 */}
      <main className="app-main">
        {PAGES.map(({ key, component: Page }) => (
          <div key={key} className={`page-layer ${activeTab === key ? 'active' : ''}`}>
            <Page />
          </div>
        ))}
      </main>

      {/* Bottom Tab Bar - fixed at bottom */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Transaction Sheet - global overlay outside scroll context */}
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
