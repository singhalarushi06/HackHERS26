import { User, Transaction, Category } from '../types'
import { subDays, format, subMonths } from 'date-fns'

export const TEST_USER: User = {
  id: 'user_college_01',
  name: 'Sophia Chen',
  email: 'sophia@university.edu',
  userType: 'college',
  joinDate: '2025-09-01',
  monthlyBudget: 2200,
  categoryBudgets: {
    food: 400,
    going_out: 200,
    entertainment: 150,
    housing_utilities: 800,
    academics: 300,
    auto_insurance: 120,
    stocks: 150,
    other: 80,
  },
}

const makeId = () => Math.random().toString(36).slice(2, 10)

function makeTransaction(
  daysAgo: number,
  amount: number,
  category: Category,
  description: string,
  merchant: string,
  isOneTime?: boolean
): Transaction {
  return {
    id: makeId(),
    date: format(subDays(new Date(), daysAgo), 'yyyy-MM-dd'),
    amount,
    category,
    description,
    merchant,
    isOneTime,
  }
}

export const TRANSACTIONS: Transaction[] = [
  // Today
  makeTransaction(0, 14.5, 'food', 'Iced Matcha Latte', 'Blue Bottle Coffee'),
  makeTransaction(0, 9.99, 'entertainment', 'Spotify Premium', 'Spotify'),
  // Yesterday
  makeTransaction(1, 62.4, 'food', 'Grocery run', "Trader Joe's"),
  makeTransaction(1, 28.0, 'going_out', 'Dinner with friends', 'Chipotle'),
  // 2 days ago
  makeTransaction(2, 800.0, 'housing_utilities', 'Monthly rent', 'Campus Apartments', true),
  makeTransaction(2, 18.5, 'food', 'Subway sandwich', 'Subway'),
  // 3 days ago
  makeTransaction(3, 49.99, 'entertainment', 'Online course subscription', 'Coursera'),
  makeTransaction(3, 35.0, 'going_out', 'Movie night', 'AMC Theaters'),
  makeTransaction(3, 12.99, 'food', 'Lunch bowl', 'Sweetgreen'),
  // 4 days ago
  makeTransaction(4, 120.0, 'auto_insurance', 'Car Insurance', 'Geico', true),
  makeTransaction(4, 22.0, 'food', 'Dinner takeout', 'Uber Eats'),
  // 5 days ago
  makeTransaction(5, 250.0, 'academics', 'Textbook bundle', 'Amazon'),
  makeTransaction(5, 30.0, 'going_out', 'Brunch', 'Snooze AM Eatery'),
  // 6 days ago
  makeTransaction(6, 45.0, 'going_out', 'Bar with roommates', 'The Basement'),
  makeTransaction(6, 11.0, 'food', 'Coffee & bagel', 'Starbucks'),
  // 7 days ago
  makeTransaction(7, 100.0, 'stocks', 'S&P 500 ETF', 'Robinhood'),
  makeTransaction(7, 17.5, 'food', 'Late-night pizza', 'Dominos'),
  // 8-14 days ago
  makeTransaction(8, 38.5, 'food', 'Whole Foods haul', 'Whole Foods'),
  makeTransaction(8, 14.99, 'entertainment', 'Netflix', 'Netflix'),
  makeTransaction(9, 55.0, 'going_out', 'Concert tickets', 'Ticketmaster'),
  makeTransaction(10, 25.5, 'food', 'Sushi lunch', 'Sushi Ramen'),
  makeTransaction(10, 89.0, 'academics', 'Lab supplies', 'University Store'),
  makeTransaction(11, 12.0, 'food', 'Smoothie', 'Jamba Juice'),
  makeTransaction(11, 40.0, 'going_out', 'Escape room', 'Escapology'),
  makeTransaction(12, 650.0, 'housing_utilities', 'Utilities split', 'PG&E', true),
  makeTransaction(12, 20.0, 'food', 'Boba tea & snacks', 'Gong Cha'),
  makeTransaction(13, 150.0, 'stocks', 'NVDA stock purchase', 'Robinhood'),
  makeTransaction(14, 65.0, 'food', 'Weekly groceries', "Trader Joe's"),
  makeTransaction(14, 18.0, 'entertainment', 'Gaming app', 'App Store'),
  // 15-21 days ago
  makeTransaction(15, 29.99, 'entertainment', 'Disney+ monthly', 'Disney+'),
  makeTransaction(15, 35.0, 'food', 'Meal prep groceries', 'Costco'),
  makeTransaction(16, 110.0, 'academics', 'Campus bookstore', 'Campus Bookstore'),
  makeTransaction(17, 42.0, 'going_out', 'Karaoke night', 'KTV Lounge'),
  makeTransaction(17, 16.0, 'food', 'Thai takeout', 'Thai Spice'),
  makeTransaction(18, 100.0, 'stocks', 'AAPL purchase', 'Robinhood'),
  makeTransaction(19, 22.5, 'food', 'Burger and shake', "Five Guys"),
  makeTransaction(19, 50.0, 'auto_insurance', 'AAA membership', 'AAA'),
  makeTransaction(20, 440.0, 'academics', 'Tuition installment', 'University', true),
  makeTransaction(21, 60.0, 'going_out', 'Weekend road trip snacks', 'Target'),
  // 22-30 days ago (last month)
  makeTransaction(22, 800.0, 'housing_utilities', 'Monthly rent', 'Campus Apartments', true),
  makeTransaction(23, 55.0, 'food', 'Grocery run', "Trader Joe's"),
  makeTransaction(24, 45.0, 'going_out', 'Dinner date', 'Olive Garden'),
  makeTransaction(25, 9.99, 'entertainment', 'Spotify', 'Spotify'),
  makeTransaction(26, 14.99, 'entertainment', 'Netflix', 'Netflix'),
  makeTransaction(27, 30.0, 'food', 'Late-night snacks', 'CVS'),
  makeTransaction(28, 200.0, 'stocks', 'Index fund', 'Fidelity'),
  makeTransaction(29, 120.0, 'auto_insurance', 'Car Insurance', 'Geico', true),
  makeTransaction(30, 75.0, 'food', 'End of month groceries', 'Safeway'),
]

