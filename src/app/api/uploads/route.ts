import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { classifyFile, sanitizeFilename, clientDirFor, ALLOWED } from '@/lib/files'
import fs from 'fs/promises'
import path from 'path'

const BASE_UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads')

export async function POST(req: Request) {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file')
  const category = (form.get('category') || 'Other').toString()
  const description = (form.get('description') || '').toString()

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const type = classifyFile(file.name, file.type)
  if (!type) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  const cfg = ALLOWED[type]
  if (buffer.length > cfg.max) {
    return NextResponse.json(
      { error: `File too large. Max ${Math.round(cfg.max / 1048576)}MB for ${type}.` },
      { status: 413 }
    )
  }

  // Store in the client's own project folder: uploads/<phone>/
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  const clientDir = clientDirFor(user?.phone || payload.userId)
  await fs.mkdir(clientDir, { recursive: true })

  const safeName = sanitizeFilename(file.name)
  const storedName = `${Date.now()}-${safeName}`
  await fs.writeFile(path.join(clientDir, storedName), buffer)

  const upload = await prisma.upload.create({
    data: {
      userId: payload.userId,
      filename: storedName,
      originalName: file.name.slice(0, 200),
      mimeType: file.type || 'application/octet-stream',
      size: buffer.length,
      category,
      description: description.slice(0, 500) || null,
      type,
    },
  })

  return NextResponse.json({ ok: true, upload })
}
