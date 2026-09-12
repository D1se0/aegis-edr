import { create } from 'zustand'
import type { Alert, AppSettings, SecuritySnapshot } from '@shared/types'
import { getAegisApi, isElectron } from '@/lib/ipcClient'

export type Section = 'dashboard' | 'processes' | 'network' | 'filesystem' | 'persistence' | 'alerts' | 'quarantine' | 'ai' | 'settings'

interface ToastItem extends Alert {
  toastId: string
}

interface AppState {
  ready: boolean
  section: Section
  snapshot: SecuritySnapshot | null
  settings: AppSettings | null
  toasts: ToastItem[]
  isElectron: boolean
  presentationMode: boolean
  togglePresentationMode: () => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  setSection: (s: Section) => void
  dismissToast: (toastId: string) => void
  init: () => void
  killProcess: (pid: number) => Promise<void>
  blockProcessNetwork: (pid: number) => Promise<void>
  blockIp: (ip: string, reason: string) => Promise<void>
  unblockIp: (ip: string) => Promise<void>
  quarantineFile: (path: string, reason: string) => Promise<void>
  acknowledgeAlert: (id: string) => Promise<void>
  clearAlerts: () => Promise<void>
  toggleProtection: (key: keyof AppSettings['protection'], value: boolean) => Promise<void>
  updateAppSettings: (patch: Partial<AppSettings>) => Promise<void>
  runFullScan: () => Promise<void>
  isolateHost: (reason: string) => Promise<void>
  restoreNetwork: () => Promise<void>
}

let initialized = false

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  section: 'dashboard',
  snapshot: null,
  settings: null,
  toasts: [],
  isElectron,
  presentationMode: false,
  togglePresentationMode: () => set((s) => ({ presentationMode: !s.presentationMode })),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSection: (section) => set({ section }),
  dismissToast: (toastId) => set((s) => ({ toasts: s.toasts.filter((t) => t.toastId !== toastId) })),
  init: () => {
    if (initialized) return
    initialized = true
    const api = getAegisApi()

    Promise.all([api.getSnapshot(), api.getSettings()]).then(([snapshot, settings]) => {
      set({ snapshot, settings, ready: true })
    })

    api.onSnapshotUpdate((snapshot) => set({ snapshot }))
    api.onAlert((alert) => {
      if (alert.severity === 'info') return
      const toast: ToastItem = { ...alert, toastId: `${alert.id}-${Date.now()}` }
      set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 4) }))
      setTimeout(() => get().dismissToast(toast.toastId), 8000)
    })
  },
  killProcess: async (pid) => {
    await getAegisApi().killProcess(pid)
  },
  blockProcessNetwork: async (pid) => {
    await getAegisApi().blockProcessNetwork(pid)
  },
  blockIp: async (ip, reason) => {
    await getAegisApi().blockIp(ip, reason)
  },
  unblockIp: async (ip) => {
    await getAegisApi().unblockIp(ip)
  },
  quarantineFile: async (path, reason) => {
    await getAegisApi().quarantineFile(path, reason)
  },
  acknowledgeAlert: async (id) => {
    await getAegisApi().acknowledgeAlert(id)
  },
  clearAlerts: async () => {
    await getAegisApi().clearAlerts()
  },
  toggleProtection: async (key, value) => {
    const settings = get().settings
    if (!settings) return
    const updated = { ...settings, protection: { ...settings.protection, [key]: value } }
    set({ settings: updated })
    await getAegisApi().updateSettings(updated)
  },
  updateAppSettings: async (patch) => {
    const settings = get().settings
    if (!settings) return
    const updated = { ...settings, ...patch }
    set({ settings: updated })
    await getAegisApi().updateSettings(updated)
  },
  runFullScan: async () => {
    await getAegisApi().runFullScan()
  },
  isolateHost: async (reason) => {
    await getAegisApi().isolateHost(reason)
  },
  restoreNetwork: async () => {
    await getAegisApi().restoreNetwork()
  }
}))
