import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { uploads: true } } },
  })
  const uploads = await prisma.upload.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { phone: true, name: true } } },
  })
  return NextResponse.json({ users, uploads })
}
