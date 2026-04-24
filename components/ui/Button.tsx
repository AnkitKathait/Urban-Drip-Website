import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'neon'
  size?:    'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

const variants = {
  primary:   'bg-ud-accent text-white hover:bg-[#e01e1e]',
  secondary: 'bg-transparent border border-[#2A2A2A] text-ud-white hover:border-[#444]',
  ghost:     'bg-transparent text-[#888] hover:text-ud-white',
  danger:    'bg-transparent border border-ud-accent text-ud-accent hover:bg-ud-accent hover:text-white',
  neon:      'bg-ud-neon text-ud-black hover:brightness-110',
}

const sizes = {
  sm:   'px-4 py-2 text-xs',
  md:   'px-5 py-2.5 text-sm',
  lg:   'px-7 py-3.5 text-sm',
  icon: 'p-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-heading tracking-[0.12em] rounded-none transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
export { Button }
