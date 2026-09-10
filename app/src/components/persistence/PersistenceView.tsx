import { ListTree } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import clsx from 'clsx'

const SOURCE_LABEL: Record<string, string> = {
  registry: 'Registro de Windows',
  cron: 'Tarea programada (cron)',
  systemd: 'Servicio systemd',
  launchagent: 'LaunchAgent (macOS)',
  launchdaemon: 'LaunchDaemon (macOS)',
  'startup-folder': 'Carpeta de inicio',
  'shell-profile': 'Perfil de shell',
  'autostart-desktop': 'Autoarranque de escritorio'
}

export function PersistenceView() {
  const snapshot = useAppStore((s) => s.snapshot)
  const items = snapshot?.persistence ?? []

  return (
    <GlassCard strong className="flex h-full flex-col">
      <GlassCardHeader title="Puntos de autoarranque" subtitle="Todo lo que se ejecuta automaticamente al iniciar sesion" icon={<ListTree size={16} />} />
      <div className="flex-1 space-y-2 overflow-auto">
        {items.map((item) => (
          <div key={item.id} className={clsx('rounded-xl border p-3', item.riskScore > 0 ? 'border-aegis-red/25 bg-aegis-red/[0.05]' : 'border-white/[0.06] bg-white/[0.02]')}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-200">{item.name}</p>
              <span className="badge bg-white/[0.06] text-slate-400">{SOURCE_LABEL[item.source] || item.source}</span>
            </div>
            <p className="mt-1 truncate font-mono text-xs text-slate-500">{item.command || 'sin comando registrado'}</p>
            {item.riskReasons.length > 0 && <p className="mt-1 text-xs text-aegis-red">{item.riskReasons.join('. ')}</p>}
          </div>
        ))}
        {items.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No se han detectado puntos de autoarranque todavia.</p>}
      </div>
    </GlassCard>
  )
}
