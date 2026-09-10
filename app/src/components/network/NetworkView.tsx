import { useState } from 'react'
import { Ban, CheckCircle2, Network, ShieldBan } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import clsx from 'clsx'

export function NetworkView() {
  const snapshot = useAppStore((s) => s.snapshot)
  const blockIp = useAppStore((s) => s.blockIp)
  const unblockIp = useAppStore((s) => s.unblockIp)
  const [busy, setBusy] = useState<string | null>(null)

  const connections = snapshot?.connections ?? []
  const suspicious = connections.filter((c) => c.riskScore > 0).length

  const handleToggleBlock = async (ip: string, blocked: boolean) => {
    setBusy(ip)
    if (blocked) await unblockIp(ip)
    else await blockIp(ip, `Bloqueo manual solicitado por el usuario para ${ip}`)
    setBusy(null)
  }

  return (
    <GlassCard strong className="flex h-full flex-col">
      <GlassCardHeader
        title="Conexiones de red activas"
        subtitle={`${connections.length} conexiones · ${suspicious} marcadas como sospechosas`}
        icon={<Network size={16} />}
      />
      <div className="flex-1 overflow-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-void-900/95 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Proceso</th>
              <th className="px-4 py-2.5">Local</th>
              <th className="px-4 py-2.5">Remoto</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5">Riesgo</th>
              <th className="px-4 py-2.5 text-right">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {connections.map((c) => (
              <tr key={c.id} className={clsx('transition-colors hover:bg-white/[0.03]', c.riskScore >= 40 && 'bg-aegis-red/[0.04]')}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-200">{c.processName}</p>
                  <p className="text-xs text-slate-500">PID {c.pid} · {c.protocol.toUpperCase()}</p>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-slate-400">{c.localAddress}:{c.localPort}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-300">{c.remoteAddress ? `${c.remoteAddress}:${c.remotePort}` : '—'}</td>
                <td className="px-4 py-2.5 text-slate-400">{c.state}</td>
                <td className={clsx('px-4 py-2.5 font-semibold tabular-nums', c.riskScore >= 40 ? 'text-aegis-red' : c.riskScore > 0 ? 'text-aegis-amber' : 'text-slate-500')}>
                  {c.riskScore}
                  {c.riskReasons[0] && <p className="mt-0.5 max-w-[240px] truncate text-[11px] font-normal text-slate-500">{c.riskReasons[0]}</p>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {c.remoteAddress && (
                    <button
                      disabled={busy === c.remoteAddress}
                      onClick={() => handleToggleBlock(c.remoteAddress, c.blocked)}
                      className={clsx(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                        c.blocked
                          ? 'border-aegis-green/30 bg-aegis-green/10 text-aegis-green hover:bg-aegis-green/20'
                          : 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-aegis-red/40 hover:text-aegis-red'
                      )}
                    >
                      {c.blocked ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                      {c.blocked ? 'Desbloquear' : 'Bloquear IP'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {connections.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  <ShieldBan size={18} className="mx-auto mb-2 text-slate-600" />
                  No hay conexiones de red activas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
