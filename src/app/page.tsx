import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export default async function Home() {
  const token = (await cookies()).get('mt_session')?.value
  const payload = token ? verifyToken(token) : null
  if (payload) redirect(payload.isAdmin ? '/admin' : '/dashboard')
  redirect('/login')
}
