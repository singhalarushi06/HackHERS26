import { Goal } from '../types'

const STORAGE_KEY = 'fw_goals'

export function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Goal[]
  } catch {
    return []
  }
}

export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  } catch {}
}

export function addGoals(newGoals: Omit<Goal, 'id' | 'createdAt' | 'status'>[]): Goal[] {
  const existing = loadGoals()
  const created: Goal[] = newGoals.map((g) => ({
    ...g,
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'active' as const,
    currentAmount: g.currentAmount ?? 0,
  }))
  const updated = [...existing, ...created]
  saveGoals(updated)
  return updated
}

export function updateGoal(id: string, patch: Partial<Goal>): Goal[] {
  const goals = loadGoals().map((g) => (g.id === id ? { ...g, ...patch } : g))
  saveGoals(goals)
  return goals
}

export function deleteGoal(id: string): Goal[] {
  const goals = loadGoals().filter((g) => g.id !== id)
  saveGoals(goals)
  return goals
}
