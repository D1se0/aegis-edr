import type {
  AppSettings,
  SecuritySnapshot,
  Alert,
  QuarantineItem,
  UpdateStatus,
  ProtectionState,
  AiSettings,
  AiSettingsInput,
  AiChatMessage,
  AiConfirmationRequest,
  AiStreamDelta,
  AiSendResult,
  Incident,
  ScoreExplanation,
  HoneytokenFile,
  FileBackupEntry,
  BrowserExtensionInfo,
  IncidentModeResult,
  PlaybookRule,
  SelfNetworkLogEntry,
  ConfigBundle
} from '@shared/types'
import { createMockApi } from './mockApi'

export interface ActionResult {
  ok: boolean
  error?: string
}

export type PlaybookInput = Partial<Pick<PlaybookRule, 'id'>> & Omit<PlaybookRule, 'id' | 'createdAt' | 'timesTriggered'>

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

  // Asistente IA
  aiGetSettings: () => Promise<AiSettings>
  aiSaveSettings: (input: AiSettingsInput) => Promise<AiSettings>
  aiClearApiKey: () => Promise<AiSettings>
  aiSendMessage: (text: string) => Promise<AiSendResult>
  aiConfirmAction: (requestId: string, approved: boolean) => Promise<void>
  aiClearConversation: () => Promise<void>
  aiGetHistory: () => Promise<AiChatMessage[]>
  onAiStreamDelta: (cb: (delta: AiStreamDelta) => void) => () => void
  onAiConfirmationRequest: (cb: (request: AiConfirmationRequest) => void) => () => void

  // Storyline / incidentes
  listIncidents: () => Promise<Incident[]>

  // Score explicable
  explainScore: () => Promise<ScoreExplanation>

  // Honeytokens
  listHoneytokens: () => Promise<HoneytokenFile[]>

  // Backups / rollback simplificado
  listFileBackups: () => Promise<FileBackupEntry[]>
  restoreFromBackup: (id: string) => Promise<ActionResult>

  // Auditoria de extensiones de navegador
  listBrowserExtensions: () => Promise<BrowserExtensionInfo[]>
  scanBrowserExtensions: () => Promise<BrowserExtensionInfo[]>

  // Modo incidente
  triggerIncidentMode: (reason: string) => Promise<IncidentModeResult>

  // Playbooks
  listPlaybooks: () => Promise<PlaybookRule[]>
  savePlaybook: (rule: PlaybookInput) => Promise<PlaybookRule>
  deletePlaybook: (id: string) => Promise<boolean>

  // Auto-vigilancia de red propia
  listSelfNetworkLog: () => Promise<SelfNetworkLogEntry[]>

  // Config-as-code
  exportConfig: () => Promise<ConfigBundle>
  importConfig: (raw: string) => Promise<ActionResult>

  // Insignia de score
  getScoreBadgeSvg: () => Promise<string>
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
