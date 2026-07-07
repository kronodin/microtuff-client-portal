import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME, formatPhone } from '@/lib/auth'
import { checkRateLimit, registerAttempt } from '@/lib/rateLimit'

export async function POST(req: Request) {
  const ip = (await headers()).get('x-forwarded-for') || (await headers()).get('x-real-ip') || 'local'
  const limit = checkRateLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const rawPhone = body.phone
  if (!rawPhone || !String(rawPhone).trim()) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
  }

  // Auto-prepend +1 for 10-digit local numbers (US/Canada/Jamaica mobile).
  let phone = formatPhone(rawPhone)
  if (/^\d{10}$/.test(phone)) phone = '+1' + phone

  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    registerAttempt(ip)
    return NextResponse.json({ error: 'Phone number not found in client records' }, { status: 401 })
  }

  const token = signToken({ userId: user.id, phone: user.phone, isAdmin: user.isAdmin })
  const res = NextResponse.json({
    ok: true,
    phone: user.phone,
    name: user.name,
    isAdmin: user.isAdmin,
  })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
