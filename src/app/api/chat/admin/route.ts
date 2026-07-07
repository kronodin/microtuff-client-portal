import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin replies to a client message (from admin dashboard).
export async function POST(req: Request) {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const userId = body.userId
  const text = (body.body || '').toString().trim()
  if (!userId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const msg = await prisma.message.create({
    data: { userId, body: text, from: 'admin' },
  })
  return NextResponse.json({ ok: true, message: msg })
}
