import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  strong?: boolean
}

export function GlassCard({ children, className, strong, ...rest }: GlassCardProps) {
  return (
    <div className={clsx(strong ? 'glass-panel-strong' : 'glass-panel', 'p-6', className)} {...rest}>
      {children}
    </div>
  )
}
