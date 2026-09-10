import type { ReactNode } from 'react'
import clsx from 'clsx'

export function StatTile({
  label,
  value,
  unit,
  icon,
  accent = 'cyan',
  children
}: {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  accent?: 'cyan' | 'violet' | 'amber' | 'green' | 'red'
  children?: ReactNode
}) {
  const accentClasses: Record<string, string> = {
    cyan: 'text-aegis-cyan',
    violet: 'text-aegis-violet',
    amber: 'text-aegis-amber',
    green: 'text-aegis-green',
    red: 'text-aegis-red'
  }

  return (
    <div className="glass-panel flex flex-col justify-between p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {icon && <span className={clsx('opacity-80', accentClasses[accent])}>{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={clsx('text-2xl font-bold tabular-nums', accentClasses[accent])}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {children}
    </div>
  )
}