export function getCategoryLabel(cat: Category): string {
  const map: Record<Category, string> = {
    food: 'Food & Dining',
    going_out: 'Going Out',
    entertainment: 'Entertainment',
    housing_utilities: 'Housing & Utilities',
    academics: 'Academics',
    auto_insurance: 'Auto & Insurance',
    stocks: 'Investments',
    other: 'Other',
  }
  return map[cat]
}

export function getCategoryColor(cat: Category): string {
  const map: Record<Category, string> = {
    food: '#10b981',
    going_out: '#f59e0b',
    entertainment: '#8b5cf6',
    housing_utilities: '#3b82f6',
    academics: '#ec4899',
    auto_insurance: '#14b8a6',
    stocks: '#6366f4',
    other: '#94a3b8',
  }
  return map[cat]
}

export function getCategoryIcon(cat: Category): string {
  const map: Record<Category, string> = {
    food: '🍔',
    going_out: '🎉',
    entertainment: '🎬',
    housing_utilities: '🏠',
    academics: '🎓',
    auto_insurance: '🚗',
    stocks: '📈',
    other: '💰',
  }
  return map[cat]
}

export const ALL_CATEGORIES: Category[] = [
  'food',
  'going_out',
  'entertainment',
  'housing_utilities',
  'academics',
  'auto_insurance',
  'stocks',
  'other',
]

export const COLLEGE_CATEGORIES: Category[] = ALL_CATEGORIES
export const NON_COLLEGE_CATEGORIES: Category[] = ALL_CATEGORIES.filter(
  (c) => c !== 'academics'
)

export function getVisibleCategories(userType: string): Category[] {
  return userType === 'college' ? COLLEGE_CATEGORIES : NON_COLLEGE_CATEGORIES
}
