import Store from 'electron-store'
import type { AppSettings, ConfigBundle, FileBackupEntry, PlaybookRule, QuarantineItem } from '../../shared/types'

interface PersistedSchema {
  settings: AppSettings
  quarantine: QuarantineItem[]
  hostsBaselineHash: string | null
  playbooks: PlaybookRule[]
  fileBackups: FileBackupEntry[]
  aiConfig: {
    encryptedApiKey: string | null
    keyStorageEncrypted: boolean
    model: 'claude-opus-5' | 'claude-sonnet-5' | 'claude-haiku-4-5'
    autonomousMode: boolean
  }
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
  telemetryOptIn: false,
  honeytokensEnabled: true,
  backupBeforeChange: true,
  webhookUrl: null,
  webhookFormat: 'generic'
}

export const store = new Store<PersistedSchema>({
  name: 'aegis-edr-config',
  defaults: {
    settings: defaultSettings,
    quarantine: [],
    hostsBaselineHash: null,
    playbooks: [],
    fileBackups: [],
    aiConfig: {
      encryptedApiKey: null,
      keyStorageEncrypted: false,
      model: 'claude-opus-5',
      autonomousMode: false
    }
  }
})

export function getSettings(): AppSettings {
  return { ...defaultSettings, ...(store.get('settings') as AppSettings) }
}

export function saveSettings(settings: AppSettings) {
  store.set('settings', settings)
}

export function getPlaybooksRaw(): PlaybookRule[] {
  return (store.get('playbooks') as PlaybookRule[]) || []
}

export function savePlaybooksRaw(rules: PlaybookRule[]) {
  store.set('playbooks', rules)
}

/** Config-as-code: serializa ajustes + reglas de playbooks a un unico objeto versionado. */
export function exportConfig(): ConfigBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    playbooks: getPlaybooksRaw()
  }
}

export function importConfig(raw: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(raw) as Partial<ConfigBundle>
    if (!parsed || parsed.version !== 1 || !parsed.settings) {
      return { ok: false, error: 'Formato de configuracion no reconocido.' }
    }
    saveSettings({ ...defaultSettings, ...parsed.settings })
    if (Array.isArray(parsed.playbooks)) savePlaybooksRaw(parsed.playbooks)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: `JSON invalido: ${String(err)}` }
  }
}
