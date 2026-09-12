import chokidar from 'chokidar'
import type { FSWatcher } from 'chokidar'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { FileEvent, HostsFileStatus } from '../../shared/types'
import { scoreFileEvent, severityFromScore, severityMeetsThreshold, mapReasonsToMitre } from './threatEngine'
import { raiseAlert } from './alerts'
import { quarantineFile } from './quarantine'
import { getSettings } from './store'
import { logger } from './logger'
import { seedHoneytokens, isHoneytokenPath, markHoneytokenTriggered } from './honeytokens'
import { backupFileVersion } from './fileBackup'
import { isolateHost } from './firewall'

const MAX_EVENTS = 200
let recentEvents: FileEvent[] = []
let watcher: FSWatcher | null = null
let criticalTimer: NodeJS.Timeout | null = null

let burstWindowStart = Date.now()
let burstCount = 0
const BURST_WINDOW_MS = 20_000
const BURST_THRESHOLD = 25

let hostsStatus: HostsFileStatus = {
  path: getHostsPath(),
  baselineHash: null,
  currentHash: null,
  tampered: false,
  suspiciousEntries: [],
  lastChecked: new Date().toISOString()
}

function getHostsPath(): string {
  const os = platform()
  if (os === 'win32') return 'C:\\Windows\\System32\\drivers\\etc\\hosts'
  return '/etc/hosts'
}

function getDefaultUserDataPaths(): string[] {
  const home = homedir()
  const candidates = [join(home, 'Desktop'), join(home, 'Documents'), join(home, 'Downloads')]
  return candidates.filter((p) => existsSync(p))
}

function getCriticalFiles(): string[] {
  const os = platform()
  const home = homedir()
  const files = [getHostsPath()]
  if (os === 'linux') {
    files.push('/etc/passwd', '/etc/sudoers', join(home, '.bashrc'), join(home, '.ssh', 'authorized_keys'))
  } else if (os === 'darwin') {
    files.push(join(home, '.bash_profile'), join(home, '.zshrc'))
  }
  return files.filter((p) => existsSync(p))
}

function hashFile(path: string): string | null {
  try {
    const data = readFileSync(path)
    return createHash('sha256').update(data).digest('hex')
  } catch {
    return null
  }
}

export function getHostsStatus(): HostsFileStatus {
  return hostsStatus
}

export function getRecentFileEvents(): FileEvent[] {
  return recentEvents
}

function pushEvent(ev: FileEvent) {
  recentEvents.unshift(ev)
  if (recentEvents.length > MAX_EVENTS) recentEvents = recentEvents.slice(0, MAX_EVENTS)
}

function registerUserDataChange() {
  const now = Date.now()
  if (now - burstWindowStart > BURST_WINDOW_MS) {
    burstWindowStart = now
    burstCount = 0
  }
  burstCount += 1
  return burstCount >= BURST_THRESHOLD
}

