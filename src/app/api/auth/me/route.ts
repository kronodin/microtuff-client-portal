import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ user: null }, { status: 200 })
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  return NextResponse.json({
    user: { id: user.id, phone: user.phone, name: user.name, isAdmin: user.isAdmin },
  })
}
