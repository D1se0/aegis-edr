import clsx from 'clsx'
import type { Severity } from '@shared/types'

const CONFIG: Record<Severity, { label: string; classes: string }> = {
  critical: { label: 'Critico', classes: 'bg-aegis-red/15 text-aegis-red ring-1 ring-inset ring-aegis-red/30' },
  high: { label: 'Alto', classes: 'bg-aegis-amber/15 text-aegis-amber ring-1 ring-inset ring-aegis-amber/30' },
  medium: { label: 'Medio', classes: 'bg-aegis-violet/15 text-aegis-violet ring-1 ring-inset ring-aegis-violet/30' },
  low: { label: 'Bajo', classes: 'bg-aegis-blue/15 text-aegis-blue ring-1 ring-inset ring-aegis-blue/30' },
  info: { label: 'Info', classes: 'bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-500/30' }
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const cfg = CONFIG[severity]
  return <span className={clsx('badge', cfg.classes, className)}>{cfg.label}</span>
}
