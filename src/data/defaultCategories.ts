import type { Category } from '@/types';

export const defaultCategories: Category[] = [
  { id: 'dining', name: '餐饮', icon: 'Coffee', color: '#FF9500', type: 'expense', description: '日常饮食、聚餐' },
  { id: 'shopping', name: '购物', icon: 'ShoppingBag', color: '#5856D6', type: 'expense', description: '衣物、日用品' },
  { id: 'transport', name: '出行', icon: 'Bus', color: '#007AFF', type: 'expense', description: '公交、打车、加油' },
  { id: 'entertainment', name: '娱乐', icon: 'Film', color: '#FF2D55', type: 'expense', description: '电影、游戏、演出' },
  { id: 'housing', name: '居住', icon: 'Home', color: '#34C759', type: 'expense', description: '房租、水电、物业' },
  { id: 'medical', name: '医疗', icon: 'HeartPulse', color: '#FF3B30', type: 'expense', description: '看病、药品' },
  { id: 'education', name: '学习', icon: 'BookOpen', color: '#5AC8FA', type: 'expense', description: '书籍、课程' },
  { id: 'other', name: '其他', icon: 'MoreHorizontal', color: '#8A8A8E', type: 'expense', description: '其他支出' },
];

export const incomeCategories: Category[] = [
  { id: 'salary', name: '工资', icon: 'Banknote', color: '#34C759', type: 'income', description: '月薪、奖金' },
  { id: 'investment', name: '理财', icon: 'TrendingUp', color: '#5856D6', type: 'income', description: '投资收益' },
  { id: 'gift', name: '礼金', icon: 'Gift', color: '#FF2D55', type: 'income', description: '红包、赠礼' },
  { id: 'other-income', name: '其他收入', icon: 'Plus', color: '#8A8A8E', type: 'income', description: '其他收入' },
];
