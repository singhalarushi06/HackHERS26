import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  TrendingUp, LayoutDashboard, List, PieChart, Settings,
  LogOut, GraduationCap, BookOpen, Briefcase, Plus, Target
} from 'lucide-react'
import { motion } from 'framer-motion'
import { fmt, filterByPeriod, getTotalSpending } from '../utils/spending'
import AddTransactionModal from './AddTransactionModal'

type Tab = 'dashboard' | 'transactions' | 'categories' | 'goals' | 'settings'

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'transactions', icon: List, label: 'Transactions' },
  { id: 'categories', icon: PieChart, label: 'Categories' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const

const USER_TYPE_ICONS: Record<string, React.ReactNode> = {
  high_school: <BookOpen className="w-3.5 h-3.5" />,
  college: <GraduationCap className="w-3.5 h-3.5" />,
  full_time: <Briefcase className="w-3.5 h-3.5" />,
}
const USER_TYPE_LABELS: Record<string, string> = {
  high_school: 'High School',
  college: 'College Student',
  full_time: 'Professional',
}

export default function LeftSidebar() {
  const { user, transactions, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showAddTx, setShowAddTx] = useState(false)

  if (!user) return null

  const monthTotal = getTotalSpending(filterByPeriod(transactions, 'month'))
  const budgetPct = Math.min((monthTotal / user.monthlyBudget) * 100, 100)
  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full scrollbar-thin overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center flex-shrink-0 glow-purple">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold gradient-text">FinWise</span>
      </div>

      {/* Profile card */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-pink flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-primary-400">{USER_TYPE_ICONS[user.userType]}</span>
              <span className="text-xs text-slate-400 truncate">{USER_TYPE_LABELS[user.userType]}</span>
            </div>
          </div>
        </div>

        {/* Budget bar */}
        <div className="mt-3 px-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500">Monthly Budget</span>
            <span className="text-xs text-white font-medium">{fmt(monthTotal)} / {fmt(user.monthlyBudget)}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${budgetPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${budgetPct > 90 ? 'bg-red-400' : budgetPct > 70 ? 'bg-accent-orange' : 'bg-accent-green'}`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{budgetPct.toFixed(0)}% used</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as Tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
              activeTab === id
                ? 'bg-primary-500/15 text-primary-300 border border-primary-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Quick stats */}
      <div className="px-4 py-3 border-t border-white/5 space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">Quick Stats</p>
        <StatRow label="Today" value={fmt(getTotalSpending(filterByPeriod(transactions, 'day')))} color="text-accent-green" />
        <StatRow label="This Week" value={fmt(getTotalSpending(filterByPeriod(transactions, 'week')))} color="text-accent-blue" />
        <StatRow label="This Month" value={fmt(monthTotal)} color="text-primary-400" />
      </div>

      {/* Add transaction button */}
      <div className="px-4 py-3">
        <button
          onClick={() => setShowAddTx(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-600/80 to-accent-purple/80 hover:from-primary-600 hover:to-accent-purple text-white text-sm font-medium rounded-xl transition-all duration-200 border border-primary-500/30"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 pb-4">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} />}
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  )
}
