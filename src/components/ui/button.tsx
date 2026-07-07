import * as React from 'react'
import { cn } from '@/lib/utils'

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive'; size?: 'default' | 'sm' | 'lg' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-gold-500 text-navy-900 hover:bg-gold-400',
      outline: 'border border-gold-500/40 text-slate-100 hover:bg-navy-700',
      ghost: 'text-slate-200 hover:bg-navy-700',
      destructive: 'bg-red-600 text-white hover:bg-red-500',
    }
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6 text-lg',
    }
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
export { Button }
