import type { Alert, ScoreExplanation, Severity } from '../../shared/types'

/**
 * Motor de reglas heuristicas. No sustituye a firmas/EDR kernel-level: opera en
 * user-mode con la telemetria disponible via Node/OS (procesos, red, FS, autostart).
 */

const MINER_NAMES = ['xmrig', 'minerd', 'cpuminer', 'ethminer', 'nbminer', 'cryptonight', 't-rex', 'phoenixminer']
const OFFENSIVE_TOOL_NAMES = [
  'mimikatz', 'lazagne', 'procdump', 'psexec', 'pwdump', 'wce', 'cobaltstrike', 'meterpreter',
  'ncat', 'netcat', 'socat', 'chisel', 'rundll32', 'certutil'
]
const RANSOM_EXT_MARKERS = ['.locked', '.encrypted', '.crypt', '.enc', '.ryuk', '.wcry', '.wannacry', '.lockbit']
const SUSPICIOUS_DIRS = ['/tmp/', '/dev/shm/', '/var/tmp/', '\\appdata\\local\\temp\\', '\\programdata\\', '/downloads/']
const SYSTEM_LOOKALIKES = ['svchost', 'explorer', 'lsass', 'csrss', 'winlogon', 'systemd', 'dbus-daemon']
const HIGH_RISK_PORTS = [4444, 4445, 1337, 31337, 6666, 6667, 12345, 54321]
const SENSITIVE_REMOTE_PORTS_HINT = [3389, 22, 23, 445, 135, 139]

export function randomLooking(name: string): boolean {
  const base = name.replace(/\.(exe|bin|out|sh)$/i, '')
  if (base.length < 6) return false
  const vowels = (base.match(/[aeiouAEIOU]/g) || []).length
  const ratio = vowels / base.length
  const hasDigits = /\d{3,}/.test(base)
  return (ratio < 0.15 && base.length > 7) || hasDigits
}

export interface ScoreResult {
  riskScore: number
  riskReasons: string[]
}

export function scoreProcess(p: { name: string; path: string; user: string; cpu: number; memMb: number; cpuAlertThreshold: number }): ScoreResult {
  const reasons: string[] = []
  let score = 0
  const lowerName = p.name.toLowerCase()
  const lowerPath = (p.path || '').toLowerCase()

  if (MINER_NAMES.some((m) => lowerName.includes(m))) {
    score += 60
    reasons.push('Coincide con firma conocida de minero de criptomonedas')
  }
  if (OFFENSIVE_TOOL_NAMES.some((m) => lowerName.includes(m))) {
    score += 55
    reasons.push('Coincide con herramienta ofensiva/post-explotacion conocida')
  }
  if (SUSPICIOUS_DIRS.some((d) => lowerPath.includes(d)) && (lowerPath.endsWith('.exe') || lowerPath.includes('/tmp/') || lowerPath.includes('shm'))) {
    score += 30
    reasons.push('Ejecutable lanzado desde una ruta temporal o poco habitual')
  }
  const isResolvedPath = lowerPath.includes('/') || lowerPath.includes('\\')
  if (
    SYSTEM_LOOKALIKES.some((s) => lowerName.includes(s)) &&
    isResolvedPath &&
    !lowerPath.includes('system32') &&
    !lowerPath.includes('/usr/') &&
    !lowerPath.includes('/lib/') &&
    !lowerPath.includes('/sbin/')
  ) {
    score += 45
    reasons.push('Nombre imita un proceso del sistema pero se ejecuta desde una ruta atipica')
  }
  if (randomLooking(p.name)) {
    score += 20
    reasons.push('Nombre de proceso con apariencia generada/ofuscada')
  }
  if (p.cpu >= p.cpuAlertThreshold) {
    score += 25
    reasons.push(`Consumo de CPU anormalmente alto (${p.cpu.toFixed(0)}%)`)
  }
  if (p.memMb > 4000) {
    score += 8
    reasons.push('Consumo de memoria elevado')
  }
  if (p.user === 'root' || p.user === 'SYSTEM') {
    if (score > 0) {
      score += 10
      reasons.push('Se ejecuta con privilegios elevados')
    }
  }

  return { riskScore: clamp(score), riskReasons: reasons }
}

export function scoreConnection(c: {
  remoteAddress: string
  remotePort: number
  state: string
  processName: string
}): ScoreResult {
  const reasons: string[] = []
  let score = 0

  if (HIGH_RISK_PORTS.includes(c.remotePort)) {
    score += 45
    reasons.push(`Puerto remoto ${c.remotePort} asociado a shells reversas / C2`)
  }
  if (isPrivateOrLoopback(c.remoteAddress)) {
    // conexiones locales/LAN no puntuan salvo excepciones ya cubiertas
  } else if (SENSITIVE_REMOTE_PORTS_HINT.includes(c.remotePort) && c.state.toLowerCase().includes('listen')) {
    score += 15
    reasons.push(`Servicio sensible expuesto en puerto ${c.remotePort}`)
  }
  if (OFFENSIVE_TOOL_NAMES.some((m) => c.processName.toLowerCase().includes(m))) {
    score += 40
    reasons.push('Conexion de red originada por una herramienta ofensiva conocida')
  }

  return { riskScore: clamp(score), riskReasons: reasons }
}

