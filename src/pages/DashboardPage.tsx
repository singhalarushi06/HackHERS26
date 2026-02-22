import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LeftSidebar from '../components/LeftSidebar'
import MainDashboard from '../components/MainDashboard'
import Transactions from '../components/Transactions'
import CategoriesPanel from '../components/CategoriesPanel'
import ProfileSettings from '../components/ProfileSettings'
import AIAssistant from '../components/AIAssistant'
import { initChat } from '../utils/gemini'
import { buildFinancialContext } from '../utils/spending'
import { Target } from 'lucide-react'

type Tab = 'dashboard' | 'agent' | 'transactions' | 'categories' | 'goals' | 'settings'

function PlaceholderPanel({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, transactions } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  useEffect(() => {
    if (user) {
      const ctx = buildFinancialContext(
        transactions,
        user.monthlyBudget,
        user.categoryBudgets,
        user.userType,
        user.name
      )
      try {
        initChat(ctx)
      } catch {
        // No API key yet — user will be prompted in the AI panel
      }
    }
  }, [user, transactions])

  if (!user) return null

  function renderMiddlePanel() {
    switch (activeTab) {
      case 'transactions': return <Transactions />
      case 'categories': return <CategoriesPanel />
      case 'settings': return <ProfileSettings />
      case 'goals': return <PlaceholderPanel icon={<Target className="w-7 h-7 text-accent-green" />} title="Goals" description="Set and track your savings goals here." />
      case 'agent': return <PlaceholderPanel icon={<span className="text-3xl"></span>} title="AI Assistant" description="Your AI assistant is in the right panel — ask it anything!" />
      default: return <MainDashboard />
    }
  }

  return (
    <div className="flex h-screen w-full bg-dark-950 overflow-hidden">
      {/* Left Panel */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-white/5 bg-dark-900/60">
        <LeftSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />
      </div>

      {/* Middle Panel */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
        {renderMiddlePanel()}
      </div>

      {/* Right Panel */}
      <div className="w-96 flex-shrink-0 flex flex-col bg-dark-900/40">
        <AIAssistant />
      </div>
    </div>
  )
}
