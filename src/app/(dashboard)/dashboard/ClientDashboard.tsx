'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

interface UploadItem {
  id: string
  originalName: string
  size: number
  category: string
  description: string | null
  type: string
  status: string
  thumbnail: string | null
  createdAt: string
}

export default function ClientDashboard({
  phone,
  name,
  initialUploads,
}: {
  phone: string
  name: string | null
  initialUploads: UploadItem[]
}) {
  const CATEGORIES = ['ID Proof', 'Address Proof', 'Photo', 'Video Evidence', 'Contract', 'Other']
  const [uploads, setUploads] = useState(initialUploads)
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cat, setCat] = useState('Other')
  const [desc, setDesc] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [preview, setPreview] = useState<UploadItem | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setProgress(0)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', cat)
      fd.append('description', desc)
      try {
        const res = await fetch('/api/uploads', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Upload failed')
          continue
        }
        setUploads((u) => [data.upload, ...u])
        toast.success(`${file.name} uploaded`)
      } catch {
        toast.error('Network error')
      }
    }
    setProgress(100)
    setUploading(false)
    setDesc('')
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    uploadFiles(e.dataTransfer.files)
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUploads((u) => u.filter((x) => x.id !== id))
      toast.success('Deleted')
    } else toast.error('Delete failed')
  }

  const filtered = uploads.filter((u: UploadItem) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.originalName.toLowerCase().includes(q) || (u.description || '').toLowerCase().includes(q)
    const matchFilter = filter === 'All' || u.category === filter
    return matchSearch && matchFilter
  })

  const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)
  const thumb = (u: UploadItem) =>
    u.type === 'image'
      ? `/api/uploads/${u.id}`
      : u.type === 'video'
      ? u.thumbnail
        ? `/api/uploads/${u.id}?thumb=1`
        : '🎬'
      : '📄'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gold-500">Welcome{name ? `, ${name}` : ''}</h1>
        <p className="text-slate-400 text-sm">Signed in as {phone}</p>
      </div>

      {/* Upload area */}
      <Card>
        <div className="p-5 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              drag ? 'border-gold-500 bg-navy-700/40' : 'border-gold-500/30 hover:border-gold-500/60'
            }`}
          >
            <p className="text-slate-300">Drag & drop files here, or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">PDF/DOCX, JPG/PNG/GIF/WEBP, MP4/MOV/AVI · 10MB docs/images · 100MB video</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>

          {uploading && (
            <div className="h-2 bg-navy-900 rounded-full overflow-hidden">
              <div className="h-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </Card>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="flex-1" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-48">
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      {/* Gallery */}
      {filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-10">No files yet. Upload something above.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <Card key={u.id} className="overflow-hidden">
              <div
                className="h-32 bg-navy-900/60 flex items-center justify-center text-4xl cursor-pointer"
                onClick={() => setPreview(u)}
              >
                {thumb(u)}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-100 truncate">{u.originalName}</p>
                <p className="text-xs text-slate-400">
                  {fmtSize(u.size)} · {u.category} · {new Date(u.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setPreview(u)}>View</Button>
                  <a href={`/api/uploads/${u.id}?download=1`}>
                    <Button size="sm" variant="outline">Download</Button>
                  </a>
                  <Button size="sm" variant="destructive" onClick={() => remove(u.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-navy-800 rounded-xl max-w-2xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gold-500 truncate">{preview.originalName}</h3>
              <button onClick={() => setPreview(null)} className="text-slate-300 text-2xl leading-none">×</button>
            </div>
            <div className="bg-navy-900 rounded-lg flex items-center justify-center max-h-[60vh] overflow-hidden">
              {preview.type === 'image' && (
                <img src={`/api/uploads/${preview.id}`} alt={preview.originalName} className="max-h-[60vh] object-contain" />
              )}
              {preview.type === 'video' && (
                <video src={`/api/uploads/${preview.id}`} controls className="max-h-[60vh]" />
              )}
              {preview.type === 'document' && (
                <a href={`/api/uploads/${preview.id}`} target="_blank" className="text-gold-500 underline p-10">
                  Open document
                </a>
              )}
            </div>
            {preview.description && <p className="text-sm text-slate-300 mt-3">{preview.description}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
