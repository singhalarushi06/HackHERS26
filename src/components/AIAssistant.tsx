import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendMessage, resetChat, initChat } from '../utils/gemini'
import { speakText, stopSpeaking } from '../utils/elevenlabs'
import { buildFinancialContext } from '../utils/spending'
import { ChatMessage } from '../types'
import {
  Sparkles, Send, Mic, MicOff, Volume2, VolumeX,
  RotateCcw, Loader2, Bot, User, ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
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
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    const SR: typeof SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from({ length: event.results.length }, (_, i) => event.results[i])
        .map((r) => r[0].transcript)
        .join('')
      setInput(transcript)
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false)
        handleSendMessage(transcript, true)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
  }, [])

  function startListening() {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in your browser. Please use Chrome.')
      return
    }
    try {
      recognitionRef.current.start()
      setIsListening(true)
      setInput('')
    } catch {}
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handleSendMessage = useCallback(async (text: string, fromVoice = false) => {
    if (!text.trim() || loading) return

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
    setShowQuick(false)

    try {
      const response = await sendMessage(text.trim())
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Auto-speak if voice mode is on
      if (autoSpeak || fromVoice) {
        setIsSpeaking(true)
        // Clean markdown for speech
        const cleanText = response
          .replace(/[#*_`~\[\]]/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 500) // limit speech length
        await speakText(cleanText)
        setIsSpeaking(false)
      }
    } catch (err) {
      const errStr = String(err)
      let errContent = `❌ Something went wrong: ${errStr}. Please try again.`
      if (errStr.includes('NO_KEY') || errStr.includes('API key')) {
        errContent = '❌ AI service is temporarily unavailable. Please try again later.'
      }
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }, [loading, autoSpeak])

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

  function handleStopSpeak() {
    stopSpeaking()
    setIsSpeaking(false)
  }

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
          {/* Auto-speak toggle */}
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
            className={`p-1.5 rounded-lg transition-all ${autoSpeak ? 'bg-accent-green/20 text-accent-green' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Stop speaking */}
          {isSpeaking && (
            <button onClick={handleStopSpeak} className="p-1.5 rounded-lg bg-accent-orange/20 text-accent-orange" title="Stop speaking">
              <VolumeX className="w-4 h-4" />
            </button>
          )}

          {/* Reset */}
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all" title="Reset chat">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice wave indicator */}
      {isListening && (
        <div className="flex items-center justify-center gap-1 py-2 bg-primary-500/10 border-b border-primary-500/20">
          <div className="flex items-end gap-0.5 h-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="voice-bar w-1 bg-primary-400 rounded-full" style={{ animationDelay: `${(i-1)*0.1}s` }} />
            ))}
          </div>
          <span className="text-xs text-primary-300 ml-1">Listening...</span>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2 py-2 bg-accent-green/10 border-b border-accent-green/20">
          <div className="flex items-end gap-0.5 h-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="voice-bar w-1 bg-accent-green rounded-full" style={{ animationDelay: `${(i-1)*0.1}s` }} />
            ))}
          </div>
          <span className="text-xs text-accent-green">Speaking...</span>
        </div>
      )}

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
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                  onClick={() => {
                    const clean = msg.content.replace(/[#*_`~\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 500)
                    setIsSpeaking(true)
                    speakText(clean).then(() => setIsSpeaking(false))
                  }}
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
      {showQuick && (
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Voice button */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${
              isListening
                ? 'bg-red-500/80 text-white glow-purple animate-pulse'
                : 'bg-white/8 text-slate-400 hover:bg-primary-500/20 hover:text-primary-300 border border-white/10 hover:border-primary-500/30'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
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

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-slate-600">Powered by Gemini 2.5 Flash · ElevenLabs TTS</p>
          <button
            onClick={() => setShowQuick(!showQuick)}
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            {showQuick ? 'Hide' : 'Show'} suggestions
          </button>
        </div>
      </div>
    </div>
  )
}
