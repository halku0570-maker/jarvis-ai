import { useEffect, useRef, useState } from 'react'

type Status = 'READY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'
type Message = { role: 'user' | 'jarvis'; text: string }

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onend: (() => void) | null
  onerror: ((event: any) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionConstructor | undefined

function speak(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) {
    onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.96
  utterance.pitch = 0.92
  utterance.volume = 1
  utterance.onend = () => onEnd?.()
  window.speechSynthesis.speak(utterance)
}

function App() {
  const [status, setStatus] = useState<Status>('READY')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [supported, setSupported] = useState(Boolean(SpeechRecognition))
  const [wakeArmed, setWakeArmed] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const addMessage = (role: Message['role'], text: string) => {
    setMessages((current) => [...current, { role, text }])
  }

  const askBackend = async (command: string) => {
    setStatus('PROCESSING')
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command }),
      })
      const data = await response.json()
      const answer = data.text || 'I could not complete that request.'
      addMessage('jarvis', answer)
      setStatus('SPEAKING')
      speak(answer, () => setStatus('READY'))
    } catch {
      const answer = 'My AI core is not connected yet. The voice interface is online.'
      addMessage('jarvis', answer)
      setStatus('SPEAKING')
      speak(answer, () => setStatus('READY'))
    }
  }

  const handleTranscript = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    addMessage('user', text)

    const normalized = text.toLowerCase()
    const wakeIndex = normalized.indexOf('jarvis')

    if (wakeArmed && wakeIndex >= 0) {
      const command = text.slice(wakeIndex + 'jarvis'.length).trim().replace(/^[,.:;-]+\s*/, '')
      setStatus('SPEAKING')
      speak('Yes, sir.', () => {
        if (command) {
          void askBackend(command)
        } else {
          setStatus('READY')
        }
      })
      return
    }

    void askBackend(text)
  }

  const toggleListening = () => {
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    if (status === 'LISTENING') {
      recognitionRef.current?.stop()
      setStatus('READY')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results as any)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
      handleTranscript(transcript)
    }
    recognition.onerror = () => setStatus('READY')
    recognition.onend = () => {
      if (status === 'LISTENING') setStatus('READY')
    }
    recognitionRef.current = recognition
    setStatus('LISTENING')
    recognition.start()
  }

  const sendText = () => {
    const command = input.trim()
    if (!command) return
    setInput('')
    handleTranscript(command)
  }

  const statusLabel = status === 'LISTENING' ? 'Listening' : status === 'PROCESSING' ? 'Thinking' : status === 'SPEAKING' ? 'Speaking' : 'Ready'

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">J</span><span>JARVIS</span></div>
        <div className="top-status"><span className="dot" /> SYSTEM ONLINE</div>
      </header>

      <section className="hero">
        <div className={`orb orb-${status.toLowerCase()}`} aria-label={`JARVIS ${statusLabel}`}>
          <div className="orb-ring ring-a" />
          <div className="orb-ring ring-b" />
          <div className="orb-core">J</div>
        </div>
        <div className="eyebrow">PERSONAL AI ASSISTANT</div>
        <h1>Good to see you, sir.</h1>
        <p className="subtitle">Say <strong>“Jarvis”</strong> and give me a command.</p>
        <div className="status-pill"><span className="pulse" /> {statusLabel}</div>
      </section>

      <section className="console">
        <div className="console-head">
          <span>COMMAND CONSOLE</span>
          <label className="wake-toggle"><input type="checkbox" checked={wakeArmed} onChange={(e) => setWakeArmed(e.target.checked)} /> Wake word</label>
        </div>

        <div className="messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty">No commands yet.<br /><span>Try: “Jarvis, hello.”</span></div>
          ) : messages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <span className="message-label">{message.role === 'user' ? 'YOU' : 'JARVIS'}</span>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <div className="input-row">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendText()} placeholder="Type a command..." aria-label="Command" />
          <button className={`mic ${status === 'LISTENING' ? 'active' : ''}`} onClick={toggleListening} aria-label={status === 'LISTENING' ? 'Stop listening' : 'Start listening'}>{status === 'LISTENING' ? '■' : '●'}</button>
          <button className="send" onClick={sendText}>Send</button>
        </div>
        {!supported && <div className="notice">Speech recognition is not available in this browser. Text commands still work.</div>}
      </section>

      <footer>JARVIS CORE v0.1 · Voice interface online · AI core configurable</footer>
    </main>
  )
}

export default App
