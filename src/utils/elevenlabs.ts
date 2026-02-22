export const ELEVEN_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Mature · Reassuring · Confident' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm · Soft · American' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep · Professional · Male' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Warm · British · Female' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Confident · Friendly · Male' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Expressive · Youthful · Female' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Lively · Dynamic · American' },
] as const

export type ElevenVoiceId = typeof ELEVEN_VOICES[number]['id']

const VOICE_STORAGE_KEY = 'fw_eleven_voice'

export function getSelectedVoiceId(): string {
  return localStorage.getItem(VOICE_STORAGE_KEY) || ELEVEN_VOICES[0].id
}

export function setSelectedVoiceId(id: string) {
  localStorage.setItem(VOICE_STORAGE_KEY, id)
}

function getElevenKeys(): string[] {
  const envKey = (import.meta.env.VITE_ELEVENLABS_API_KEY as string) || ''
  return envKey ? [envKey] : []
}

async function tryTTS(text: string, key: string, voiceId: string): Promise<Response> {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  })
}

export async function speakText(text: string): Promise<void> {
  const keys = getElevenKeys()
  const voiceId = getSelectedVoiceId()

  for (const key of keys) {
    try {
      const response = await tryTTS(text, key, voiceId)
      if (!response.ok) {
        continue // try next key
      }

      const buffer = await response.arrayBuffer()
      const audioCtx = new AudioContext()
      const decoded = await audioCtx.decodeAudioData(buffer)
      const source = audioCtx.createBufferSource()
      source.buffer = decoded
      source.connect(audioCtx.destination)
      source.start(0)

      return new Promise((resolve) => {
        source.onended = () => {
          audioCtx.close()
          resolve()
        }
      })
    } catch {
      continue // try next key
    }
  }

  // All keys failed — fallback to browser TTS
  console.warn('ElevenLabs TTS unavailable, using browser TTS')
  return browserSpeak(text)
}

export function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.05
    utterance.volume = 1
    // Pick a more natural voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) => v.lang === 'en-US' && (v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Alex'))
    )
    if (preferred) utterance.voice = preferred
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  window.speechSynthesis.cancel()
}
