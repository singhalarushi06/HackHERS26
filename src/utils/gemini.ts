import { GoogleGenerativeAI } from '@google/generative-ai'

function getGeminiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
}

const SYSTEM_PROMPT = `You are Finnegan, the AI Agent for our FinWise platform. You are a concise personal finance assistant in the FinWise app.
You have the user's real financial data. 
Here are some ground rules:
- Keep responses SHORT: 1-3 sentences max unless a detailed breakdown is explicitly asked for.
- Use bullet points only when listing 3+ items.
- make sure the responses you provide are specific to the user that is asking the question, and not generic advice. For example, if the user asks "How am I doing this month?" you should respond with something specific to their transactions and budget, not general advice about budgeting.
- try not to include emojis, but if you do, keep it to 1 per response and make sure it's relevant.
- Always use $ for amounts.
- When reading numerical data, read it as "X dollars" (e.g. $150 -> "150 dollars"). If there is a decimal, read it as "X dollars and Y cents" (e.g. $23.45 -> "23 dollars and 45 cents").
- Be friendly but direct — no filler phrases like "Great question!".
- Tailor advice to the user's type: high school (flag >$100), college (flag >$300), full-time (flag >$800).
- For predictions, briefly note it's trend-based.
- if you don't know the answer, say you don't know — don't try to guess. Feel free to scrape the web and provide any relevant source `

type ChatSession = ReturnType<ReturnType<typeof GoogleGenerativeAI.prototype.getGenerativeModel>['startChat']>
let chatSession: ChatSession | null = null
let lastContext = ''

export function initChat(financialContext: string) {
  const key = getGeminiKey()
  if (!key) throw new Error('NO_KEY')
  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  lastContext = financialContext
  chatSession = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\nHere is my current financial data:\n\n${financialContext}\n\nPlease acknowledge you have my data and are ready to help.` }],
      },
      {
        role: 'model',
        parts: [{ text: "Got it! I've loaded your financial data and I'm ready to help you with insights, summaries, recommendations, and spending plans. What would you like to know?" }],
      },
    ],
  })
}

// Ensure chat is ready — reinit from lastContext if session was lost
function ensureChat() {
  if (!chatSession) {
    if (!lastContext) throw new Error('NO_KEY')
    initChat(lastContext)
  }
}

export async function sendMessage(message: string): Promise<string> {
  if (!chatSession) throw new Error('NO_KEY')
  const result = await chatSession.sendMessage(message)
  return result.response.text()
}

function isRateLimit(err: unknown): boolean {
  const s = String(err)
  return s.includes('429') || s.includes('RESOURCE_EXHAUSTED') || s.includes('quota')
}

export async function streamMessage(
  message: string,
  onChunk: (chunk: string) => void,
  retries = 3,
  delayMs = 5000
): Promise<string> {
  ensureChat()
  let full = ''
  try {
    const result = await chatSession!.sendMessageStream(message)
    for await (const chunk of result.stream) {
      const text = chunk.text()
      full += text
      onChunk(text)
    }
    return full
  } catch (err) {
    if (isRateLimit(err) && retries > 0) {
      // Rate limited — wait and retry without resetting the session
      await new Promise(res => setTimeout(res, delayMs))
      return streamMessage(message, onChunk, retries - 1, delayMs * 1.5)
    }
    // Non-rate-limit error: reset the session so the next call starts fresh
    chatSession = null
    throw err
  }
}

export function resetChat(financialContext: string) {
  chatSession = null
  initChat(financialContext)
}

export { lastContext }
