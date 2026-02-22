import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ELEVEN_VOICES, getSelectedVoiceId, setSelectedVoiceId, speakText } from '../utils/elevenlabs'
import { GraduationCap, BookOpen, Briefcase, Volume2, Check, Loader2, User, Mail, Calendar, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { fmt } from '../utils/spending'

const USER_TYPE_ICONS: Record<string, React.ReactNode> = {
  high_school: <BookOpen className="w-4 h-4" />,
  college: <GraduationCap className="w-4 h-4" />,
  full_time: <Briefcase className="w-4 h-4" />,
}
const USER_TYPE_LABELS: Record<string, string> = {
  high_school: 'High School Student',
  college: 'College Student',
  full_time: 'Full-Time Professional',
}

export default function ProfileSettings() {
  const { user } = useAuth()
  const [selectedVoice, setSelectedVoice] = useState(getSelectedVoiceId)
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)

  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  async function handlePreview(voiceId: string) {
    if (previewingVoice) return
    // Temporarily set the voice, speak preview, then restore if needed
    const prev = getSelectedVoiceId()
    setSelectedVoiceId(voiceId)
    setPreviewingVoice(voiceId)
    try {
      await speakText("Hi! I'm your FinWise AI assistant. How can I help with your finances today?")
    } finally {
      // Keep the new voice if the user already clicked it
      if (getSelectedVoiceId() !== voiceId) setSelectedVoiceId(prev)
      setPreviewingVoice(null)
    }
  }

  function handleSelectVoice(voiceId: string) {
    setSelectedVoice(voiceId)
    setSelectedVoiceId(voiceId)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-dark-900/40 sticky top-0 z-10 backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold text-white">Profile Settings</h1>
          <p className="text-xs text-slate-500">Your account info and preferences</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">

        {/* Profile card */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-pink flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-lg">
              {initials}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{user.name}</h2>
              <p className="text-sm text-slate-400">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-primary-400">{USER_TYPE_ICONS[user.userType]}</span>
                <span className="text-xs text-slate-400">{USER_TYPE_LABELS[user.userType]}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Name" value={user.name} />
            <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={user.email} />
            <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Member Since" value={user.joinDate} />
            <InfoRow icon={<Wallet className="w-3.5 h-3.5" />} label="Monthly Budget" value={fmt(user.monthlyBudget)} />
          </div>
        </div>

        {/* Voice Selection */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold text-white">AI Voice (ElevenLabs)</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Choose the voice for your AI assistant. Click preview to hear a sample.</p>

          <div className="space-y-2">
            {ELEVEN_VOICES.map((voice) => {
              const isSelected = selectedVoice === voice.id
              const isPreviewing = previewingVoice === voice.id

              return (
                <motion.div
                  key={voice.id}
                  layout
                  onClick={() => handleSelectVoice(voice.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-primary-500/15 border-primary-500/40'
                      : 'bg-white/3 border-white/8 hover:border-white/15 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Selected indicator */}
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'border-primary-500 bg-primary-500' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{voice.name}</p>
                      <p className="text-xs text-slate-500">{voice.description}</p>
                    </div>
                  </div>

                  {/* Preview button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePreview(voice.id) }}
                    disabled={previewingVoice !== null}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isPreviewing
                        ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border-white/10 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isPreviewing ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Playing...</>
                    ) : (
                      <><Volume2 className="w-3 h-3" /> Preview</>
                    )}
                  </button>
                </motion.div>
              )
            })}
          </div>

          <p className="text-[10px] text-slate-600 mt-3 text-center">
            Voice selection is saved locally · Powered by ElevenLabs
          </p>
        </div>

        {/* Budget breakdown */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <h2 className="text-sm font-semibold text-white mb-4">Category Budgets</h2>
          <div className="space-y-2">
            {Object.entries(user.categoryBudgets)
              .filter(([, v]) => v > 0)
              .map(([cat, budget]) => (
                <div key={cat} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-xs text-slate-400 capitalize">{cat.replace('_', ' ')}</span>
                  <span className="text-xs font-semibold text-white">{fmt(budget)}</span>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-white/3 rounded-xl border border-white/5">
      <span className="text-slate-500 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-xs font-medium text-white truncate">{value}</p>
      </div>
    </div>
  )
}
