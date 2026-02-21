function getElevenKey(): string {
  return (
    localStorage.getItem('fw_eleven_key') ||
    (import.meta.env.VITE_ELEVENLABS_API_KEY as string) ||
    ''
  )
}

// Sarah - Mature, Reassuring, Confident (confirmed working voice)
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'

export async function speakText(text: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': getElevenKey(),
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
      }
    )

    if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`)

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
  } catch (err) {
    // Fallback to browser TTS
    console.warn('ElevenLabs failed, using browser TTS:', err)
    return browserSpeak(text)
  }
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
