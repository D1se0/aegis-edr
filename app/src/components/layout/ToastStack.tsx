import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Info, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Severity } from '@shared/types'
import clsx from 'clsx'

const ICONS: Record<Severity, typeof Info> = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: Info
}

const BORDER: Record<Severity, string> = {
  critical: 'border-aegis-red/40 shadow-glow-red',
  high: 'border-aegis-amber/40',
  medium: 'border-aegis-violet/40',
  low: 'border-aegis-blue/40',
  info: 'border-white/10'
}

export function ToastStack() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed right-4 top-14 z-50 flex w-96 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.severity]
          return (
            <motion.div
              key={t.toastId}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={clsx('glass-panel-strong pointer-events-auto flex items-start gap-3 p-3.5', BORDER[t.severity])}
            >
              <Icon size={18} className="mt-0.5 shrink-0 text-slate-200" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">{t.title}</p>
                <p className="mt-0.5 line-clamp-3 text-xs text-slate-400">{t.message}</p>
              </div>
              <button onClick={() => dismiss(t.toastId)} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200">
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
