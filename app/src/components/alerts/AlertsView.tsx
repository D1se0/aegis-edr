import { useEffect, useState } from 'react'
import { BellRing, Check, GitBranch, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getAegisApi } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { Tabs } from '@/components/ui/Tabs'
import clsx from 'clsx'
import type { Incident } from '@shared/types'

function IncidentsPanel() {
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    getAegisApi().listIncidents().then(setIncidents)
  }, [])

  if (incidents.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Sin incidentes correlacionados todavia. Cuando varias alertas relacionadas ocurran en poco tiempo, apareceran aqui agrupadas como una cadena de ataque.</p>
  }

  return (
    <div className="space-y-3">
      {incidents.map((inc) => (
        <div key={inc.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={inc.severity} />
              <p className="text-sm font-semibold text-slate-200">{inc.title}</p>
            </div>
            <span className="text-[11px] text-slate-500">{new Date(inc.startedAt).toLocaleString()}</span>
          </div>
          <ol className="ml-1 space-y-1.5 border-l border-white/[0.08] pl-4">
            {inc.events.map((ev, i) => (
              <li key={ev.alertId + i} className="relative text-xs text-slate-400">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-aegis-cyan" />
                <span className="text-slate-600">{new Date(ev.time).toLocaleTimeString()}</span> — {ev.summary}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

export function AlertsView() {
  const snapshot = useAppStore((s) => s.snapshot)
  const acknowledgeAlert = useAppStore((s) => s.acknowledgeAlert)
  const clearAlerts = useAppStore((s) => s.clearAlerts)
  const [tab, setTab] = useState<'alerts' | 'incidents'>('alerts')

  const alerts = snapshot?.alerts ?? []
  const active = alerts.filter((a) => !a.acknowledged).length

  return (
    <GlassCard strong className="flex h-full flex-col">
      <GlassCardHeader
        title="Centro de alertas"
        subtitle={`${active} alertas activas de ${alerts.length} registradas`}
        icon={<BellRing size={16} />}
        action={
          <div className="flex items-center gap-2">
            <Tabs
              value={tab}
              onChange={setTab}
              options={[
                { id: 'alerts', label: 'Alertas' },
                { id: 'incidents', label: 'Incidentes' }
              ]}
            />
            {tab === 'alerts' && active > 0 && (
              <button onClick={() => clearAlerts()} className="glass-btn text-xs">
                <Check size={13} /> Marcar todo como leido
              </button>
            )}
          </div>
        }
      />
      <div className="flex-1 space-y-2 overflow-auto">
        {tab === 'incidents' && <IncidentsPanel />}
        {tab === 'alerts' &&
          alerts.map((a) => (
            <div key={a.id} className={clsx('flex items-start justify-between gap-3 rounded-xl border p-3', a.acknowledged ? 'border-white/[0.05] bg-white/[0.01] opacity-60' : 'border-white/[0.08] bg-white/[0.03]')}>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <SeverityBadge severity={a.severity} />
                  <span className="text-[11px] uppercase tracking-wide text-slate-600">{a.category}</span>
                  {a.autoBlocked && <span className="badge bg-aegis-cyan/10 text-aegis-cyan">Accion aplicada</span>}
                  {a.mitreTechniques?.map((t) => (
                    <span key={t} title="Tecnica MITRE ATT&CK" className="badge bg-white/[0.06] text-slate-400 ring-1 ring-inset ring-white/10">
                      <GitBranch size={10} /> {t}
                    </span>
                  ))}
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
        {tab === 'alerts' && alerts.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Sin alertas registradas.</p>}
      </div>
    </GlassCard>
  )
}
