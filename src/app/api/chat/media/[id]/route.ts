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
  const msg = await prisma.message.findUnique({ where: { id: id } })
  if (!msg || msg.userId !== payload.userId || !msg.voiceFile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  const dir = clientDirFor(user?.phone || payload.userId)
  try {
    const data = await fs.readFile(path.join(dir, msg.voiceFile))
    return new NextResponse(data, {
      headers: { 'Content-Type': 'audio/webm', 'Content-Disposition': 'inline' },
    })
  } catch {
    return NextResponse.json({ error: 'Missing' }, { status: 404 })
  }
}
