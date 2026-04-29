import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AppState, AppAction, Transaction, Category } from '@/types';
import { defaultCategories, incomeCategories } from '@/data/defaultCategories';

const STORAGE_KEY = 'flowcash_data_v1';

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const initialState: AppState = {
  transactions: [],
  categories: [...defaultCategories, ...incomeCategories],
  currentMonth: getCurrentMonth(),
  selectedDate: getCurrentDate(),
  bottomSheetOpen: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_MONTH':
      return { ...state, currentMonth: action.payload };
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };
    case 'OPEN_BOTTOM_SHEET':
      return { ...state, bottomSheetOpen: true };
    case 'CLOSE_BOTTOM_SHEET':
      return { ...state, bottomSheetOpen: false };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload ? { ...c, deleted: true } : c
        ),
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  getMonthlyTotal: (month: string, type?: 'expense' | 'income') => number;
  getCategoryTotal: (month: string, categoryId: string) => number;
  getMonthlyByCategory: (month: string) => { category: string; amount: number; color: string; name: string }[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch {
      console.warn('Failed to load stored data');
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        transactions: state.transactions,
        categories: state.categories,
      }));
    } catch {
      console.warn('Failed to persist data');
    }
  }, [state.transactions, state.categories]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTx });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
    dispatch({ type: 'ADD_CATEGORY', payload: newCat });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  }, []);

  const getMonthlyTotal = useCallback((month: string, type?: 'expense' | 'income'): number => {
    return state.transactions
      .filter(t => t.date.startsWith(month) && (type ? t.type === type : true))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const getCategoryTotal = useCallback((month: string, categoryId: string): number => {
    return state.transactions
      .filter(t => t.date.startsWith(month) && t.category === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const getMonthlyByCategory = useCallback((month: string) => {
    const categoryMap = new Map<string, { amount: number; color: string; name: string }>();
    
    state.categories.forEach(c => {
      categoryMap.set(c.id, { amount: 0, color: c.color, name: c.name });
    });

    state.transactions
      .filter(t => t.date.startsWith(month) && t.type === 'expense')
      .forEach(t => {
        const existing = categoryMap.get(t.category);
        if (existing) {
          existing.amount += t.amount;
        }
      });

    return Array.from(categoryMap.entries())
      .filter(([, v]) => v.amount > 0)
      .map(([category, v]) => ({
        category,
        amount: v.amount,
        color: v.color,
        name: v.name,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.transactions, state.categories]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      addTransaction,
      deleteTransaction,
      addCategory,
      deleteCategory,
      getMonthlyTotal,
      getCategoryTotal,
      getMonthlyByCategory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
