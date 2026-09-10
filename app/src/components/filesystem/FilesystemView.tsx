import { FilePlus, FileClock, FileX, Globe2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import clsx from 'clsx'

const TYPE_ICON = { add: FilePlus, change: FileClock, unlink: FileX, addDir: FilePlus, unlinkDir: FileX } as const
const TYPE_LABEL = { add: 'Creado', change: 'Modificado', unlink: 'Eliminado', addDir: 'Carpeta creada', unlinkDir: 'Carpeta eliminada' } as const

export function FilesystemView() {
  const snapshot = useAppStore((s) => s.snapshot)
  const quarantineFile = useAppStore((s) => s.quarantineFile)

  const events = snapshot?.fileEvents ?? []
  const hosts = snapshot?.hosts

  return (
    <div className="grid h-full grid-cols-1 gap-5 xl:grid-cols-3">
      <GlassCard strong className="flex flex-col xl:col-span-2">
        <GlassCardHeader title="Actividad de ficheros" subtitle="Carpetas de usuario y ficheros criticos monitorizados" icon={<FileClock size={16} />} />
        <div className="flex-1 space-y-1 overflow-auto">
          {events.map((e) => {
            const Icon = TYPE_ICON[e.type]
            return (
              <div key={e.id} className={clsx('flex items-center justify-between gap-3 rounded-xl px-3 py-2.5', e.riskScore > 0 ? 'bg-aegis-red/[0.06]' : 'hover:bg-white/[0.03]')}>
                <div className="flex min-w-0 items-center gap-3">
                  <Icon size={16} className={e.riskScore > 0 ? 'text-aegis-red' : 'text-slate-500'} />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{e.path}</p>
                    <p className="text-xs text-slate-500">{TYPE_LABEL[e.type]} · {e.zone === 'critical-system' ? 'fichero critico' : 'datos de usuario'} · {new Date(e.time).toLocaleTimeString()}</p>
                  </div>
                </div>
                {e.riskScore > 0 && (
                  <button onClick={() => quarantineFile(e.path, e.riskReasons[0] || 'Actividad de fichero sospechosa')} className="glass-btn-danger shrink-0 !px-2.5 !py-1 text-xs">
                    Cuarentena
                  </button>
                )}
              </div>
            )
          })}
          {events.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Sin actividad reciente de ficheros.</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader title="Fichero hosts" subtitle="Deteccion de secuestro de DNS local" icon={<Globe2 size={16} />} />
        {hosts && (
          <div className="space-y-3">
            <div className={clsx('flex items-center gap-2 rounded-xl p-3', hosts.tampered ? 'bg-aegis-red/10 text-aegis-red' : 'bg-aegis-green/10 text-aegis-green')}>
              {hosts.tampered ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
              <span className="text-sm font-medium">{hosts.tampered ? 'Modificacion detectada' : 'Integridad verificada'}</span>
            </div>
            <p className="text-xs text-slate-500">Ruta: {hosts.path}</p>
            <p className="text-xs text-slate-500">Ultima comprobacion: {new Date(hosts.lastChecked).toLocaleTimeString()}</p>
            {hosts.suspiciousEntries.length > 0 && (
              <div className="rounded-xl border border-aegis-red/20 bg-aegis-red/5 p-3">
                <p className="mb-1 text-xs font-semibold text-aegis-red">Entradas sospechosas:</p>
                {hosts.suspiciousEntries.map((entry) => (
                  <p key={entry} className="truncate font-mono text-[11px] text-slate-400">{entry}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
