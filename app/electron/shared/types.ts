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
  onUpdateStatus: 'aegis:on-update-status'
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
