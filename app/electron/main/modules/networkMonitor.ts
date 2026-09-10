import si from 'systeminformation'
import type { NetworkConnection } from '../../shared/types'
import { scoreConnection, severityFromScore } from './threatEngine'
import { raiseAlert } from './alerts'
import { isIpBlocked } from './firewall'
import { getSettings } from './store'
import { logger } from './logger'

let latest: NetworkConnection[] = []
let timer: NodeJS.Timeout | null = null
const alertedRecently = new Map<string, number>()
const ALERT_COOLDOWN_MS = 10 * 60 * 1000

interface ScanWindowEntry {
  targets: Set<string>
  windowStart: number
}
const outboundFanout = new Map<number, ScanWindowEntry>()
const SCAN_WINDOW_MS = 60_000

export function getLatestConnections(): NetworkConnection[] {
  return latest
}

export async function pollConnections(): Promise<NetworkConnection[]> {
  const settings = getSettings()
  try {
    const conns = await si.networkConnections()
    const list: NetworkConnection[] = conns.map((c) => {
      const remoteAddress = c.peerAddress || ''
      const remotePort = c.peerPort ? Number(c.peerPort) : 0
      const processName = c.process || 'desconocido'
      const { riskScore, riskReasons } = scoreConnection({
        remoteAddress,
        remotePort,
        state: c.state || '',
        processName
      })
      return {
        id: `${c.protocol}:${c.localAddress}:${c.localPort}-${remoteAddress}:${remotePort}:${c.pid}`,
        protocol: c.protocol || 'tcp',
        localAddress: c.localAddress || '',
        localPort: c.localPort ? Number(c.localPort) : 0,
        remoteAddress,
        remotePort,
        state: c.state || '',
        pid: c.pid || 0,
        processName,
        riskScore,
        riskReasons,
        blocked: remoteAddress ? isIpBlocked(remoteAddress) : false
      }
    })

    latest = list

    if (settings.protection.networkGuard) {
      detectPortScanning(list, settings.connectionsPerMinuteThreshold)

      for (const conn of list) {
        if (conn.riskScore < 40 || !conn.remoteAddress) continue
        const key = `${conn.remoteAddress}:${conn.remotePort}:${conn.pid}`
        const last = alertedRecently.get(key) || 0
        if (Date.now() - last < ALERT_COOLDOWN_MS) continue
        alertedRecently.set(key, Date.now())
        raiseAlert({
          severity: severityFromScore(conn.riskScore),
          category: 'network',
          title: `Conexion sospechosa hacia ${conn.remoteAddress}:${conn.remotePort}`,
          message: `${conn.riskReasons.join('. ')}. Proceso: ${conn.processName} (PID ${conn.pid}).`,
          sourceId: conn.id
        })
      }
    }

    return list
  } catch (err) {
    logger.error('networkMonitor', 'Fallo al listar conexiones de red', String(err))
    return latest
  }
}

function detectPortScanning(list: NetworkConnection[], threshold: number) {
  const now = Date.now()
  const byPid = new Map<number, Set<string>>()
  for (const c of list) {
    if (!c.remoteAddress) continue
    if (!byPid.has(c.pid)) byPid.set(c.pid, new Set())
    byPid.get(c.pid)!.add(`${c.remoteAddress}:${c.remotePort}`)
  }

  for (const [pid, targets] of byPid) {
    let entry = outboundFanout.get(pid)
    if (!entry || now - entry.windowStart > SCAN_WINDOW_MS) {
      entry = { targets: new Set(), windowStart: now }
      outboundFanout.set(pid, entry)
    }
    for (const t of targets) entry.targets.add(t)

    if (entry.targets.size >= threshold) {
      const key = `scan:${pid}`
      const last = alertedRecently.get(key) || 0
      if (now - last > ALERT_COOLDOWN_MS) {
        alertedRecently.set(key, now)
        const proc = list.find((c) => c.pid === pid)
        raiseAlert({
          severity: 'high',
          category: 'network',
          title: 'Posible escaneo de puertos detectado',
          message: `El proceso ${proc?.processName || 'desconocido'} (PID ${pid}) ha contactado con ${entry.targets.size} combinaciones IP:puerto distintas en menos de un minuto.`,
          sourceId: String(pid)
        })
      }
      entry.targets.clear()
      entry.windowStart = now
    }
  }
}

export function startNetworkMonitor(intervalMs = 4000) {
  if (timer) return
  pollConnections()
  timer = setInterval(pollConnections, intervalMs)
}

export function stopNetworkMonitor() {
  if (timer) clearInterval(timer)
  timer = null
}
