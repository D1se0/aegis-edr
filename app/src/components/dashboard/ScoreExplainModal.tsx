import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X } from 'lucide-react'
import { getAegisApi } from '@/lib/ipcClient'
import type { ScoreExplanation } from '@shared/types'

export function ScoreExplainModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [explanation, setExplanation] = useState<ScoreExplanation | null>(null)

  useEffect(() => {
    if (!open) return
    getAegisApi().explainScore().then(setExplanation)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-strong w-full max-w-md p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-aegis-cyan" />
                <h3 className="text-sm font-semibold text-slate-100">Por que tu puntuacion es {explanation?.score ?? '...'}</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-slate-200">
                <X size={16} />
              </button>
            </div>
            {!explanation && <p className="text-sm text-slate-500">Calculando...</p>}
            {explanation && explanation.factors.length === 0 && (
              <p className="text-sm text-slate-400">No hay factores penalizando tu puntuacion ahora mismo. Todo en orden.</p>
            )}
            {explanation && explanation.factors.length > 0 && (
              <div className="space-y-2">
                {explanation.factors.map((f) => (
                  <div key={f.label} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div>
                      <p className="text-sm text-slate-200">{f.label}</p>
                      <p className="text-[11px] text-slate-500">
                        {f.count} evento{f.count === 1 ? '' : 's'} activo{f.count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-aegis-red">-{f.impact}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
