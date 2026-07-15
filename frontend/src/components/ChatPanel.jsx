import React, { useState } from 'react'
import { api } from '../lib/api'

const SUGGESTIONS = [
  'What is my weakest server?',
  'What happens if the Redis cache is hacked?',
  'Which subnet should be isolated first?',
  'What should I patch first?',
]

export default function ChatPanel({ sessionId, open, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(question) {
    if (!question.trim() || !sessionId) return
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.ask(sessionId, question)
      setMessages((m) => [...m, { role: 'ai', text: res.answer }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', text: 'Error: ' + e.message }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, bottom: 16, width: 340,
      background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12,
      display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>💬 Ask NetTwin AI</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }} className="scrollbar-thin">
        {messages.length === 0 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              Ask anything about this network. Try:
            </div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', marginBottom: 6,
                  background: 'var(--panel-2)', border: '1px solid var(--border)', color: 'var(--text)',
                  borderRadius: 8, padding: '8px 10px', fontSize: 12,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 10, fontSize: 13, lineHeight: 1.5,
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            color: m.role === 'user' ? 'var(--teal)' : 'var(--text)',
          }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
              {m.role === 'user' ? 'You' : 'NetTwin AI'}
            </div>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analyzing graph…</div>}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Ask a question…"
          style={{
            flex: 1, background: 'var(--panel-2)', border: '1px solid var(--border)', color: 'var(--text)',
            borderRadius: 8, padding: '8px 10px', fontSize: 13,
          }}
        />
        <button onClick={() => send(input)} style={{
          background: 'var(--teal)', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 700,
        }}>Send</button>
      </div>
    </div>
  )
}
