import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import LeftSidebar from '../components/LeftSidebar'
import Transactions from '../components/Transactions'
import AIAssistant from '../components/AIAssistant'
import { initChat } from '../utils/gemini'
import { buildFinancialContext } from '../utils/spending'

export default function DashboardPage() {
  const { user, transactions } = useAuth()

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

  return (
    <div className="flex h-screen w-full bg-dark-950 overflow-hidden">
      {/* Left Panel */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-white/5 bg-dark-900/60">
        <LeftSidebar />
      </div>

      {/* Middle Panel */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
        <Transactions />
      </div>

      {/* Right Panel */}
      <div className="w-96 flex-shrink-0 flex flex-col bg-dark-900/40">
        <AIAssistant />
      </div>
    </div>
  )
}
