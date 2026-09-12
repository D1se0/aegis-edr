export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type AlertCategory =
  | 'process'
  | 'network'
  | 'filesystem'
  | 'persistence'
  | 'hosts'
  | 'usb'
  | 'system'
  | 'ransomware'

export interface ProcessInfo {
  pid: number
  ppid: number
  name: string
  path: string
  user: string
  cpu: number
  memMb: number
  startedAt: string
  riskScore: number
  riskReasons: string[]
  blocked: boolean
}

export interface NetworkConnection {
  id: string
  protocol: string
  localAddress: string
  localPort: number
  remoteAddress: string
  remotePort: number
  state: string
  pid: number
  processName: string
  riskScore: number
  riskReasons: string[]
  blocked: boolean
}

export interface FileEvent {
  id: string
  path: string
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  time: string
  zone: string
  riskScore: number
  riskReasons: string[]
}

export interface PersistenceItem {
  id: string
  source: 'registry' | 'cron' | 'systemd' | 'launchagent' | 'launchdaemon' | 'startup-folder' | 'shell-profile' | 'autostart-desktop'
  name: string
  command: string
  location: string
  riskScore: number
  riskReasons: string[]
  discoveredAt: string
}

export interface UsbDevice {
  id: string
  name: string
  vendor: string
  event: 'connected' | 'disconnected'
  time: string
}

export interface HostsFileStatus {
  path: string
  baselineHash: string | null
  currentHash: string | null
  tampered: boolean
  suspiciousEntries: string[]
  lastChecked: string
}

export interface Alert {
  id: string
  time: string
  severity: Severity
  category: AlertCategory
  title: string
  message: string
  sourceId?: string
  acknowledged: boolean
  autoBlocked: boolean
  mitreTechniques?: string[]
}

export interface SystemVitals {
  cpuLoad: number
  memUsedPct: number
  memTotalGb: number
  diskUsedPct: number
  platform: string
  distro: string
  hostname: string
  uptimeSec: number
  netInSpeed: number
  netOutSpeed: number
}

export interface SecuritySnapshot {
  score: number
  scoreLabel: 'Excelente' | 'Bueno' | 'En riesgo' | 'Critico'
  vitals: SystemVitals
  processes: ProcessInfo[]
  connections: NetworkConnection[]
  alerts: Alert[]
  persistence: PersistenceItem[]
  fileEvents: FileEvent[]
  hosts: HostsFileStatus
  usbEvents: UsbDevice[]
  protection: ProtectionState
  lastScan: string
  incidents: Incident[]
}

export interface ProtectionState {
  realtimeMonitoring: boolean
  networkGuard: boolean
  fileGuard: boolean
  ransomwareShield: boolean
  persistenceGuard: boolean
  autoBlock: boolean
}

export interface AppSettings {
  protection: ProtectionState
  watchPaths: string[]
  cpuAlertThreshold: number
  connectionsPerMinuteThreshold: number
  autoBlockSeverity: Severity | 'off'
  updateChannel: 'stable' | 'beta'
  telemetryOptIn: boolean
  honeytokensEnabled: boolean
  backupBeforeChange: boolean
  webhookUrl: string | null
  webhookFormat: 'slack' | 'discord' | 'generic'
}

// ---------------------------------------------------------------------------
// Asistente IA (Claude)
// ---------------------------------------------------------------------------

export type AiModel = 'claude-opus-5' | 'claude-sonnet-5' | 'claude-haiku-4-5'

export interface AiSettings {
  hasApiKey: boolean
  keyStorageEncrypted: boolean
  model: AiModel
  autonomousMode: boolean
}

export interface AiSettingsInput {
  apiKey?: string
  model: AiModel
  autonomousMode: boolean
}

export interface AiChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
  toolCalls?: Array<{ name: string; input: Record<string, unknown> }>
}

export interface AiConfirmationRequest {
  requestId: string
  toolName: string
  toolLabel: string
  input: Record<string, unknown>
  reasoning: string
  createdAt: string
}

export interface AiStreamDelta {
  messageId: string
  textDelta: string
  done: boolean
}

