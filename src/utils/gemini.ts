import { GoogleGenerativeAI } from '@google/generative-ai'

function getGeminiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
}

const SYSTEM_PROMPT = `You are FinWise AI, a smart personal finance assistant embedded in the FinWise budgeting app. 
You have access to the user's real financial data shown below. 
Be concise, friendly, and insightful. 
When giving monetary amounts, always use $ formatting.
Offer concrete, personalized recommendations based on the data.
Consider the user's type (high school / college / full-time) when calibrating "alarming" spending thresholds.
For high school students, flag anything over $100 as a notable purchase. For college students, flag over $300. For full-time workers, flag over $800.
When asked about plans or summaries, structure the response clearly with bullet points or numbered steps.
When making predictions, mention it's based on current trends.
Keep responses to 3-5 sentences unless a plan or detailed breakdown is requested.
Also, please make sure you are writing any money values in word form and not in numerical form`

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

export async function sendMessage(message: string): Promise<string> {
  if (!chatSession) throw new Error('Chat not initialized. Add your Gemini API key in Settings.')
  const result = await chatSession.sendMessage(message)
  return result.response.text()
}

export function resetChat(financialContext: string) {
  chatSession = null
  initChat(financialContext)
}

export { lastContext }
