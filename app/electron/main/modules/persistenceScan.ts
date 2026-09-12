import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import type { PersistenceItem } from '../../shared/types'
import { scorePersistence, severityFromScore, mapReasonsToMitre } from './threatEngine'
import { raiseAlert } from './alerts'
import { getSettings } from './store'
import { logger } from './logger'

const execAsync = promisify(exec)
let latest: PersistenceItem[] = []
const knownKeys = new Set<string>()
let baselineDone = false
let timer: NodeJS.Timeout | null = null

export function getLatestPersistence(): PersistenceItem[] {
  return latest
}

function makeItem(source: PersistenceItem['source'], name: string, command: string, location: string): PersistenceItem {
  const { riskScore, riskReasons } = scorePersistence({ name, command, location })
  return {
    id: `${source}:${location}:${name}`,
    source,
    name,
    command,
    location,
    riskScore,
    riskReasons,
    discoveredAt: new Date().toISOString()
  }
}

async function scanLinux(): Promise<PersistenceItem[]> {
  const items: PersistenceItem[] = []
  const home = homedir()

  try {
    const { stdout } = await execAsync('crontab -l').catch(() => ({ stdout: '' }))
    stdout
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
      .forEach((line) => items.push(makeItem('cron', 'crontab de usuario', line.trim(), '~/crontab')))
  } catch {
    /* sin crontab */
  }

  const autostartDir = join(home, '.config', 'autostart')
  if (existsSync(autostartDir)) {
    for (const file of readdirSync(autostartDir).filter((f) => f.endsWith('.desktop'))) {
      const full = join(autostartDir, file)
      try {
        const content = readFileSync(full, 'utf-8')
        const execLine = content.match(/^Exec=(.*)$/m)?.[1] || ''
        items.push(makeItem('autostart-desktop', file, execLine, full))
      } catch {
        /* ignore */
      }
    }
  }

  const systemdUserDir = join(home, '.config', 'systemd', 'user')
  if (existsSync(systemdUserDir)) {
    for (const file of readdirSync(systemdUserDir).filter((f) => f.endsWith('.service'))) {
      const full = join(systemdUserDir, file)
      try {
        const content = readFileSync(full, 'utf-8')
        const execStart = content.match(/^ExecStart=(.*)$/m)?.[1] || ''
        items.push(makeItem('systemd', file, execStart, full))
      } catch {
        /* ignore */
      }
    }
  }

  return items
}

async function scanWindows(): Promise<PersistenceItem[]> {
  const items: PersistenceItem[] = []
  const keys = [
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  ]
  for (const key of keys) {
    try {
      const { stdout } = await execAsync(`reg query "${key}"`)
      const lines = stdout.split('\n').filter((l) => /REG_SZ|REG_EXPAND_SZ/.test(l))
      for (const line of lines) {
        const parts = line.trim().split(/\s{2,}/)
        const name = parts[0] || 'desconocido'
        const command = parts.slice(2).join(' ')
        items.push(makeItem('registry', name, command, key))
      }
    } catch {
      /* clave no accesible */
    }
  }
  return items
}

async function scanMac(): Promise<PersistenceItem[]> {
  const items: PersistenceItem[] = []
  const home = homedir()
  const dirs: Array<{ path: string; source: PersistenceItem['source'] }> = [
    { path: join(home, 'Library', 'LaunchAgents'), source: 'launchagent' },
    { path: '/Library/LaunchAgents', source: 'launchagent' },
    { path: '/Library/LaunchDaemons', source: 'launchdaemon' }
  ]
  for (const dir of dirs) {
    if (!existsSync(dir.path)) continue
    for (const file of readdirSync(dir.path).filter((f) => f.endsWith('.plist'))) {
      const full = join(dir.path, file)
      try {
        const content = readFileSync(full, 'utf-8')
        const match = content.match(/<key>Program(?:Arguments)?<\/key>\s*(?:<array>)?\s*<string>(.*?)<\/string>/s)
        items.push(makeItem(dir.source, file, match?.[1] || '', full))
      } catch {
        /* ignore */
      }
    }
  }
  return items
}

export async function scanPersistence(): Promise<PersistenceItem[]> {
  const os = platform()
  let items: PersistenceItem[] = []
  try {
    if (os === 'linux') items = await scanLinux()
    else if (os === 'win32') items = await scanWindows()
    else if (os === 'darwin') items = await scanMac()
  } catch (err) {
    logger.error('persistenceScan', 'Fallo al escanear autoarranque', String(err))
  }

  latest = items

  const settings = getSettings()
  if (settings.protection.persistenceGuard) {
    if (!baselineDone) {
      items.forEach((i) => knownKeys.add(i.id))
      baselineDone = true
    } else {
      for (const item of items) {
        if (knownKeys.has(item.id)) continue
        knownKeys.add(item.id)
        raiseAlert({
          severity: item.riskScore > 0 ? severityFromScore(item.riskScore) : 'medium',
          category: 'persistence',
          title: `Nueva entrada de autoarranque: ${item.name}`,
          message: `Se ha registrado un nuevo punto de persistencia (${item.source}). Comando: ${item.command || 'n/d'}`,
          sourceId: item.id,
          mitreTechniques: mapReasonsToMitre(['autoarranque', ...item.riskReasons])
        })
      }
    }
  }

  return items
}

export function startPersistenceScan(intervalMs = 60_000) {
  if (timer) return
  scanPersistence()
  timer = setInterval(scanPersistence, intervalMs)
}

export function stopPersistenceScan() {
  if (timer) clearInterval(timer)
  timer = null
}
