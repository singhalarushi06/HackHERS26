import { useState } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Category, Transaction } from '../types'
import { getCategoryLabel, getCategoryIcon, getVisibleCategories } from '../data/mockData'
import { format } from 'date-fns'

export default function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const { user, addTransaction } = useAuth()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  if (!user) return null

  const categories = getVisibleCategories(user.userType)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const tx: Transaction = {
      id: Math.random().toString(36).slice(2),
      date,
      amount: parseFloat(amount),
      category,
      description,
      merchant: merchant || description,
    }
    addTransaction(tx)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative glass rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Add Transaction</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grocery run"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Trader Joe's"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-all"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {getCategoryIcon(c)} {getCategoryLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-accent-purple text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-lg"
          >
            Add Transaction
          </button>
        </form>
      </motion.div>
    </div>
  )
}