export interface AiSendResult {
  ok: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Storyline / correlacion de incidentes
// ---------------------------------------------------------------------------

export interface IncidentEvent {
  alertId: string
  time: string
  category: AlertCategory
  summary: string
}

export interface Incident {
  id: string
  title: string
  severity: Severity
  startedAt: string
  updatedAt: string
  events: IncidentEvent[]
  processKey?: string
  ip?: string
}

// ---------------------------------------------------------------------------
// Score explicable
// ---------------------------------------------------------------------------

export interface ScoreFactor {
  label: string
  impact: number
  count: number
}

export interface ScoreExplanation {
  score: number
  scoreLabel: SecuritySnapshot['scoreLabel']
  factors: ScoreFactor[]
}

// ---------------------------------------------------------------------------
// Playbooks (reglas si-esto-entonces-aquello)
// ---------------------------------------------------------------------------

export type PlaybookActionType = 'kill_process' | 'block_ip' | 'quarantine_file' | 'notify'

export interface PlaybookCondition {
  category?: AlertCategory
  minSeverity: Severity
  matchText?: string
}

export interface PlaybookRule {
  id: string
  name: string
  enabled: boolean
  condition: PlaybookCondition
  action: PlaybookActionType
  createdAt: string
  timesTriggered: number
}

// ---------------------------------------------------------------------------
// Honeytokens
// ---------------------------------------------------------------------------

export interface HoneytokenFile {
  path: string
  createdAt: string
  triggered: boolean
  triggeredAt?: string
}

// ---------------------------------------------------------------------------
// Backups locales (rollback simplificado, no es snapshot nativo del SO)
// ---------------------------------------------------------------------------

export interface FileBackupEntry {
  id: string
  originalPath: string
  createdAt: string
  sizeBytes: number
  sha256: string
}

// ---------------------------------------------------------------------------
// Auditoria de extensiones de navegador
// ---------------------------------------------------------------------------

export interface BrowserExtensionInfo {
  browser: 'chrome' | 'chromium' | 'edge' | 'firefox'
  profile: string
  id: string
  name: string
  permissions: string[]
  riskScore: number
  riskReasons: string[]
}

// ---------------------------------------------------------------------------
// Auto-vigilancia de red (transparencia de la propia app)
// ---------------------------------------------------------------------------

export interface SelfNetworkLogEntry {
  id: string
  time: string
  destination: string
  purpose: string
}

// ---------------------------------------------------------------------------
// Modo incidente
// ---------------------------------------------------------------------------

export interface IncidentModeResult {
  ok: boolean
  bundlePath?: string
  error?: string
}

export interface ConfigBundle {
  version: 1
  exportedAt: string
  settings: AppSettings
  playbooks: PlaybookRule[]
}

export const IPC = {
  getSnapshot: 'aegis:get-snapshot',
  getSettings: 'aegis:get-settings',
  updateSettings: 'aegis:update-settings',
  runFullScan: 'aegis:run-full-scan',
  killProcess: 'aegis:kill-process',
  blockProcessNetwork: 'aegis:block-process-network',
  blockIp: 'aegis:block-ip',
  unblockIp: 'aegis:unblock-ip',
  quarantineFile: 'aegis:quarantine-file',
  restoreQuarantine: 'aegis:restore-quarantine',
  listQuarantine: 'aegis:list-quarantine',
  acknowledgeAlert: 'aegis:acknowledge-alert',
  clearAlerts: 'aegis:clear-alerts',
  toggleProtection: 'aegis:toggle-protection',
  isolateHost: 'aegis:isolate-host',
  restoreNetwork: 'aegis:restore-network',
  checkForUpdates: 'aegis:check-for-updates',
  windowAction: 'aegis:window-action',
  openExternal: 'aegis:open-external',
  onSnapshotUpdate: 'aegis:on-snapshot-update',
  onAlert: 'aegis:on-alert',
  onUpdateStatus: 'aegis:on-update-status',

  // Asistente IA
  aiGetSettings: 'aegis:ai-get-settings',
  aiSaveSettings: 'aegis:ai-save-settings',
  aiClearApiKey: 'aegis:ai-clear-api-key',
  aiSendMessage: 'aegis:ai-send-message',
  aiConfirmAction: 'aegis:ai-confirm-action',
  aiClearConversation: 'aegis:ai-clear-conversation',
  aiGetHistory: 'aegis:ai-get-history',
  onAiStreamDelta: 'aegis:on-ai-stream-delta',
  onAiConfirmationRequest: 'aegis:on-ai-confirmation-request',
  onAiMessage: 'aegis:on-ai-message',

  // Storyline / incidentes
  listIncidents: 'aegis:list-incidents',

  // Score explicable
  explainScore: 'aegis:explain-score',

  // Honeytokens
  listHoneytokens: 'aegis:list-honeytokens',

  // Backups / rollback simplificado
  listFileBackups: 'aegis:list-file-backups',
  restoreFromBackup: 'aegis:restore-from-backup',

  // Auditoria de extensiones de navegador
  listBrowserExtensions: 'aegis:list-browser-extensions',
  scanBrowserExtensions: 'aegis:scan-browser-extensions',

  // Modo incidente
  triggerIncidentMode: 'aegis:trigger-incident-mode',

  // Playbooks
  listPlaybooks: 'aegis:list-playbooks',
  savePlaybook: 'aegis:save-playbook',
  deletePlaybook: 'aegis:delete-playbook',

  // Auto-vigilancia de red propia
  listSelfNetworkLog: 'aegis:list-self-network-log',

  // Config-as-code
  exportConfig: 'aegis:export-config',
  importConfig: 'aegis:import-config',

  // Insignia de score
  getScoreBadgeSvg: 'aegis:get-score-badge-svg'
} as const

export interface QuarantineItem {
  id: string
  originalPath: string
  quarantinedAt: string
  reason: string
  sha256: string
  sizeBytes: number
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  progress?: number
  message?: string
}
