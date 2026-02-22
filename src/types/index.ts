export type UserType = 'high_school' | 'college' | 'full_time'

export type Category =
  | 'food'
  | 'going_out'
  | 'entertainment'
  | 'housing_utilities'
  | 'academics'
  | 'auto_insurance'
  | 'stocks'
  | 'other'

export interface Transaction {
  id: string
  date: string // ISO date string
  amount: number
  category: Category
  description: string
  merchant: string
  isOneTime?: boolean
}

export interface User {
  id: string
  name: string
  email: string
  userType: UserType
  avatar?: string
  joinDate: string
  monthlyBudget: number
  categoryBudgets: Record<Category, number>
}

export interface CategorySummary {
  category: Category
  label: string
  color: string
  icon: string
  total: number
  budget: number
  transactions: Transaction[]
}

export interface DailySpending {
  date: string
  label: string
  total: number
  food: number
  going_out: number
  entertainment: number
  housing_utilities: number
  academics: number
  auto_insurance: number
  stocks: number
  other: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isVoice?: boolean
}

export interface SpendingAlert {
  id: string
  type: 'warning' | 'info' | 'danger'
  message: string
  category?: Category
  date: string
}

export interface Goal {
  id: string
  title: string
  description: string
  targetAmount?: number
  currentAmount?: number
  deadline?: string
  category?: string
  createdAt: string
  status: 'active' | 'completed'
}
