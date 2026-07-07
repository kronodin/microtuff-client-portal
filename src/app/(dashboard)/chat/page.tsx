'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  body: string | null
  voiceFile: string | null
  from: string
  createdAt: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const res = await fetch('/api/chat')
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 4000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    setText('')
    setLoading(false)
    load()
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('voice', new File([blob], 'voice.webm', { type: 'audio/webm' }))
        await fetch('/api/chat', { method: 'POST', body: fd })
        load()
      }
      mediaRef.current = mr
      mr.start()
      setRecording(true)
    } catch {
      toast.error('Microphone permission denied')
    }
  }

  const stopRec = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center font-black text-navy-900 text-xl">
          M
        </div>
        <div>
          <h1 className="text-xl font-bold text-gold-500">Message Microtuff</h1>
          <p className="text-xs text-slate-400">Text or send a voice note — no app required.</p>
        </div>
      </div>

      <div className="bg-navy-800/70 border border-gold-500/20 rounded-xl h-[55vh] overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-10">No messages yet. Say hi 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                m.from === 'client'
                  ? 'bg-gold-500 text-navy-900 rounded-br-sm'
                  : 'bg-navy-700 text-slate-100 rounded-bl-sm'
              }`}
            >
              {m.body && <p>{m.body}</p>}
              {m.voiceFile && (
                <audio controls src={`/api/chat/media/${m.id}`} className="mt-1 h-8" />
              )}
              <p className="text-[10px] opacity-60 mt-1">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 mt-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message…"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
        <Button
          type="button"
          variant={recording ? 'destructive' : 'outline'}
          onClick={recording ? stopRec : startRec}
        >
          {recording ? 'Stop' : '🎤'}
        </Button>
      </form>
    </div>
  )
}
