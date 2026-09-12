import { useMemo, useState } from 'react'
import { Ban, Search, Skull, Terminal, Wifi } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import clsx from 'clsx'

function riskColor(score: number) {
  if (score >= 70) return 'text-aegis-red'
  if (score >= 45) return 'text-aegis-amber'
  if (score >= 20) return 'text-aegis-violet'
  return 'text-slate-400'
}

export function ProcessesView() {
  const snapshot = useAppStore((s) => s.snapshot)
  const killProcess = useAppStore((s) => s.killProcess)
  const blockProcessNetwork = useAppStore((s) => s.blockProcessNetwork)
  const [query, setQuery] = useState('')
  const [busyPid, setBusyPid] = useState<number | null>(null)

  const processes = useMemo(() => {
    const list = snapshot?.processes ?? []
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q) || String(p.pid).includes(q))
  }, [snapshot, query])

  const handleKill = async (pid: number) => {
    setBusyPid(pid)
    await killProcess(pid)
    setBusyPid(null)
  }

  const handleBlockNet = async (pid: number) => {
    setBusyPid(pid)
    await blockProcessNetwork(pid)
    setBusyPid(null)
  }

  return (
    <GlassCard strong className="flex h-full flex-col">
      <GlassCardHeader
        title="Procesos en ejecucion"
        subtitle={`${processes.length} procesos monitorizados en tiempo real`}
        icon={<Skull size={16} />}
        action={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, ruta o PID"
              className="w-64 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-aegis-cyan/40"
            />
          </div>
        }
      />
      <div className="flex-1 overflow-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-void-900/95 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Proceso</th>
              <th className="px-4 py-2.5">PID</th>
              <th className="px-4 py-2.5">Usuario</th>
              <th className="px-4 py-2.5">CPU</th>
              <th className="px-4 py-2.5">Memoria</th>
              <th className="px-4 py-2.5">Riesgo</th>
              <th className="px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {processes.map((p) => (
              <tr key={p.pid} className={clsx('transition-colors hover:bg-white/[0.03]', p.riskScore >= 45 && 'bg-aegis-red/[0.04]')}>
                <td className="max-w-[280px] px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-slate-200">{p.name}</p>
                    {p.riskReasons.some((r) => r.includes('LOLBin')) && (
                      <span title="Binario living-off-the-land usado con parametros sospechosos" className="badge shrink-0 bg-aegis-amber/15 text-aegis-amber ring-1 ring-inset ring-aegis-amber/30">
                        <Terminal size={10} /> LOLBin
                      </span>
                    )}
                  </div>
                  <p data-sensitive="true" className="truncate text-xs text-slate-500">{p.path || 'ruta desconocida'}</p>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-slate-400">{p.pid}</td>
                <td className="px-4 py-2.5 text-slate-400">{p.user}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-300">{p.cpu.toFixed(1)}%</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-300">{p.memMb.toFixed(0)} MB</td>
                <td className={clsx('px-4 py-2.5 font-semibold tabular-nums', riskColor(p.riskScore))}>
                  {p.riskScore}
                  {p.riskReasons.length > 0 && <p className="mt-0.5 max-w-[220px] truncate text-[11px] font-normal text-slate-500">{p.riskReasons[0]}</p>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={busyPid === p.pid}
                      onClick={() => handleBlockNet(p.pid)}
                      title="Bloquear red de este proceso"
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-slate-400 hover:border-aegis-amber/40 hover:text-aegis-amber"
                    >
                      <Wifi size={14} />
                    </button>
                    <button
                      disabled={busyPid === p.pid}
                      onClick={() => handleKill(p.pid)}
                      title="Finalizar proceso"
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-slate-400 hover:border-aegis-red/40 hover:text-aegis-red"
                    >
                      <Ban size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  No hay procesos que coincidan con la busqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
