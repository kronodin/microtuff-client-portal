'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserRow {
  id: string
  phone: string
  name: string | null
  isAdmin: boolean
  uploadCount: number
  messageCount: number
}
interface UploadRow {
  id: string
  originalName: string
  category: string
  type: string
  size: number
  createdAt: string
  phone: string
  name: string | null
}
interface MessageRow {
  id: string
  body: string | null
  voiceFile: string | null
  userId: string
  phone: string
  name: string | null
  createdAt: string
}

export default function AdminPanel({
  users,
  uploads,
  messages,
  adminPhone,
}: {
  users: UserRow[]
  uploads: UploadRow[]
  messages: MessageRow[]
  adminPhone: string
}) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [tab, setTab] = useState('users')

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, isAdmin }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Added ${phone}`)
      setPhone(''); setName(''); setIsAdmin(false)
    } else toast.error(data.error || 'Failed')
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/chat/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: replyTo, body: replyText }),
    })
    if (res.ok) {
      toast.success('Replied')
      setReplyTo(null); setReplyText('')
    } else toast.error('Reply failed')
  }

  const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-500">Admin Dashboard</h1>
        <span className="text-sm text-slate-400">{adminPhone}</span>
      </div>

      <div className="flex gap-2 border-b border-gold-500/20 pb-2">
        {['users', 'uploads', 'messages'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize ${
              tab === t ? 'bg-gold-500 text-navy-900' : 'text-slate-300 hover:bg-navy-700'
            }`}
          >
            {t} {t === 'messages' && `(${messages.length})`}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <Card>
          <CardHeader><CardTitle>Add Client</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (e.g. +187****1234)" />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} /> Admin
              </label>
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-gold-500/20">
                    <th className="py-2">Phone</th><th>Name</th><th>Uploads</th><th>Messages</th><th>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-navy-700/50">
                      <td className="py-2 text-slate-100">{u.phone}</td>
                      <td className="text-slate-300">{u.name || '—'}</td>
                      <td className="text-slate-300">{u.uploadCount}</td>
                      <td className="text-slate-300">{u.messageCount}</td>
                      <td className="text-gold-500">{u.isAdmin ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'uploads' && (
        <Card>
          <CardContent className="pt-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-gold-500/20">
                    <th className="py-2">Client</th><th>File</th><th>Category</th><th>Size</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.id} className="border-b border-navy-700/50">
                      <td className="py-2 text-slate-100">{u.phone} {u.name ? `(${u.name})` : ''}</td>
                      <td className="text-slate-300">{u.originalName}</td>
                      <td className="text-slate-300">{u.category}</td>
                      <td className="text-slate-300">{fmtSize(u.size)}</td>
                      <td className="text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'messages' && (
        <div className="space-y-3">
          {messages.length === 0 && <p className="text-slate-500 text-center py-10">No unread client messages.</p>}
          {messages.map((m) => (
            <Card key={m.id}>
              <CardContent className="py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gold-500 font-semibold">{m.phone} {m.name ? `(${m.name})` : ''}</span>
                  <span className="text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-100 mt-1">{m.body || (m.voiceFile ? '🎤 Voice note' : '')}</p>
                {m.voiceFile && (
                  <audio controls src={`/api/chat/media/${m.id}`} className="mt-2 h-9" />
                )}
                {replyTo === m.id ? (
                  <form onSubmit={sendReply} className="flex gap-2 mt-2">
                    <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply…" />
                    <Button type="submit" size="sm">Send</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
                  </form>
                ) : (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setReplyTo(m.id)}>
                    Reply
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
