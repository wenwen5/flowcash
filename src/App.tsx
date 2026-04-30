import { useState } from 'react';
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
