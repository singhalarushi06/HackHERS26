import { useState } from 'react'
import { X, Key, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  onClose: () => void
  onSave: (geminiKey: string, elevenLabsKey: string) => void
}

export default function APIKeyModal({ onClose, onSave }: Props) {
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('fw_gemini_key') || '')
  const [elevenKey, setElevenKey] = useState(localStorage.getItem('fw_eleven_key') || '')
  const [showGemini, setShowGemini] = useState(false)
  const [showEleven, setShowEleven] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ gemini?: 'ok' | 'err'; eleven?: 'ok' | 'err' }>({})

  async function testKeys() {
    setTesting(true)
    setStatus({})

    // Test Gemini
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
        }
      )
      const data = await res.json()
      setStatus((s) => ({ ...s, gemini: data.error ? 'err' : 'ok' }))
    } catch {
      setStatus((s) => ({ ...s, gemini: 'err' }))
    }

    // Test ElevenLabs via TTS endpoint (avoids needing user_read permission)
    try {
      const res = await fetch(
        'https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL',
        {
          method: 'POST',
          headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Hi',
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      )
      setStatus((s) => ({ ...s, eleven: res.ok ? 'ok' : 'err' }))
    } catch {
      setStatus((s) => ({ ...s, eleven: 'err' }))
    }

    setTesting(false)
  }

  function handleSave() {
    if (geminiKey) localStorage.setItem('fw_gemini_key', geminiKey)
    if (elevenKey) localStorage.setItem('fw_eleven_key', elevenKey)
    onSave(geminiKey, elevenKey)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-primary-400" />
            </div>
            <h3 className="text-base font-semibold text-white">API Keys</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Gemini */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                Get key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all pr-16"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {status.gemini && (
                  status.gemini === 'ok'
                    ? <CheckCircle className="w-4 h-4 text-accent-green" />
                    : <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <button type="button" onClick={() => setShowGemini(!showGemini)} className="text-slate-500 hover:text-slate-300 p-1">
                  {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {status.gemini === 'err' && (
              <p className="text-xs text-red-400 mt-1">❌ Invalid or leaked key. Generate a new one at aistudio.google.com</p>
            )}
            {status.gemini === 'ok' && (
              <p className="text-xs text-accent-green mt-1">✅ Gemini key is valid!</p>
            )}
          </div>

          {/* ElevenLabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                ElevenLabs API Key
              </label>
              <a
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                Get key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showEleven ? 'text' : 'password'}
                value={elevenKey}
                onChange={(e) => setElevenKey(e.target.value)}
                placeholder="sk_..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-all pr-16"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {status.eleven && (
                  status.eleven === 'ok'
                    ? <CheckCircle className="w-4 h-4 text-accent-green" />
                    : <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <button type="button" onClick={() => setShowEleven(!showEleven)} className="text-slate-500 hover:text-slate-300 p-1">
                  {showEleven ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {status.eleven === 'err' && (
              <p className="text-xs text-red-400 mt-1">❌ Invalid key.</p>
            )}
            {status.eleven === 'ok' && (
              <p className="text-xs text-accent-green mt-1">✅ ElevenLabs key is valid!</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={testKeys}
            disabled={testing || (!geminiKey && !elevenKey)}
            className="flex-1 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm py-2.5 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {testing ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '🔍 Test Keys'
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={!geminiKey && !elevenKey}
            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-accent-purple text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-40 shadow-lg"
          >
            Save & Apply
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-3 text-center">Keys are stored in your browser only — never sent to any server.</p>
      </motion.div>
    </div>
  )
}
