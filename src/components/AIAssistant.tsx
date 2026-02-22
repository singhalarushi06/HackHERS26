import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { streamMessage, resetChat, initChat } from '../utils/gemini'
import { speakText, stopSpeaking } from '../utils/elevenlabs'
import { buildFinancialContext } from '../utils/spending'
import { ChatMessage } from '../types'
import {
  Sparkles, Send, Mic, MicOff, Volume2, VolumeX,
  RotateCcw, Loader2, Bot, User, ChevronDown, Radio
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking'

const QUICK_PROMPTS = [
  "What's my daily spending summary?",
  "Show me my weekly breakdown",
  "Am I over budget this month?",
  "Give me money-saving recommendations",
  "Create a spending plan for next month",
  "What's my biggest expense?",
  "Predict my spending next month",
  "Alert me on overspending areas",
]

export default function AIAssistant() {
  const { user, transactions } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your FinWise AI assistant 👋 I've loaded your financial data and I'm ready to help. You can ask me about your spending, get recommendations, create budget plans, or just chat about your finances. Try the voice button to speak with me!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')
  const [showQuick, setShowQuick] = useState(true)

  // Refs — let recognition callbacks always see current values (no stale closures)
  const voiceModeRef = useRef(false)
  const loadingRef = useRef(false)
  const sendMessageRef = useRef<(text: string, fromVoice?: boolean) => Promise<void>>(async () => {})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { voiceModeRef.current = voiceMode }, [voiceMode])
  useEffect(() => { loadingRef.current = loading }, [loading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Init AI chat on mount
  useEffect(() => {
    if (!user) return
    const ctx = buildFinancialContext(
      transactions, user.monthlyBudget, user.categoryBudgets, user.userType, user.name
    )
    try { initChat(ctx) } catch {}
  }, [])

  // Initialize speech recognition ONCE — uses sendMessageRef to avoid stale closure
  useEffect(() => {
    const SR: typeof SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const parts = Array.from({ length: event.results.length }, (_, i) => event.results[i])
      const transcript = parts.map((r) => r[0].transcript).join('')
      setInput(transcript)
      if (parts[parts.length - 1].isFinal) {
        setVoicePhase('thinking')
        // Always call latest handler via ref — never a stale closure
        sendMessageRef.current(transcript, true)
      }
    }

    recognition.onerror = (e: Event) => {
      const errEvent = e as Event & { error?: string }
      console.warn('Speech recognition error:', errEvent.error)
      if (errEvent.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access in your browser settings.')
      }
      setVoicePhase('idle')
    }
    recognition.onend = () => {
      setVoicePhase((prev) => (prev === 'listening' ? 'idle' : prev))
    }

    recognitionRef.current = recognition
  }, [])

  function startListening() {
    const rec = recognitionRef.current
    if (!rec) {
      alert('Voice recognition is not supported in your browser. Please use Chrome.')
      return
    }
    stopSpeaking()
    // Stop any in-progress session first, then start fresh after a tick
    try { rec.stop() } catch {}
    setTimeout(() => {
      try {
        rec.start()
        setInput('')
        setVoicePhase('listening')
      } catch (e) {
        console.warn('Recognition start failed:', e)
        setVoicePhase('idle')
      }
    }, 120)
  }

  function stopListening() {
    try { recognitionRef.current?.stop() } catch {}
    setVoicePhase('idle')
  }

  function toggleVoiceMode() {
    const next = !voiceMode
    setVoiceMode(next)
    voiceModeRef.current = next
    if (!next) {
      stopSpeaking()
      try { recognitionRef.current?.stop() } catch {}
      setVoicePhase('idle')
    } else {
      setTimeout(() => startListening(), 200)
    }
  }

  const handleSendMessage = useCallback(async (text: string, fromVoice = false) => {
    if (!text.trim() || loadingRef.current) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      isVoice: fromVoice,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    loadingRef.current = true
    setShowQuick(false)

    // Add empty assistant message immediately — will be filled by streaming
    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }])

    try {
      let fullResponse = ''
      await streamMessage(text.trim(), (chunk) => {
        fullResponse += chunk
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, content: fullResponse } : m
        ))
      })

      // Speak the complete response if in voice mode
      if (voiceModeRef.current || fromVoice) {
        setVoicePhase('speaking')
        const cleanText = fullResponse
          .replace(/[#*_`~\[\]]/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 600)
        await speakText(cleanText)
      }
    } catch (err) {
      console.error('[FinWise AI error]', err)
      const errStr = String(err)
      let errContent: string
      if (errStr.includes('NO_KEY') || errStr.includes('not initialized')) {
        errContent = 'AI is still loading — please send your message again in a moment.'
      } else if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
        errContent = 'Rate limit reached. Please wait ~15 seconds before sending another message.'
      } else if (errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Failed')) {
        errContent = 'Network error. Check your connection and try again.'
      } else {
        errContent = `Error: ${errStr.slice(0, 120)}. The session has been reset — please send your message again.`
      }
      // Replace the empty placeholder with the error
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, content: errContent } : m
      ))
    } finally {
      setLoading(false)
      loadingRef.current = false
      // Auto-restart listening if voice mode is still on
      if (voiceModeRef.current) {
        setVoicePhase('idle')
        setTimeout(() => { if (voiceModeRef.current) startListening() }, 500)
      } else {
        setVoicePhase('idle')
      }
    }
  }, [])

  // Keep sendMessageRef pointing to the latest handler every render
  useEffect(() => {
    sendMessageRef.current = handleSendMessage
  }, [handleSendMessage])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSendMessage(input)
  }

  function handleReset() {
    if (!user) return
    const ctx = buildFinancialContext(
      transactions, user.monthlyBudget, user.categoryBudgets, user.userType, user.name
    )
    resetChat(ctx)
    setMessages([{
      id: 'reset',
      role: 'assistant',
      content: "Chat reset! I've refreshed your financial data. What would you like to know?",
      timestamp: new Date(),
    }])
    setShowQuick(true)
  }

  function handleStopAll() {
    stopSpeaking()
    try { recognitionRef.current?.stop() } catch {}
    setVoiceMode(false)
    voiceModeRef.current = false
    setVoicePhase('idle')
  }

  function handleSpeakMessage(content: string) {
    const clean = content.replace(/[#*_`~\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 600)
    setVoicePhase('speaking')
    speakText(clean).then(() => setVoicePhase('idle'))
  }

  const isSpeaking = voicePhase === 'speaking'
  const isListening = voicePhase === 'listening'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-dark-900/60">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center glow-purple">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {loading && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-green rounded-full border-2 border-dark-900 animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">FinWise AI</p>
            <p className="text-xs text-slate-500">Powered by Gemini 2.5</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Voice Mode toggle */}
          <button
            onClick={toggleVoiceMode}
            title={voiceMode ? 'Turn off voice conversation' : 'Turn on voice conversation'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
              voiceMode
                ? 'bg-accent-green/20 text-accent-green border-accent-green/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${voiceMode ? 'animate-pulse' : ''}`} />
            {voiceMode ? 'Voice ON' : 'Voice'}
          </button>

          {/* Stop button when active */}
          {(isSpeaking || isListening) && (
            <button
              onClick={handleStopAll}
              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              title="Stop"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}

          {/* Reset */}
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all" title="Reset chat">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice phase status bar */}
      <AnimatePresence>
        {voicePhase !== 'idle' && (
          <motion.div
            key={voicePhase}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center justify-center gap-2 py-2.5 border-b ${
              voicePhase === 'listening'
                ? 'bg-primary-500/10 border-primary-500/20'
                : voicePhase === 'thinking'
                ? 'bg-accent-purple/10 border-accent-purple/20'
                : 'bg-accent-green/10 border-accent-green/20'
            }`}
          >
            {voicePhase === 'listening' && (
              <>
                <div className="flex items-end gap-0.5 h-4">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="voice-bar w-1 bg-primary-400 rounded-full" style={{ animationDelay: `${(i-1)*0.1}s` }} />
                  ))}
                </div>
                <span className="text-xs text-primary-300 font-medium">Listening — speak now...</span>
              </>
            )}
            {voicePhase === 'thinking' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-accent-purple animate-spin" />
                <span className="text-xs text-accent-purple font-medium">Thinking...</span>
              </>
            )}
            {voicePhase === 'speaking' && (
              <>
                <div className="flex items-end gap-0.5 h-4">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="voice-bar w-1 bg-accent-green rounded-full" style={{ animationDelay: `${(i-1)*0.1}s` }} />
                  ))}
                </div>
                <span className="text-xs text-accent-green font-medium">Speaking...</span>
                <button onClick={handleStopAll} className="text-[10px] text-accent-green/60 hover:text-accent-green underline ml-1">skip</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-primary-500 to-accent-pink'
                  : 'bg-gradient-to-br from-slate-600 to-slate-700'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-600/70 text-white ml-auto'
                  : 'bg-white/5 text-slate-200 border border-white/8'
              }`}>
                {msg.isVoice && (
                  <div className="flex items-center gap-1 mb-1 text-primary-300 text-[10px]">
                    <Mic className="w-2.5 h-2.5" /> Voice
                  </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-xs max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ul>li]:mb-0.5 [&>ol]:mb-2 [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:mb-1 [&>strong]:text-white">
                    {msg.content ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* TTS button for assistant messages */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleSpeakMessage(msg.content)}
                  className="self-end mb-1 p-1 text-slate-600 hover:text-primary-400 transition-colors"
                  title="Read aloud"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl px-3.5 py-3 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 text-primary-400 animate-spin" />
              <span className="text-xs text-slate-400">Analyzing your finances...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {showQuick && !voiceMode && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Quick questions</p>
            <button onClick={() => setShowQuick(false)} className="text-slate-600 hover:text-slate-400">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                className="text-xs px-2.5 py-1 bg-white/5 hover:bg-primary-500/20 hover:text-primary-300 text-slate-400 rounded-lg border border-white/8 hover:border-primary-500/30 transition-all duration-150"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/5">
        {voiceMode ? (
          /* Voice mode — big tap-to-speak button */
          <div className="flex flex-col items-center gap-2 py-1">
            <button
              onClick={voicePhase === 'listening' ? stopListening : startListening}
              disabled={voicePhase === 'thinking' || voicePhase === 'speaking'}
              className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 border ${
                voicePhase === 'listening'
                  ? 'bg-red-500/80 border-red-500/50 text-white animate-pulse'
                  : voicePhase === 'thinking' || voicePhase === 'speaking'
                  ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-primary-600/30 border-primary-500/40 text-primary-200 hover:bg-primary-600/50'
              }`}
            >
              {voicePhase === 'listening' ? (
                <><MicOff className="w-4 h-4" /> Tap to stop</>
              ) : voicePhase === 'thinking' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</>
              ) : voicePhase === 'speaking' ? (
                <><Volume2 className="w-4 h-4" /> Speaking...</>
              ) : (
                <><Mic className="w-4 h-4" /> Tap to speak</>
              )}
            </button>
            <p className="text-[10px] text-slate-600">Auto-listens again after each response</p>
          </div>
        ) : (
          /* Text mode */
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${
                isListening
                  ? 'bg-red-500/80 text-white animate-pulse'
                  : 'bg-white/8 text-slate-400 hover:bg-primary-500/20 hover:text-primary-300 border border-white/10 hover:border-primary-500/30'
              }`}
              title={isListening ? 'Stop listening' : 'Speak to fill input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={loading || isListening}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-500 hover:to-accent-purple text-white rounded-xl transition-all duration-200 shadow-lg flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-slate-600">Powered by Gemini 2.5 Flash · ElevenLabs TTS</p>
          {!voiceMode && (
            <button
              onClick={() => setShowQuick(!showQuick)}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showQuick ? 'Hide' : 'Show'} suggestions
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
