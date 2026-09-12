import Store from 'electron-store'
import type { AppSettings, QuarantineItem } from '../../shared/types'

interface PersistedSchema {
  settings: AppSettings
  quarantine: QuarantineItem[]
  hostsBaselineHash: string | null
}

export const defaultSettings: AppSettings = {
  protection: {
    realtimeMonitoring: true,
    networkGuard: true,
    fileGuard: true,
    ransomwareShield: true,
    persistenceGuard: true,
    autoBlock: false
  },
  watchPaths: [],
  cpuAlertThreshold: 85,
  connectionsPerMinuteThreshold: 40,
  autoBlockSeverity: 'critical',
  updateChannel: 'stable',
  telemetryOptIn: false
}

export const store = new Store<PersistedSchema>({
  name: 'aegis-edr-config',
  defaults: {
    settings: defaultSettings,
    quarantine: [],
    hostsBaselineHash: null
  }
})

export function getSettings(): AppSettings {
  return { ...defaultSettings, ...(store.get('settings') as AppSettings) }
}

export function saveSettings(settings: AppSettings) {
  store.set('settings', settings)
}
