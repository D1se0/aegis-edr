import { BellRing, Check, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import clsx from 'clsx'

export function AlertsView() {
  const snapshot = useAppStore((s) => s.snapshot)
  const acknowledgeAlert = useAppStore((s) => s.acknowledgeAlert)
  const clearAlerts = useAppStore((s) => s.clearAlerts)

  const alerts = snapshot?.alerts ?? []
  const active = alerts.filter((a) => !a.acknowledged).length

  return (
    <GlassCard strong className="flex h-full flex-col">
      <GlassCardHeader
        title="Centro de alertas"
        subtitle={`${active} alertas activas de ${alerts.length} registradas`}
        icon={<BellRing size={16} />}
        action={
          active > 0 && (
            <button onClick={() => clearAlerts()} className="glass-btn text-xs">
              <Check size={13} /> Marcar todo como leido
            </button>
          )
        }
      />
      <div className="flex-1 space-y-2 overflow-auto">
        {alerts.map((a) => (
          <div key={a.id} className={clsx('flex items-start justify-between gap-3 rounded-xl border p-3', a.acknowledged ? 'border-white/[0.05] bg-white/[0.01] opacity-60' : 'border-white/[0.08] bg-white/[0.03]')}>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <SeverityBadge severity={a.severity} />
                <span className="text-[11px] uppercase tracking-wide text-slate-600">{a.category}</span>
                {a.autoBlocked && <span className="badge bg-aegis-cyan/10 text-aegis-cyan">Accion aplicada</span>}
              </div>
              <p className="text-sm font-medium text-slate-200">{a.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{a.message}</p>
              <p className="mt-1 text-[11px] text-slate-600">{new Date(a.time).toLocaleString()}</p>
            </div>
            {!a.acknowledged && (
              <button onClick={() => acknowledgeAlert(a.id)} title="Marcar como resuelta" className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-slate-400 hover:border-aegis-green/40 hover:text-aegis-green">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {alerts.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Sin alertas registradas.</p>}
      </div>
    </GlassCard>
  )
}
