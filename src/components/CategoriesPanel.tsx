import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { getSpendingByCategory, filterByPeriod, fmt } from '../utils/spending'
import { getCategoryColor, getCategoryLabel } from '../data/mockData'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'
import { Category } from '../types'

type Period = 'week' | 'month' | 'all'
const PERIOD_LABELS: Record<Period, string> = { week: 'This Week', month: 'This Month', all: 'All Time' }

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔',
  going_out: '🎉',
  entertainment: '🎬',
  housing_utilities: '🏠',
  academics: '🎓',
  auto_insurance: '🚗',
  stocks: '📈',
  other: '💰',
}

export default function CategoriesPanel() {
  const { user, transactions } = useAuth()
  const [period, setPeriod] = useState<Period>('month')
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!user) return null

  const filtered = filterByPeriod(transactions, period)
  const categoryData = getSpendingByCategory(filtered).map((c) => ({
    ...c,
    budget: user.categoryBudgets[c.category] || 0,
  }))
  const sorted = [...categoryData].sort((a, b) => b.total - a.total)
  const grandTotal = sorted.reduce((s, c) => s + c.total, 0)

  // For comparison: previous period
  const prevFiltered = filterByPeriod(
    transactions,
    period === 'week' ? 'month' : period === 'month' ? 'all' : 'all'
  )
  const prevCatData = getSpendingByCategory(prevFiltered)

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-dark-900/40 sticky top-0 z-10 backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold text-white">Categories</h1>
          <p className="text-xs text-slate-500">Spending breakdown by category</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-0.5">
          {(['week', 'month', 'all'] as Period[]).map((p) => (
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

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3.5 border border-white/8">
            <p className="text-xs text-slate-500 mb-1">Total Spent</p>
            <p className="text-lg font-bold text-white">{fmt(grandTotal)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{PERIOD_LABELS[period]}</p>
          </div>
          <div className="glass rounded-xl p-3.5 border border-white/8">
            <p className="text-xs text-slate-500 mb-1">Categories Active</p>
            <p className="text-lg font-bold text-white">{sorted.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">of {Object.keys(user.categoryBudgets).length} total</p>
          </div>
          <div className="glass rounded-xl p-3.5 border border-white/8">
            <p className="text-xs text-slate-500 mb-1">Largest Category</p>
            <p className="text-lg font-bold text-white">{sorted[0] ? sorted[0].label : '—'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sorted[0] ? fmt(sorted[0].total) : ''}</p>
          </div>
        </div>

        {/* Pie + Bar row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-2">Distribution</h2>
            {sorted.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={sorted}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={72}
                    dataKey="total"
                    nameKey="label"
                    paddingAngle={3}
                  >
                    {sorted.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => fmt(value as number)}
                    contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[190px] text-slate-500 text-sm">No data</div>
            )}
          </div>
          <div className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-2">vs. Budget</h2>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={sorted.filter((c) => c.budget > 0)} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <Tooltip
                  formatter={(value) => fmt(value as number)}
                  contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                />
                <Bar dataKey="budget" name="Budget" fill="rgba(255,255,255,0.08)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="total" name="Spent" radius={[0, 4, 4, 0]}>
                  {sorted.filter((c) => c.budget > 0).map((entry) => (
                    <Cell key={entry.category} fill={entry.total > entry.budget ? '#ef4444' : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-category expandable rows */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white px-1">Category Details</h2>
          {sorted.map((cat) => {
            const pct = cat.budget > 0 ? Math.min((cat.total / cat.budget) * 100, 100) : null
            const prevCat = prevCatData.find((c) => c.category === cat.category)
            const delta = prevCat ? cat.total - prevCat.total : null
            const isOpen = expanded === cat.category
            const recentTx = filtered
              .filter((t) => t.category === cat.category)
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)

            return (
              <motion.div key={cat.category} layout className="glass rounded-xl overflow-hidden border border-white/8">
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.category)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}30` }}
                  >
                    {CATEGORY_ICONS[cat.category] || '💰'}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{cat.label}</span>
                      <div className="flex items-center gap-2">
                        {delta !== null && (
                          <span className={`text-[10px] flex items-center gap-0.5 ${delta > 0 ? 'text-red-400' : 'text-accent-green'}`}>
                            {delta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {fmt(Math.abs(delta))}
                          </span>
                        )}
                        <span className="text-sm font-semibold" style={{ color: cat.color }}>{fmt(cat.total)}</span>
                        {cat.budget > 0 && (
                          <span className="text-xs text-slate-500">/ {fmt(cat.budget)}</span>
                        )}
                      </div>
                    </div>
                    {pct !== null && (
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ background: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : cat.color }}
                        />
                      </div>
                    )}
                    {pct !== null && (
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-slate-600">{pct.toFixed(0)}% of budget used</span>
                        <span className="text-[10px] text-slate-600">{recentTx.length} transactions</span>
                      </div>
                    )}
                  </div>

                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                </button>

                {/* Expanded transactions */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/5"
                    >
                      {recentTx.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No transactions this period</p>
                      ) : (
                        <div className="px-4 py-2 space-y-1">
                          {recentTx.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                              <div>
                                <p className="text-xs font-medium text-white">{tx.merchant}</p>
                                <p className="text-[10px] text-slate-500">{tx.date} · {tx.description}</p>
                              </div>
                              <span className="text-xs font-semibold text-slate-300">-{fmt(tx.amount)}</span>
                            </div>
                          ))}
                          {filtered.filter((t) => t.category === cat.category).length > 5 && (
                            <p className="text-[10px] text-slate-500 text-center py-1">
                              +{filtered.filter((t) => t.category === cat.category).length - 5} more transactions
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
