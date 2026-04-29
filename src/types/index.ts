export interface Transaction {
  id: string;
  amount: number;
  category: string;
  subCategory?: string;
  date: string;
  note?: string;
  type: 'expense' | 'income';
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  description?: string;
  deleted?: boolean;
}

export type TabKey = 'home' | 'transactions' | 'analytics' | 'profile';

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  selectedDate: string;
  bottomSheetOpen: boolean;
}

export type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_MONTH'; payload: string }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'OPEN_BOTTOM_SHEET' }
  | { type: 'CLOSE_BOTTOM_SHEET' }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'UPDATE_CATEGORY'; payload: Category };
