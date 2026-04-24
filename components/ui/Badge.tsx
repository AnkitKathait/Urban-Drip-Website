import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'accent' | 'neon' | 'gold' | 'purple' | 'blue' | 'orange' | 'muted'
  className?: string
}

const variants = {
  accent: 'bg-ud-accent/20 text-ud-accent border-ud-accent/40',
  neon:   'bg-ud-neon/20 text-ud-neon border-ud-neon/40',
  gold:   'bg-ud-gold/20 text-ud-gold border-ud-gold/40',
  purple: 'bg-ud-purple/20 text-ud-purple border-ud-purple/40',
  blue:   'bg-ud-blue/20 text-ud-blue border-ud-blue/40',
  orange: 'bg-ud-orange/20 text-ud-orange border-ud-orange/40',
  muted:  'bg-ud-gray text-ud-muted border-ud-gray',
}

export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-mono border rounded-sm', variants[variant], className)}>
      {children}
    </span>
  )
}
