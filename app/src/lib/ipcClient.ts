import type { AppSettings, SecuritySnapshot, Alert, QuarantineItem, UpdateStatus, ProtectionState } from '@shared/types'
import { createMockApi } from './mockApi'

export interface ActionResult {
  ok: boolean
  error?: string
}

export interface AegisApi {
  getSnapshot: () => Promise<SecuritySnapshot>
  getSettings: () => Promise<AppSettings>
  updateSettings: (settings: AppSettings) => Promise<AppSettings>
  runFullScan: () => Promise<SecuritySnapshot>
  killProcess: (pid: number) => Promise<ActionResult>
  blockProcessNetwork: (pid: number) => Promise<ActionResult>
  blockIp: (ip: string, reason: string) => Promise<ActionResult>
  unblockIp: (ip: string) => Promise<ActionResult>
  quarantineFile: (path: string, reason: string) => Promise<ActionResult>
  restoreQuarantine: (id: string) => Promise<ActionResult>
  listQuarantine: () => Promise<QuarantineItem[]>
  acknowledgeAlert: (id: string) => Promise<boolean>
  clearAlerts: () => Promise<boolean>
  toggleProtection: (key: keyof ProtectionState, value: boolean) => Promise<AppSettings>
  isolateHost: (reason: string) => Promise<ActionResult>
  restoreNetwork: () => Promise<ActionResult>
  checkForUpdates: () => Promise<void>
  windowAction: (action: 'minimize' | 'maximize' | 'close') => Promise<void>
  openExternal: (url: string) => Promise<void>
  onSnapshotUpdate: (cb: (snapshot: SecuritySnapshot) => void) => () => void
  onAlert: (cb: (alert: Alert) => void) => () => void
  onUpdateStatus: (cb: (status: UpdateStatus) => void) => () => void
}

declare global {
  interface Window {
    aegis?: AegisApi
  }
}

export const isElectron = typeof window !== 'undefined' && !!window.aegis

let mockInstance: AegisApi | null = null

export function getAegisApi(): AegisApi {
  if (typeof window !== 'undefined' && window.aegis) return window.aegis
  return (mockInstance ??= createMockApi())
}
