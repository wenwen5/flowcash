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

  // Safe-area refinement via Capacitor plugin (runs after React mount).
  // The HTML <script> already set defaults and forced a recalculation,
  // so this only fine-tunes the exact native values.
  useEffect(() => {
    let cancelled = false;

    async function refineSafeArea() {
      try {
        const { SafeArea } = await import('capacitor-plugin-safe-area');
        const { insets } = await SafeArea.getSafeAreaInsets();
        if (cancelled) return;

        const r = document.documentElement;
        r.style.setProperty('--safe-area-bottom', `${Math.round(insets.bottom)}px`);
        r.style.setProperty('--safe-area-top',    `${Math.round(insets.top)}px`);
        r.style.setProperty('--safe-area-left',   `${Math.round(insets.left)}px`);
        r.style.setProperty('--safe-area-right',  `${Math.round(insets.right)}px`);

        await SafeArea.addListener('safeAreaChanged', (data) => {
          if (cancelled) return;
          const ins = data.insets;
          r.style.setProperty('--safe-area-bottom', `${Math.round(ins.bottom)}px`);
          r.style.setProperty('--safe-area-top',    `${Math.round(ins.top)}px`);
        });
      } catch {
        // Plugin unavailable — HTML script + Swift injection are enough.
      }
    }

    refineSafeArea();
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
