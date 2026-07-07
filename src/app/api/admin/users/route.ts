import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, formatPhone } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clientDirFor } from '@/lib/files'
import fs from 'fs/promises'

export async function POST(req: Request) {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !payload.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  let phone = formatPhone(body.phone || '')
  if (/^\d{10}$/.test(phone)) phone = '+1' + phone
  if (!/^\+\d{8,15}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })
  }
  const existing = await prisma.user.findUnique({ where: { phone } })
  if (existing) return NextResponse.json({ error: 'Phone already exists' }, { status: 409 })

  const user = await prisma.user.create({
    data: { phone, name: body.name || null, isAdmin: !!body.isAdmin },
  })
  // Always create an isolated project folder for the new client.
  await fs.mkdir(clientDirFor(phone), { recursive: true })
  return NextResponse.json({ ok: true, user })
}