export function scorePersistence(p: { name: string; command: string; location: string }): ScoreResult {
  const reasons: string[] = []
  let score = 0
  const cmd = p.command.toLowerCase()

  if (SUSPICIOUS_DIRS.some((d) => cmd.includes(d))) {
    score += 35
    reasons.push('El punto de persistencia apunta a una ruta temporal')
  }
  if (/(powershell|cmd\.exe|bash|sh)\s+-[a-z]*e/i.test(cmd) && (cmd.includes('base64') || cmd.includes('-enc'))) {
    score += 50
    reasons.push('Comando ofuscado/codificado en base64 detectado en autoarranque')
  }
  if (cmd.includes('curl') || cmd.includes('wget') || cmd.includes('invoke-webrequest')) {
    score += 25
    reasons.push('El autoarranque descarga contenido remoto en su ejecucion')
  }
  if (randomLooking(p.name)) {
    score += 15
    reasons.push('Nombre de entrada de autoarranque con apariencia generada')
  }

  return { riskScore: clamp(score), riskReasons: reasons }
}

export function scoreFileEvent(zone: string, path: string, isRansomwareBurst: boolean): ScoreResult {
  const reasons: string[] = []
  let score = 0
  const lower = path.toLowerCase()

  if (RANSOM_EXT_MARKERS.some((ext) => lower.endsWith(ext))) {
    score += 70
    reasons.push('Extension de fichero asociada a ransomware conocido')
  }
  if (isRansomwareBurst) {
    score += 60
    reasons.push('Rafaga de modificaciones masivas de ficheros en corto periodo de tiempo')
  }
  if (zone === 'critical-system') {
    score += 30
    reasons.push('Modificacion de un fichero critico del sistema')
  }

  return { riskScore: clamp(score), riskReasons: reasons }
}

export function severityFromScore(score: number): Severity {
  if (score >= 70) return 'critical'
  if (score >= 45) return 'high'
  if (score >= 20) return 'medium'
  if (score > 0) return 'low'
  return 'info'
}

const SEVERITY_RANK: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 }

/** Compara una severidad de alerta contra el umbral configurado para auto-bloqueo ('off' desactiva siempre). */
export function severityMeetsThreshold(severity: Severity, threshold: Severity | 'off'): boolean {
  if (threshold === 'off') return false
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[threshold]
}

export function computeSecurityScore(alerts: Alert[]): { score: number; label: 'Excelente' | 'Bueno' | 'En riesgo' | 'Critico' } {
  const active = alerts.filter((a) => !a.acknowledged)
  const weight: Record<Severity, number> = { critical: 28, high: 16, medium: 8, low: 3, info: 0 }
  const penalty = active.reduce((sum, a) => sum + weight[a.severity], 0)
  const score = clamp(100 - penalty, 0, 100)
  let label: 'Excelente' | 'Bueno' | 'En riesgo' | 'Critico' = 'Excelente'
  if (score < 40) label = 'Critico'
  else if (score < 70) label = 'En riesgo'
  else if (score < 90) label = 'Bueno'
  return { score, label }
}

/** Mapeo heuristica -> tecnica de MITRE ATT&CK (aproximado; no sustituye un mapeo formal). */
const MITRE_KEYWORDS: Array<{ match: RegExp; technique: string }> = [
  { match: /minero de criptomonedas|CPU anormalmente alto/i, technique: 'T1496' }, // Resource Hijacking
  { match: /herramienta ofensiva/i, technique: 'T1588.002' }, // Tool
  { match: /imita un proceso del sistema/i, technique: 'T1036.005' }, // Masquerading: Match Legitimate Name
  { match: /ruta temporal|apariencia generada/i, technique: 'T1036' }, // Masquerading
  { match: /privilegios elevados/i, technique: 'T1548' }, // Abuse Elevation Control Mechanism
  { match: /shells reversas|C2/i, technique: 'T1071' }, // Application Layer Protocol
  { match: /servicio sensible expuesto/i, technique: 'T1021' }, // Remote Services
  { match: /escaneo de puertos/i, technique: 'T1046' }, // Network Service Discovery
  { match: /comando ofuscado|codificado en base64/i, technique: 'T1027' }, // Obfuscated Files or Information
  { match: /descarga contenido remoto/i, technique: 'T1105' }, // Ingress Tool Transfer
  { match: /autoarranque|persistencia/i, technique: 'T1547' }, // Boot or Logon Autostart Execution
  { match: /ransomware|rafaga de modificaciones/i, technique: 'T1486' }, // Data Encrypted for Impact
  { match: /fichero critico del sistema|hosts/i, technique: 'T1565' }, // Data Manipulation
  { match: /honeytoken|senuelo/i, technique: 'T1083' }, // File and Directory Discovery
  { match: /nunca visto antes|no visto previamente/i, technique: 'T1071' },
  { match: /powershell|mshta|rundll32|certutil|LOLBin/i, technique: 'T1218' } // System Binary Proxy Execution
]

/** Deriva las tecnicas MITRE ATT&CK aplicables a partir de las razones de riesgo textuales. */
export function mapReasonsToMitre(reasons: string[]): string[] {
  const set = new Set<string>()
  for (const reason of reasons) {
    for (const k of MITRE_KEYWORDS) {
      if (k.match.test(reason)) set.add(k.technique)
    }
  }
  return Array.from(set)
}

/** Desglose transparente de que contribuye al score actual, no solo el numero final. */
export function explainScore(alerts: Alert[]): ScoreExplanation {
  const active = alerts.filter((a) => !a.acknowledged)
  const weight: Record<Severity, number> = { critical: 28, high: 16, medium: 8, low: 3, info: 0 }
  const byGroup = new Map<string, { impact: number; count: number }>()

  for (const a of active) {
    const w = weight[a.severity]
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

  const { score, label } = computeSecurityScore(alerts)
  return { score, scoreLabel: label, factors }
}

function isPrivateOrLoopback(ip: string): boolean {
  return (
    ip === '' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  )
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}
