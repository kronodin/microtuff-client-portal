import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ClientDashboard from './ClientDashboard'

export default async function DashboardPage() {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { uploads: { orderBy: { createdAt: 'desc' } } },
  })
  if (!user) redirect('/login')

  const uploads = user.uploads.map((u: any) => ({
    id: u.id,
    originalName: u.originalName,
    size: u.size,
    category: u.category,
    description: u.description,
    type: u.type,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  }))

  return <ClientDashboard phone={user.phone} name={user.name} initialUploads={uploads} />
}
