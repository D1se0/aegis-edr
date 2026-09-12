import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { getAegisApi } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import type { SelfNetworkLogEntry } from '@shared/types'

export function TransparencyPanel() {
  const [log, setLog] = useState<SelfNetworkLogEntry[]>([])

  useEffect(() => {
    getAegisApi().listSelfNetworkLog().then(setLog)
    const id = setInterval(() => getAegisApi().listSelfNetworkLog().then(setLog), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <GlassCard strong>
      <GlassCardHeader
        title="Transparencia de red"
        subtitle="Cada llamada de red que hace la propia app (nunca en segundo plano sin motivo): comprobacion de actualizaciones y, si lo usas, la API de Claude"
        icon={<Radio size={16} />}
      />
      <div className="space-y-2">
        {log.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
            <div>
              <p className="font-mono text-slate-300">{entry.destination}</p>
              <p className="text-slate-500">{entry.purpose}</p>
            </div>
            <span className="text-slate-600">{new Date(entry.time).toLocaleTimeString()}</span>
          </div>
        ))}
        {log.length === 0 && <p className="py-6 text-center text-xs text-slate-500">Sin llamadas salientes registradas todavia.</p>}
      </div>
    </GlassCard>
  )
}
