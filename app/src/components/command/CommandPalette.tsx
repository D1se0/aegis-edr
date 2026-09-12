import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Cpu,
  Network,
  FolderLock,
  ListTree,
  BellRing,
  ShieldAlert,
  Settings,
  Bot,
  Search,
  type LucideIcon
} from 'lucide-react'
import { useAppStore, type Section } from '@/store/useAppStore'

const ACTIONS: Array<{ id: Section; label: string; icon: LucideIcon; keywords: string }> = [
  { id: 'dashboard', label: 'Ir al panel general', icon: LayoutDashboard, keywords: 'dashboard inicio panel score puntuacion' },
  { id: 'processes', label: 'Ir a procesos', icon: Cpu, keywords: 'procesos process pid' },
  { id: 'network', label: 'Ir a red', icon: Network, keywords: 'red network conexiones ip' },
  { id: 'filesystem', label: 'Ir a ficheros', icon: FolderLock, keywords: 'ficheros filesystem archivos backups extensiones honeytokens' },
  { id: 'persistence', label: 'Ir a autoarranque', icon: ListTree, keywords: 'persistencia autoarranque startup' },
  { id: 'alerts', label: 'Ir a alertas', icon: BellRing, keywords: 'alertas incidentes storyline' },
  { id: 'quarantine', label: 'Ir a cuarentena', icon: ShieldAlert, keywords: 'cuarentena quarantine' },
  { id: 'ai', label: 'Ir al asistente IA', icon: Bot, keywords: 'ia ai claude asistente chat' },
  { id: 'settings', label: 'Ir a ajustes', icon: Settings, keywords: 'ajustes settings playbooks webhook config' }
]

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen)
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const setSection = useAppStore((s) => s.setSection)
  const [query, setQuery] = useState('')

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ACTIONS
    return ACTIONS.filter((a) => a.label.toLowerCase().includes(q) || a.keywords.includes(q))
  }, [query])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-strong w-full max-w-lg overflow-hidden !p-0"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <Search size={15} className="text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar seccion o accion..."
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
              />
              <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-500">Esc</kbd>
            </div>
            <div className="max-h-80 overflow-auto p-2">
              {results.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    setSection(action.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/[0.06]"
                >
                  <action.icon size={15} className="text-aegis-cyan" />
                  {action.label}
                </button>
              ))}
              {results.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">Sin resultados.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
