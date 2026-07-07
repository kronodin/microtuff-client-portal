import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clientDirFor } from '@/lib/files'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await prisma.message.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'asc' },
  })
  // Mark admin messages as read by client
  await prisma.message.updateMany({
    where: { userId: payload.userId, from: 'admin', read: false },
    data: { read: true },
  })
  return NextResponse.json({ messages })
}

export async function POST(req: Request) {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''
  let body = null
  let voiceFile = null

  if (contentType.includes('application/json')) {
    const json = await req.json().catch(() => ({}))
    body = json.body || null
  } else {
    const form = await req.formData().catch(() => null)
    if (form) {
      body = (form.get('body') || '').toString() || null
      const file = form.get('voice')
      if (file && typeof file !== 'string') {
        const buffer = Buffer.from(await file.arrayBuffer())
        if (buffer.length > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'Voice note too large (max 10MB)' }, { status: 413 })
        }
        const user = await prisma.user.findUnique({ where: { id: payload.userId } })
        const dir = clientDirFor(user?.phone || payload.userId)
        await fs.mkdir(dir, { recursive: true })
        const safe = `${Date.now()}-voice.webm`
        await fs.writeFile(path.join(dir, safe), buffer)
        voiceFile = safe
      }
    }
  }

  if (!body && !voiceFile) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }

  const msg = await prisma.message.create({
    data: { userId: payload.userId, body, voiceFile, from: 'client' },
  })
  return NextResponse.json({ ok: true, message: msg })
}
