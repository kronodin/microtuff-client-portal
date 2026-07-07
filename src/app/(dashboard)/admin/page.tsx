import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminPanel from './AdminPanel'

export default async function AdminPage() {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || !payload.isAdmin) redirect('/login')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { uploads: true, messages: true } } },
  })
  const uploads = await prisma.upload.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { user: { select: { phone: true, name: true } } },
  })
  const messages = await prisma.message.findMany({
    where: { from: 'client', read: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { phone: true, name: true } } },
  })

  return (
    <AdminPanel
      users={users.map((u: any) => ({
        id: u.id, phone: u.phone, name: u.name, isAdmin: u.isAdmin,
        uploadCount: u._count.uploads, messageCount: u._count.messages,
      }))}
      uploads={uploads.map((up: any) => ({
        id: up.id, originalName: up.originalName, category: up.category, type: up.type,
        size: up.size, createdAt: up.createdAt.toISOString(),
        phone: up.user.phone, name: up.user.name,
      }))}
      messages={messages.map((m: any) => ({
        id: m.id, body: m.body, voiceFile: m.voiceFile, userId: m.userId,
        phone: m.user.phone, name: m.user.name, createdAt: m.createdAt.toISOString(),
      }))}
      adminPhone={payload.phone}
    />
  )
}
