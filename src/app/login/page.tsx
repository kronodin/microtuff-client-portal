'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return toast.error('Enter your phone number')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        setLoading(false)
        return
      }
      toast.success(`Welcome, ${data.name || data.phone}`)
      router.push(data.isAdmin ? '/admin' : '/dashboard')
      router.refresh()
    } catch {
      toast.error('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center font-black text-navy-900 text-2xl mb-3">
            M
          </div>
          <CardTitle className="text-2xl">Microtuff Client Portal</CardTitle>
          <p className="text-sm text-slate-400 mt-1">Enter your phone number to sign in</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 876 885 1041"
                inputMode="tel"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">US/Jamaica: type 10 digits, we add +1. Or include + and country code.</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-xs text-slate-500 text-center">
            Demo: Nash Tech → 8768851041
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
