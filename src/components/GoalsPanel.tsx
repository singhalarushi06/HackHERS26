import { useState } from 'react'
import { Goal } from '../types'
import { updateGoal, deleteGoal } from '../utils/goalsStore'
import { Target, CheckCircle2, Circle, Trash2, CalendarClock, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  goals: Goal[]
  onGoalsChange: (goals: Goal[]) => void
}

function formatDeadline(dateStr?: string) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000)
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  if (diff < 0) return { label, badge: 'overdue', color: 'text-red-400' }
  if (diff <= 3) return { label, badge: `${diff}d left`, color: 'text-amber-400' }
  if (diff <= 7) return { label, badge: `${diff}d left`, color: 'text-yellow-400' }
  return { label, badge: `${diff}d left`, color: 'text-slate-400' }
}

export default function GoalsPanel({ goals, onGoalsChange }: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const displayed = goals.filter((g) => filter === 'all' ? true : g.status === filter)
  const activeCount = goals.filter((g) => g.status === 'active').length
  const completedCount = goals.filter((g) => g.status === 'completed').length

  function toggleComplete(id: string, current: 'active' | 'completed') {
    const next = current === 'active' ? 'completed' : 'active'
    const updated = updateGoal(id, { status: next })
    onGoalsChange(updated)
  }

  function handleDelete(id: string) {
    const updated = deleteGoal(id)
    onGoalsChange(updated)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent-green" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Goals</h1>
            <p className="text-xs text-slate-500">
              {activeCount} active · {completedCount} completed
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150 capitalize ${
                filter === f
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Goals list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {displayed.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">No goals yet</p>
                <p className="text-xs text-slate-600 mt-1 max-w-[240px]">
                  Ask the AI assistant to create a budget plan — it will automatically add goals here.
                </p>
              </div>
              <div className="bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-xs text-slate-500 max-w-[260px]">
                Try: <span className="text-primary-400">"Create a budget plan for next month"</span>
              </div>
            </motion.div>
          ) : (
            displayed.map((goal) => {
              const dl = formatDeadline(goal.deadline)
              const isComplete = goal.status === 'completed'
              const pct = goal.targetAmount && goal.currentAmount != null
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : null

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`group bg-white/5 border rounded-xl p-4 transition-all duration-200 ${
                    isComplete
                      ? 'border-white/5 opacity-60'
                      : 'border-white/10 hover:border-accent-green/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Toggle complete */}
                    <button
                      onClick={() => toggleComplete(goal.id, goal.status)}
                      className="mt-0.5 flex-shrink-0 transition-colors"
                      title={isComplete ? 'Mark active' : 'Mark complete'}
                    >
                      {isComplete
                        ? <CheckCircle2 className="w-5 h-5 text-accent-green" />
                        : <Circle className="w-5 h-5 text-slate-500 hover:text-accent-green" />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${isComplete ? 'line-through text-slate-500' : 'text-white'}`}>
                        {goal.title}
                      </p>
                      {goal.description && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{goal.description}</p>
                      )}

                      {/* Progress bar */}
                      {pct !== null && !isComplete && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">
                              ${goal.currentAmount?.toLocaleString()} / ${goal.targetAmount?.toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-accent-green">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent-green to-primary-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {goal.category && (
                          <span className="text-[10px] bg-white/8 text-slate-400 px-2 py-0.5 rounded-full capitalize">
                            {goal.category.replace('_', ' ')}
                          </span>
                        )}
                        {dl && (
                          <span className={`flex items-center gap-1 text-[10px] ${dl.color}`}>
                            <CalendarClock className="w-2.5 h-2.5" />
                            {dl.label} · {dl.badge}
                          </span>
                        )}
                        {goal.targetAmount && !goal.currentAmount && (
                          <span className="text-[10px] text-slate-500">
                            Target: ${goal.targetAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-slate-600 hover:text-red-400 transition-all"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      {goals.length > 0 && (
        <div className="px-6 pb-4 pt-2 border-t border-white/5">
          <p className="text-[10px] text-slate-600 text-center">
            Goals are added automatically when the AI creates a budget plan for you.
          </p>
        </div>
      )}
    </div>
  )
}