export function startFileIntegrityMonitor() {
  const settings = getSettings()
  if (!settings.protection.fileGuard) return

  seedHoneytokens()

  const watchPaths = settings.watchPaths.length ? settings.watchPaths : getDefaultUserDataPaths()
  if (watchPaths.length && !watcher) {
    watcher = chokidar.watch(watchPaths, {
      ignoreInitial: true,
      depth: 4,
      ignored: (path) => /node_modules|\.git|\.cache/.test(path)
    })

    const handle = (type: FileEvent['type']) => (path: string) => {
      // Honeytoken: ningun uso legitimo deberia tocar nunca este fichero senuelo.
      if (isHoneytokenPath(path)) {
        markHoneytokenTriggered(path)
        pushEvent({ id: randomUUID(), path, type, time: new Date().toISOString(), zone: 'user-data', riskScore: 100, riskReasons: ['Honeytoken disparado'] })
        raiseAlert({
          severity: 'critical',
          category: 'filesystem',
          title: 'Honeytoken disparado: posible amenaza activa',
          message: `Se ha accedido/modificado el fichero senuelo ${path}. Ningun proceso legitimo deberia tocarlo — es un fuerte indicador de ransomware, exfiltracion o movimiento lateral en curso.`,
          sourceId: path,
          mitreTechniques: mapReasonsToMitre(['honeytoken'])
        })
        // No hay atribucion de proceso disponible via file-watcher (requeriria auditoria a nivel de SO),
        // asi que la respuesta automatica actua al nivel de host, no de proceso individual.
        if (settings.protection.autoBlock && severityMeetsThreshold('critical', settings.autoBlockSeverity)) {
          isolateHost('Honeytoken disparado: aislamiento preventivo del equipo').catch((err) =>
            logger.error('fileIntegrity', 'Fallo al aislar el equipo tras honeytoken', String(err))
          )
        }
        return
      }

      if (settings.backupBeforeChange && (type === 'add' || type === 'change')) {
        backupFileVersion(path)
      }

      const isBurst = registerUserDataChange()
      const { riskScore, riskReasons } = scoreFileEvent('user-data', path, isBurst)
      const ev: FileEvent = {
        id: randomUUID(),
        path,
        type,
        time: new Date().toISOString(),
        zone: 'user-data',
        riskScore,
        riskReasons
      }
      pushEvent(ev)

      if (isBurst && settings.protection.ransomwareShield) {
        raiseAlert({
          severity: 'critical',
          category: 'ransomware',
          title: 'Posible actividad de ransomware detectada',
          message: `Se han modificado ${BURST_THRESHOLD}+ ficheros en ${watchPaths.join(', ')} en menos de ${BURST_WINDOW_MS / 1000}s. Se recomienda aislar el equipo de la red inmediatamente. Si tienes copias de seguridad activadas, revisa el historial de versiones para restaurar el ultimo estado bueno conocido.`,
          sourceId: path,
          mitreTechniques: mapReasonsToMitre(['ransomware'])
        })
        if (settings.protection.autoBlock && severityMeetsThreshold('critical', settings.autoBlockSeverity) && (type === 'add' || type === 'change')) {
          const result = quarantineFile(path, `Bloqueo automatico: posible rafaga de ransomware en ${watchPaths.join(', ')}.`)
          if (!result.ok) logger.warn('fileIntegrity', `Cuarentena automatica fallida para ${path}`, result.error)
        }
      } else if (riskScore >= 45) {
        const severity = severityFromScore(riskScore)
        raiseAlert({
          severity,
          category: 'filesystem',
          title: 'Fichero sospechoso detectado',
          message: `${riskReasons.join('. ')}: ${path}`,
          sourceId: path,
          mitreTechniques: mapReasonsToMitre(riskReasons)
        })
        if (settings.protection.autoBlock && severityMeetsThreshold(severity, settings.autoBlockSeverity) && (type === 'add' || type === 'change')) {
          const result = quarantineFile(path, `Bloqueo automatico: fichero de severidad ${severity} (${riskReasons.join('. ')}).`)
          if (!result.ok) logger.warn('fileIntegrity', `Cuarentena automatica fallida para ${path}`, result.error)
        }
      }
    }

    watcher.on('add', handle('add'))
    watcher.on('change', handle('change'))
    watcher.on('unlink', handle('unlink'))
    logger.info('fileIntegrity', `Vigilando rutas: ${watchPaths.join(', ')}`)
  }

  if (!criticalTimer) {
    checkCriticalFiles()
    criticalTimer = setInterval(checkCriticalFiles, 15000)
  }
}

const criticalHashes = new Map<string, string>()

function checkCriticalFiles() {
  const settings = getSettings()
  if (!settings.protection.persistenceGuard) return
  const files = getCriticalFiles()
  for (const file of files) {
    const hash = hashFile(file)
    if (!hash) continue
    const prev = criticalHashes.get(file)
    if (prev && prev !== hash) {
      raiseAlert({
        severity: 'high',
        category: file === getHostsPath() ? 'hosts' : 'filesystem',
        title: `Fichero critico modificado: ${file}`,
        message: 'Se ha detectado un cambio no verificado en un fichero critico del sistema. Revisa el contenido cuanto antes.',
        sourceId: file,
        mitreTechniques: mapReasonsToMitre(['fichero critico del sistema'])
      })
    }
    criticalHashes.set(file, hash)

    if (file === getHostsPath()) {
      const suspicious = detectSuspiciousHostsEntries(file)
      hostsStatus = {
        path: file,
        baselineHash: hostsStatus.baselineHash ?? hash,
        currentHash: hash,
        tampered: !!prev && prev !== hash,
        suspiciousEntries: suspicious,
        lastChecked: new Date().toISOString()
      }
      if (suspicious.length) {
        raiseAlert({
          severity: 'critical',
          category: 'hosts',
          title: 'Entradas sospechosas en el fichero hosts',
          message: `Se han detectado redirecciones potencialmente maliciosas: ${suspicious.join(', ')}`,
          sourceId: file,
          mitreTechniques: mapReasonsToMitre(['fichero critico del sistema hosts'])
        })
      }
    }
  }
}

const WATCHED_BRANDS = ['bank', 'paypal', 'microsoft', 'google', 'apple', 'windowsupdate', 'kaspersky', 'avast', 'malwarebytes']

function detectSuspiciousHostsEntries(path: string): string[] {
  try {
    const content = readFileSync(path, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))
    const flagged: string[] = []
    for (const line of lines) {
      const lower = line.toLowerCase()
      if (WATCHED_BRANDS.some((b) => lower.includes(b)) && !lower.includes('127.0.0.1') && !lower.includes('::1')) {
        flagged.push(line.trim())
      }
    }
    return flagged
  } catch {
    return []
  }
}

export function stopFileIntegrityMonitor() {
  watcher?.close()
  watcher = null
  if (criticalTimer) clearInterval(criticalTimer)
  criticalTimer = null
}
