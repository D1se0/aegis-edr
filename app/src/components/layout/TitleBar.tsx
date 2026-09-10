import type { CSSProperties } from 'react'
import { Minus, Square, X, ShieldCheck } from 'lucide-react'
import { getAegisApi, isElectron } from '@/lib/ipcClient'
import { useAppStore } from '@/store/useAppStore'

const dragStyle = { WebkitAppRegion: 'drag' } as CSSProperties
const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties

export function TitleBar() {
  const snapshot = useAppStore((s) => s.snapshot)
  const api = getAegisApi()

  return (
    <div
      className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] bg-black/20 px-3 backdrop-blur-xl"
      style={dragStyle}
    >
      <div className="flex items-center gap-2 pl-1">
        <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-aegis-cyan to-aegis-blue">
          <ShieldCheck size={14} className="text-void-950" />
        </div>
        <span className="text-[13px] font-semibold tracking-wide text-slate-200">Aegis EDR</span>
        {snapshot && (
          <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400">
            {snapshot.protection.realtimeMonitoring ? 'Proteccion activa' : 'Proteccion pausada'}
          </span>
        )}
      </div>
      {isElectron && (
        <div className="flex items-center gap-1" style={noDragStyle}>
          <button onClick={() => api.windowAction('minimize')} className="flex h-7 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-slate-100">
            <Minus size={14} />
          </button>
          <button onClick={() => api.windowAction('maximize')} className="flex h-7 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-slate-100">
            <Square size={12} />
          </button>
          <button onClick={() => api.windowAction('close')} className="flex h-7 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-aegis-red/80 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
