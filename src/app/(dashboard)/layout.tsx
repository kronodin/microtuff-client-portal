import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 border-b-2 border-gold-500 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-500 to-gold-400 p-1 flex items-center justify-center">
              <img src="/microtuff-logo.png" alt="Microtuff Solutions" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-extrabold text-gold-500 text-base leading-none">MICROTUFF SOLUTIONS</div>
              <div className="text-[10px] tracking-[0.2em] text-sky-200 uppercase">Client Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 hidden sm:inline">{user.phone}</span>
            <form action="/api/auth/logout" method="post">
              <button className="bg-gold-500 text-navy-900 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-gold-400">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">{children}</main>
      <footer className="bg-navy-900 border-t border-gold-500/30 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-slate-400 text-sm">
          Microtuff Solutions · mrmicrotuff@programmer.net · +1 (770) 580-3927
          <br />
          <a href="/chat" className="text-gold-500 hover:underline font-semibold">
            💬 Message Microtuff — chat or send a voice note (no app needed)
          </a>
        </div>
      </footer>
    </div>
  )
}
