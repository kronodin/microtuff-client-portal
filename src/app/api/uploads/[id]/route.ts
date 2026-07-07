import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clientDirFor } from '@/lib/files'
import fs from 'fs/promises'
import path from 'path'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const upload = await prisma.upload.findUnique({ where: { id } })
  if (!upload || upload.userId !== payload.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  const clientDir = clientDirFor(user?.phone || payload.userId)

  const url = new URL(req.url)
  const wantThumb = url.searchParams.get('thumb') === '1'
  if (wantThumb && upload.thumbnail) {
    try {
      const data = await fs.readFile(path.join(clientDir, upload.thumbnail))
      return new NextResponse(data, {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' },
      })
    } catch {
      /* fall through to main file */
    }
  }

  try {
    const data = await fs.readFile(path.join(clientDir, upload.filename))
    const disposition = url.searchParams.get('download') ? 'attachment' : 'inline'
    return new NextResponse(data, {
      headers: {
        'Content-Type': upload.mimeType,
        'Content-Disposition': `${disposition}; filename="${upload.originalName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'File missing on disk' }, { status: 404 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const upload = await prisma.upload.findUnique({ where: { id } })
  if (!upload || upload.userId !== payload.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.upload.delete({ where: { id } })
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  const clientDir = clientDirFor(user?.phone || payload.userId)
  try {
    await fs.unlink(path.join(clientDir, upload.filename))
  } catch {
    /* file may already be gone */
  }
  return NextResponse.json({ ok: true })
}
