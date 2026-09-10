import { useEffect, useState } from 'react'
import { FolderLock, RotateCcw } from 'lucide-react'
import { getAegisApi } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import type { QuarantineItem } from '@shared/types'

export function QuarantineView() {
  const [items, setItems] = useState<QuarantineItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const list = await getAegisApi().listQuarantine()
    setItems(list)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRestore = async (id: string) => {
    await getAegisApi().restoreQuarantine(id)
    refresh()
  }

  return (
    <GlassCard strong className="flex h-full flex-col">
      <GlassCardHeader title="Cuarentena" subtitle="Ficheros aislados de forma segura, listos para revisar o restaurar" icon={<FolderLock size={16} />} />
      <div className="flex-1 space-y-2 overflow-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">{item.originalPath}</p>
              <p className="text-xs text-slate-500">{item.reason}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-600">SHA-256 {item.sha256.slice(0, 24)}... · {(item.sizeBytes / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => handleRestore(item.id)} className="glass-btn shrink-0 text-xs">
              <RotateCcw size={13} /> Restaurar
            </button>
          </div>
        ))}
        {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No hay ficheros en cuarentena.</p>}
      </div>
    </GlassCard>
  )
}
