import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, SignupData } from '../context/AuthContext'
import { Eye, EyeOff, GraduationCap, BookOpen, Briefcase, TrendingUp, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserType } from '../types'

const USER_TYPES: { value: UserType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'high_school',
    label: 'High School Student',
    description: 'Track allowance, part-time income, and teen spending',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'from-accent-green to-teal-400',
  },
  {
    value: 'college',
    label: 'College Student',
    description: 'Manage tuition, dorm costs, meal plans, and more',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'from-primary-500 to-accent-purple',
  },
  {
    value: 'full_time',
    label: 'Full-Time Worker',
    description: 'Budget salary, utilities, investments, and everyday life',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'from-accent-orange to-yellow-400',
  },
]

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    userType: 'college',
  })

  function update(field: keyof SignupData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    signup(form)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-950 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-accent-purple/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center shadow-lg glow-purple">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">FinWise</span>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary-500' : 'bg-white/10'}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
                  <p className="text-sm text-slate-400 mb-6">Start your financial journey</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Sophia Chen"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 transition-all pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-accent-purple text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary-500/25">
                  Continue →
                </button>
                <p className="text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">Sign in</Link>
                </p>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">What describes you?</h2>
                  <p className="text-sm text-slate-400 mb-6">We'll personalize your experience</p>
                </div>

                <div className="space-y-3">
                  {USER_TYPES.map((ut) => (
                    <button
                      key={ut.value}
                      type="button"
                      onClick={() => update('userType', ut.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                        form.userType === ut.value
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-white/10 bg-white/3 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${ut.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {ut.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{ut.label}</span>
                          {form.userType === ut.value && <CheckCircle className="w-4 h-4 text-primary-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{ut.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 font-medium py-2.5 rounded-xl transition-all duration-200"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-accent-purple text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Launch FinWise 🚀'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
