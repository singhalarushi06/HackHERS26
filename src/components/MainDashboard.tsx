import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  getDailySpending, getWeeklySpending, getMonthlySpending,
  getSpendingByCategory, filterByPeriod, getTotalSpending, fmt, detectAlerts
} from '../utils/spending'
import { getCategoryColor, getCategoryLabel, ALL_CATEGORIES } from '../data/mockData'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, CalendarDays, BarChart2, Clock } from 'lucide-react'

type Period = 'day' | 'week' | 'month'
type ChartView = 'area' | 'bar' | 'pie'

const PERIOD_LABELS: Record<Period, string> = { day: 'Today', week: 'This Week', month: 'This Month' }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl p-3 text-xs min-w-[140px]">
        <p className="text-slate-300 font-medium mb-1.5">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-slate-400">{p.name}</span>
            </div>
            <span className="font-medium text-white">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function MainDashboard() {
  const { user, transactions } = useAuth()
  const [period, setPeriod] = useState<Period>('month')
  const [chartView, setChartView] = useState<ChartView>('area')

  if (!user) return null

  const filtered = filterByPeriod(transactions, period)
  const total = getTotalSpending(filtered)
  const budget = user.monthlyBudget
  const categoryData = getSpendingByCategory(filtered).map((c) => ({
    ...c,
    budget: user.categoryBudgets[c.category] || 0,
  }))

  const dailyData = getDailySpending(transactions, period === 'day' ? 1 : period === 'week' ? 7 : 30)
  const weeklyData = getWeeklySpending(transactions, 8)
  const monthlyData = getMonthlySpending(transactions, 6)
  const alerts = detectAlerts(transactions, budget, user.userType)

  const prevFiltered = filterByPeriod(transactions.slice(-30), period)
  const prevTotal = getTotalSpending(prevFiltered) || 1
  const trend = ((total - prevTotal) / prevTotal) * 100

  // Top 3 categories
  const top3 = [...categoryData].sort((a, b) => b.total - a.total).slice(0, 3)

  // ML Prediction: simple linear trend on monthly data
  const lastTwo = monthlyData.slice(-2)
  const predictedNext = lastTwo.length === 2
    ? Math.max(0, (lastTwo[1].total as number) + ((lastTwo[1].total as number) - (lastTwo[0].total as number)))
    : total

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-dark-900/40 sticky top-0 z-10 backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold text-white">Financial Overview</h1>
          <p className="text-xs text-slate-500">Welcome back, {user.name.split(' ')[0]} 👋</p>
        </div>
        {/* Period Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-0.5">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                period === p ? 'bg-primary-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          <KPICard
            label="Total Spent"
            value={fmt(total)}
            sub={PERIOD_LABELS[period]}
            icon={<BarChart2 className="w-4 h-4 text-primary-400" />}
            color="border-primary-500/25 bg-primary-500/5"
          />
          <KPICard
            label="Budget Left"
            value={fmt(Math.max(0, budget - total))}
            sub={`of ${fmt(budget)}`}
            icon={<Calendar className="w-4 h-4 text-accent-green" />}
            color="border-accent-green/25 bg-accent-green/5"
          />
          <KPICard
            label="Trend"
            value={`${Math.abs(trend).toFixed(0)}%`}
            sub={trend >= 0 ? 'more than avg' : 'less than avg'}
            icon={trend >= 0 ? <TrendingUp className="w-4 h-4 text-accent-orange" /> : <TrendingDown className="w-4 h-4 text-accent-green" />}
            color={trend >= 0 ? 'border-accent-orange/25 bg-accent-orange/5' : 'border-accent-green/25 bg-accent-green/5'}
          />
          <KPICard
            label="Next Month Est."
            value={fmt(predictedNext)}
            sub="AI prediction"
            icon={<CalendarDays className="w-4 h-4 text-accent-purple" />}
            color="border-accent-purple/25 bg-accent-purple/5"
          />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">{a}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main Chart */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Spending Over Time</h2>
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {([['area', 'Area'], ['bar', 'Bar']] as [ChartView, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${chartView === v ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {chartView === 'area' ? (
              <AreaChart data={period === 'month' ? monthlyData : period === 'week' ? weeklyData : dailyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#6366f4" strokeWidth={2} fill="url(#colorTotal)" dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={period === 'month' ? monthlyData : period === 'week' ? weeklyData : dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" fill="#6366f4" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Category Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Spending by Category</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="total"
                    nameKey="label"
                    paddingAngle={3}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => fmt(value as number)} contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-slate-500 text-sm">No spending data</div>
            )}
          </div>

          {/* Stacked bar by category */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Weekly Category Breakdown</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData.slice(-4)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                {ALL_CATEGORIES.map((cat) => (
                  <Bar key={cat} dataKey={cat} name={getCategoryLabel(cat)} stackId="a" fill={getCategoryColor(cat)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Budget Bars */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Category Budget Tracker</h2>
          <div className="space-y-3">
            {categoryData.filter((c) => c.budget > 0).map((c) => {
              const pct = Math.min((c.total / c.budget) * 100, 100)
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.icon}</span>
                      <span className="text-xs font-medium text-white">{c.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold" style={{ color: c.color }}>{fmt(c.total)}</span>
                      <span className="text-xs text-slate-500">/ {fmt(c.budget)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : c.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <span className="text-xs text-slate-500">{filtered.length} total</span>
          </div>
          <div className="space-y-2">
            {filtered.slice(0, 8).map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${getCategoryColor(tx.category)}20`, border: `1px solid ${getCategoryColor(tx.category)}30` }}
                  >
                    {tx.category === 'food' ? '🍔' : tx.category === 'going_out' ? '🎉' : tx.category === 'entertainment' ? '🎬' : tx.category === 'housing_utilities' ? '🏠' : tx.category === 'academics' ? '🎓' : tx.category === 'auto_insurance' ? '🚗' : tx.category === 'stocks' ? '📈' : '💰'}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{tx.merchant}</p>
                    <p className="text-xs text-slate-500">{tx.date} · {getCategoryLabel(tx.category)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">-{fmt(tx.amount)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ML Predictions */}
        <div className="glass rounded-2xl p-5 border border-primary-500/15">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">AI Spending Predictions</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <PredCard
              label="Next Month"
              value={fmt(predictedNext)}
              change={((predictedNext - (monthlyData.at(-1)?.total as number || 1)) / (monthlyData.at(-1)?.total as number || 1) * 100).toFixed(1)}
              positive={predictedNext < (monthlyData.at(-1)?.total as number || Infinity)}
            />
            <PredCard
              label="Top Risk"
              value={top3[0] ? top3[0].label : 'N/A'}
              sub={top3[0] ? fmt(top3[0].total) : ''}
            />
            <PredCard
              label="Save Potential"
              value={fmt(Math.max(0, total - budget * 0.85))}
              sub="vs 85% target"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-3.5 border ${color}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        {icon}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </motion.div>
  )
}

function PredCard({ label, value, sub, change, positive }: { label: string; value: string; sub?: string; change?: string; positive?: boolean }) {
  return (
    <div className="bg-white/3 rounded-xl p-3 border border-white/5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
      {change && (
        <p className={`text-xs mt-0.5 ${positive ? 'text-accent-green' : 'text-accent-orange'}`}>
          {positive ? '↓' : '↑'} {change}%
        </p>
      )}
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}
