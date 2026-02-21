import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO, format, subDays, eachDayOfInterval } from 'date-fns'
import { Transaction, Category, DailySpending, CategorySummary } from '../types'
import { getCategoryLabel, getCategoryColor, getCategoryIcon, ALL_CATEGORIES } from '../data/mockData'

const DAY_START = () => startOfDay(new Date())
const WEEK_START = () => startOfWeek(new Date(), { weekStartsOn: 1 })
const MONTH_START = () => startOfMonth(new Date())

export function filterByPeriod(transactions: Transaction[], period: 'day' | 'week' | 'month' | 'all') {
  const start = period === 'day' ? DAY_START() : period === 'week' ? WEEK_START() : period === 'month' ? MONTH_START() : null
  if (!start) return transactions
  return transactions.filter((t) => isAfter(parseISO(t.date), start))
}

export function getTotalSpending(transactions: Transaction[]) {
  return transactions.reduce((s, t) => s + t.amount, 0)
}

export function getSpendingByCategory(transactions: Transaction[]): CategorySummary[] {
  return ALL_CATEGORIES.map((cat) => {
    const catTx = transactions.filter((t) => t.category === cat)
    return {
      category: cat,
      label: getCategoryLabel(cat),
      color: getCategoryColor(cat),
      icon: getCategoryIcon(cat),
      total: catTx.reduce((s, t) => s + t.amount, 0),
      budget: 0, // filled in by caller
      transactions: catTx,
    } as CategorySummary
  }).filter((c) => c.total > 0)
}

export function getDailySpending(transactions: Transaction[], days = 30): DailySpending[] {
  const result: DailySpending[] = []
  const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() })
  for (const day of interval) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayTx = transactions.filter((t) => t.date === dateStr)
    const entry: DailySpending = {
      date: dateStr,
      label: format(day, 'MMM d'),
      total: 0,
      food: 0,
      going_out: 0,
      entertainment: 0,
      housing_utilities: 0,
      academics: 0,
      auto_insurance: 0,
      stocks: 0,
      other: 0,
    }
    for (const t of dayTx) {
      entry.total += t.amount
      const k = t.category as keyof DailySpending
      ;(entry[k] as number) = ((entry[k] as number) || 0) + t.amount
    }
    result.push(entry)
  }
  return result
}

export function getWeeklySpending(transactions: Transaction[], weeks = 8) {
  const weekly: { label: string; total: number; [key: string]: number | string }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 })
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const label = `Wk ${format(weekStart, 'MMM d')}`
    const weekTx = transactions.filter((t) => {
      const d = parseISO(t.date)
      return d >= weekStart && d <= weekEnd
    })
    const entry: Record<string, number | string> = { label, total: 0 }
    for (const cat of ALL_CATEGORIES) entry[cat] = 0
    for (const t of weekTx) {
      (entry.total as number) += t.amount
      entry[t.category] = ((entry[t.category] as number) || 0) + t.amount
    }
    weekly.push(entry as { label: string; total: number })
  }
  return weekly
}

export function getMonthlySpending(transactions: Transaction[], months = 6) {
  const monthly: { label: string; total: number; [key: string]: number | string }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStr = format(d, 'yyyy-MM')
    const label = format(d, 'MMM yyyy')
    const monthTx = transactions.filter((t) => t.date.startsWith(monthStr))
    const entry: Record<string, number | string> = { label, total: 0 }
    for (const cat of ALL_CATEGORIES) entry[cat] = 0
    for (const t of monthTx) {
      (entry.total as number) += t.amount
      entry[t.category] = ((entry[t.category] as number) || 0) + t.amount
    }
    monthly.push(entry as { label: string; total: number })
  }
  return monthly
}

export function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount)
}

export function detectAlerts(transactions: Transaction[], monthlyBudget: number, userType: string) {
  const alerts: string[] = []
  const monthTx = filterByPeriod(transactions, 'month')
  const monthTotal = getTotalSpending(monthTx)
  const budgetPct = (monthTotal / monthlyBudget) * 100

  if (budgetPct > 90) alerts.push(`⚠️ You've used ${budgetPct.toFixed(0)}% of your monthly budget ($${monthTotal.toFixed(0)} / $${monthlyBudget}).`)
  else if (budgetPct > 70) alerts.push(`📊 You're at ${budgetPct.toFixed(0)}% of your monthly budget — keep an eye on spending.`)

  // One-time alarming purchases
  const bigThreshold = userType === 'high_school' ? 100 : userType === 'college' ? 300 : 800
  const bigPurchases = transactions.filter((t) => t.amount > bigThreshold && t.isOneTime)
  if (bigPurchases.length > 0) {
    alerts.push(`🔔 Notable one-time purchases this period: ${bigPurchases.map((t) => `${t.merchant} ($${t.amount})`).join(', ')}.`)
  }

  // Category overspending
  const goingOutTx = filterByPeriod(transactions, 'week').filter((t) => t.category === 'going_out')
  const goingOutTotal = getTotalSpending(goingOutTx)
  if (goingOutTotal > (userType === 'high_school' ? 50 : userType === 'college' ? 80 : 150)) {
    alerts.push(`🍸 High "Going Out" spending this week: $${goingOutTotal.toFixed(0)}.`)
  }

  return alerts
}

export function buildFinancialContext(
  transactions: Transaction[],
  monthlyBudget: number,
  categoryBudgets: Record<Category, number>,
  userType: string,
  name: string
): string {
  const today = filterByPeriod(transactions, 'day')
  const week = filterByPeriod(transactions, 'week')
  const month = filterByPeriod(transactions, 'month')

  const byCat = (txs: Transaction[]) => {
    const result: Record<string, number> = {}
    for (const t of txs) result[getCategoryLabel(t.category)] = (result[getCategoryLabel(t.category)] || 0) + t.amount
    return Object.entries(result).map(([k, v]) => `${k}: $${v.toFixed(2)}`).join(', ')
  }

  const alerts = detectAlerts(transactions, monthlyBudget, userType)

  return `
=== FinWise Financial Context for ${name} (${userType.replace('_', ' ')}) ===

TODAY'S SPENDING: $${getTotalSpending(today).toFixed(2)}
  Breakdown: ${byCat(today) || 'None yet'}

THIS WEEK'S SPENDING: $${getTotalSpending(week).toFixed(2)}
  Breakdown: ${byCat(week)}

THIS MONTH'S SPENDING: $${getTotalSpending(month).toFixed(2)} / Budget: $${monthlyBudget}
  Breakdown: ${byCat(month)}

CATEGORY BUDGETS:
${Object.entries(categoryBudgets).map(([k, v]) => `  ${getCategoryLabel(k as Category)}: budget=$${v}`).join('\n')}

RECENT TRANSACTIONS (last 10):
${transactions.slice(0, 10).map((t) => `  [${t.date}] ${t.merchant}: $${t.amount} (${getCategoryLabel(t.category)})`).join('\n')}

ACTIVE ALERTS:
${alerts.length ? alerts.join('\n') : '  No active alerts.'}

USER TYPE: ${userType}
MONTHLY BUDGET: $${monthlyBudget}
=== End of Financial Context ===
`.trim()
}
