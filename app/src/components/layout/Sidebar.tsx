import clsx from 'clsx'
import {
  LayoutDashboard,
  Cpu,
  Network,
  FolderLock,
  ListTree,
  BellRing,
  ShieldAlert,
  Settings,
  ShieldHalf,
  type LucideIcon
} from 'lucide-react'
import { useAppStore, type Section } from '@/store/useAppStore'

const NAV: Array<{ id: Section; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Panel general', icon: LayoutDashboard },
  { id: 'processes', label: 'Procesos', icon: Cpu },
  { id: 'network', label: 'Red', icon: Network },
  { id: 'filesystem', label: 'Ficheros', icon: FolderLock },
  { id: 'persistence', label: 'Autoarranque', icon: ListTree },
  { id: 'alerts', label: 'Alertas', icon: BellRing },
  { id: 'quarantine', label: 'Cuarentena', icon: ShieldAlert },
  { id: 'settings', label: 'Ajustes', icon: Settings }
]

export function Sidebar() {
  const section = useAppStore((s) => s.section)
  const setSection = useAppStore((s) => s.setSection)
  const snapshot = useAppStore((s) => s.snapshot)
  const activeAlerts = snapshot?.alerts.filter((a) => !a.acknowledged).length ?? 0

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-white/[0.06] bg-black/10 p-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 px-2 py-3">
        <ShieldHalf className="text-aegis-cyan" size={20} />
        <div>
          <p className="text-sm font-bold text-slate-100">Aegis EDR</p>
          <p className="text-[11px] text-slate-500">Deteccion &amp; respuesta</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSection(id)} className={clsx('sidebar-link', section === id && 'sidebar-link-active')}>
            <Icon size={17} />
            <span className="flex-1 text-left">{label}</span>
            {id === 'alerts' && activeAlerts > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-aegis-red/90 px-1 text-[10px] font-bold text-white">
                {activeAlerts}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="glass-panel mt-2 flex items-center gap-2 p-3">
        <span className={clsx('h-2 w-2 rounded-full', snapshot?.protection.realtimeMonitoring ? 'bg-aegis-green animate-pulse' : 'bg-slate-500')} />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-300">{snapshot?.vitals.hostname || 'equipo-local'}</p>
          <p className="truncate text-[11px] text-slate-500">{snapshot?.vitals.distro || 'Detectando SO...'}</p>
        </div>
      </div>
    </aside>
  )
}
