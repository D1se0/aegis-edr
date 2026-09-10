import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  strong?: boolean
}

export function GlassCard({ children, className, strong, ...rest }: GlassCardProps) {
  return (
    <div className={clsx(strong ? 'glass-panel-strong' : 'glass-panel', 'p-5', className)} {...rest}>
      {children}
    </div>
  )
}

export function GlassCardHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-aegis-cyan">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
